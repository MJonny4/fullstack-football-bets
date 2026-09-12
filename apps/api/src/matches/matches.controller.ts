import { BadRequestException, Controller, Get, Inject, NotFoundException, Param, Query } from "@nestjs/common";
import { MatchNotFoundError, prisma } from "@fb/core";
import type { LiveEvent } from "@fb/shared";
import { MatchAudienceService } from "../leaderboard/match-audience.service.js";
import { MatchSnapshotService } from "../leaderboard/match-snapshot.service.js";

@Controller("matches")
export class MatchesController {
  constructor(@Inject(MatchAudienceService) private readonly audience: MatchAudienceService,
    @Inject(MatchSnapshotService) private readonly snapshots: MatchSnapshotService) {}

  @Get(":id/live")
  async live(@Param("id") id: string) {
    try {
      const match = await this.snapshots.get(id);
      if (match.supportsLive && !match.result) this.audience.touch(id);
      return match;
    } catch (error) {
      if (error instanceof MatchNotFoundError) throw new NotFoundException("Match not found");
      throw error;
    }
  }

  @Get(":id/events")
  async events(@Param("id") id: string, @Query("afterSequence") afterText = "0") {
    if (!/^\d{1,10}$/.test(afterText)) throw new BadRequestException("afterSequence must be a non-negative integer");
    const after = Number(afterText);
    if (!await prisma.match.findUnique({ where: { id }, select: { id: true } })) throw new NotFoundException("Match not found");
    const events = await prisma.matchEvent.findMany({ where: { matchId: id, sequence: { gt: after } },
      orderBy: { sequence: "asc" }, take: 101 });
    const page = events.slice(0, 100);
    return { events: page.map(e => e.payload as unknown as LiveEvent),
      nextSequence: events.length > 100 ? page.at(-1)!.sequence : null };
  }
}
