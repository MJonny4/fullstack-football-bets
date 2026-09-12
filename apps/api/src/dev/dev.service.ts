import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  closeBettingWindows,
  openNextRound,
  prisma,
  resolveDueMatches,
  initializeLiveMatch,
  advanceLiveMatch,
} from "@fb/core";
import { LIVE_ENGINE_VERSION, type ResultEngine } from "@fb/shared";
import { LeaderboardGateway } from "../leaderboard/leaderboard.gateway.js";
import { RESULT_ENGINE, MATCH_SIMULATION_VERSION } from "./result-engine.provider.js";

@Injectable()
export class DevService {
  constructor(
    @Inject(RESULT_ENGINE) private readonly engine: ResultEngine,
    @Inject(MATCH_SIMULATION_VERSION) private readonly simulationVersion: typeof LIVE_ENGINE_VERSION | null,
    @Inject(LeaderboardGateway)
    private readonly leaderboard: LeaderboardGateway,
  ) {}

  async openRound() {
    this.ensureEnabled();
    try {
      const result = await openNextRound(prisma, {
        now: new Date(),
        timezone: process.env.APP_TZ ?? "Europe/Madrid",
        topupAmount: Number(process.env.TOPUP_AMOUNT ?? 200),
        force: true,
        simulationVersion: this.simulationVersion,
      });
      await this.leaderboard.broadcast();
      return result;
    } catch (error) {
      if (error instanceof Error && /open round/i.test(error.message)) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  async closeWindow() {
    this.ensureEnabled();
    const result = await closeBettingWindows(prisma, {
      now: new Date(),
      force: true,
    });
    await this.leaderboard.broadcast();
    return result;
  }

  async resolveDue() {
    this.ensureEnabled();
    const result = await resolveDueMatches(prisma, this.engine, {
      now: new Date(),
      force: true,
    });
    await this.leaderboard.broadcast();
    return result;
  }

  async kickoff(matchId: string) {
    this.ensureEnabled();
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundException("Match not found");
    if (!match.simulationVersion) throw new ConflictException("This fixture uses the legacy result model");
    // Close this round only. Live kickoff cannot reopen any betting window.
    await prisma.round.updateMany({ where: { id: match.roundId, status: "OPEN" }, data: { status: "CLOSED" } });
    try {
      const now = new Date();
      await initializeLiveMatch(prisma, matchId, now, true);
      await advanceLiveMatch(prisma, matchId, now);
      await this.leaderboard.broadcast();
      await this.leaderboard.broadcastMatch(matchId);
      return { matchId, started: true };
    } catch (error) {
      throw new ConflictException(error instanceof Error ? error.message : "Could not start match");
    }
  }

  private ensureEnabled() {
    if (process.env.DEV_TOOLS?.toLowerCase() !== "true") {
      throw new NotFoundException();
    }
  }
}
