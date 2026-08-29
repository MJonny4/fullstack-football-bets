import { Module } from "@nestjs/common";
import { LeaderboardModule } from "../leaderboard/leaderboard.module.js";
import { StandingsModule } from "../standings/standings.module.js";
import { TeamsController } from "./teams.controller.js";
import { TeamsService } from "./teams.service.js";

@Module({
  imports: [LeaderboardModule, StandingsModule],
  controllers: [TeamsController],
  providers: [TeamsService],
})
export class TeamsModule {}
