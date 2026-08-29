import { Module } from "@nestjs/common";
import { LeaderboardModule } from "../leaderboard/leaderboard.module.js";
import { BetsController } from "./bets.controller.js";
import { BetsService } from "./bets.service.js";

@Module({
  imports: [LeaderboardModule],
  controllers: [BetsController],
  providers: [BetsService],
})
export class BetsModule {}
