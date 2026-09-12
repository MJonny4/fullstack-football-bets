import { Injectable } from "@nestjs/common";
import { prisma, readMatchCenter, SnapshotCache } from "@fb/core";
import type { MatchCenterDto } from "@fb/shared";

@Injectable()
export class MatchSnapshotService {
  // Public match data only. Never cache user balances, sessions, or own bets here.
  private readonly cache = new SnapshotCache<MatchCenterDto>(id => readMatchCenter(prisma, id));
  get(matchId: string) { return this.cache.get(matchId); }
  invalidate(matchId: string) { this.cache.invalidate(matchId); }
}
