import { Module } from "@nestjs/common";
import { StandingsModule } from "../standings/standings.module.js";
import { LeaderboardController } from "./leaderboard.controller.js";
import { LeaderboardGateway } from "./leaderboard.gateway.js";
import { LeaderboardService } from "./leaderboard.service.js";
import { RedisLeaderboardBridge } from "./redis-leaderboard.bridge.js";

@Module({
  imports: [StandingsModule],
  controllers: [LeaderboardController],
  providers: [LeaderboardService, LeaderboardGateway, RedisLeaderboardBridge],
  exports: [LeaderboardService, LeaderboardGateway],
})
export class LeaderboardModule {}
