import { Module } from "@nestjs/common";
import { LeaderboardModule } from "../leaderboard/leaderboard.module.js";
import { TeamsController } from "./teams.controller.js";
import { TeamsService } from "./teams.service.js";

@Module({
  imports: [LeaderboardModule],
  controllers: [TeamsController],
  providers: [TeamsService],
})
export class TeamsModule {}
