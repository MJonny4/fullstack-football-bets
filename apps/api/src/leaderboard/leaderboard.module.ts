import { Module } from "@nestjs/common";
import { RoundsModule } from "../rounds/rounds.module.js";
import { StandingsModule } from "../standings/standings.module.js";
import { LeaderboardController } from "./leaderboard.controller.js";
import { LeaderboardGateway } from "./leaderboard.gateway.js";
import { LeaderboardService } from "./leaderboard.service.js";
import { RedisLeaderboardBridge } from "./redis-leaderboard.bridge.js";
import { MatchAudienceService } from "./match-audience.service.js";
import { MatchSnapshotService } from "./match-snapshot.service.js";

@Module({
  imports: [RoundsModule, StandingsModule],
  controllers: [LeaderboardController],
  providers: [LeaderboardService, LeaderboardGateway, RedisLeaderboardBridge, MatchAudienceService, MatchSnapshotService],
  exports: [LeaderboardService, LeaderboardGateway, MatchAudienceService, MatchSnapshotService],
})
export class LeaderboardModule {}
