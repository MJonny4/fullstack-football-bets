import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { advanceLiveMatch, flushMatchOutbox, prisma, progressLiveMatches, settleLiveMatch } from '@fb/core';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';
import { LeaderboardGateway } from '../src/leaderboard/leaderboard.gateway.js';
import { MatchAudienceService } from '../src/leaderboard/match-audience.service.js';
import { MatchSnapshotService } from '../src/leaderboard/match-snapshot.service.js';
import type { Request, Response } from 'express';

// This executable is only used by Playwright. Never mount its clock in AppModule.
if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL?.endsWith('?schema=live_browser')) {
  throw new Error('Browser server requires the isolated live_browser test schema');
}
const app = configureApp(await NestFactory.create(AppModule, { logger: ['error', 'warn'] }));
const gateway = app.get(LeaderboardGateway);
const audience = app.get(MatchAudienceService);
app.getHttpAdapter().post('/__test/schedule/:id', async (request: Request, response: Response) => {
  try {
    const id = request.params.id as string;
    const match = await prisma.match.findUniqueOrThrow({ where: { id } });
    const scheduledAt = new Date(Date.now() + 3000);
    await prisma.$transaction([
      prisma.round.update({ where: { id: match.roundId }, data: { bettingClosesAt: new Date(Date.now() - 1000) } }),
      prisma.match.update({ where: { id }, data: { scheduledAt, lineupLocksAt: new Date(scheduledAt.getTime() - 3_600_000) } }),
    ]);
    app.get(MatchSnapshotService).invalidate(id);
    await gateway.broadcast();
    response.json({ scheduledAt });
  } catch (error) { response.status(500).json({ error: String(error) }); }
});
app.getHttpAdapter().post('/__test/advance/:id', async (request: Request, response: Response) => {
  try {
    const id = request.params.id as string;
    const seconds = Number(request.query.seconds);
    if (![30, 150, 600].includes(seconds)) { response.status(400).json({ error: 'Invalid test clock' }); return; }
    const simulation = await prisma.matchSimulation.findUniqueOrThrow({ where: { matchId: id } });
    // Retry a revision collision with the real ticker; a test clock must actually
    // reach its requested boundary before returning success.
    for (let attempt = 0; attempt < 3; attempt++) {
      if (await advanceLiveMatch(prisma, id, new Date(simulation.startedAt.getTime() + seconds * 1000), 2000)) break;
    }
    const checkpoint = await prisma.matchSimulation.findUniqueOrThrow({ where: { matchId: id } });
    if (checkpoint.phase === 'FINISHED') await settleLiveMatch(prisma, id);
    await gateway.broadcastMatch(id, checkpoint.phase === 'FINISHED');
    response.json({ phase: checkpoint.phase });
  } catch (error) { response.status(500).json({ error: String(error) }); }
});
await app.listen(3100, '127.0.0.1');
let ticking = false;
const ticker = setInterval(async () => {
  if (ticking) return;
  ticking = true;
  try {
    const result = await progressLiveMatches(prisma, new Date(), { watchedMatchIds: audience.watchedMatchIds() });
    for (const error of result.errors) console.error(error);
    await flushMatchOutbox(prisma, message => gateway.broadcastMatch(message.matchId, message.settled));
  } catch (error) { console.error(error); }
  finally { ticking = false; }
}, 1000);
async function close() { clearInterval(ticker); await app.close(); await prisma.$disconnect(); process.exit(0); }
process.on('SIGTERM', () => { void close(); });
process.on('SIGINT', () => { void close(); });
