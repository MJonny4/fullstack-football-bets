import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module.js";
import { BetsModule } from "./bets/bets.module.js";
import { SecurityModule } from "./common/security.module.js";
import { DevModule } from "./dev/dev.module.js";
import { HealthController } from "./health.controller.js";
import { LeaderboardModule } from "./leaderboard/leaderboard.module.js";
import { RoundsModule } from "./rounds/rounds.module.js";
import { StandingsModule } from "./standings/standings.module.js";
import { TeamsModule } from "./teams/teams.module.js";
import { UsersModule } from "./users/users.module.js";

@Module({
  imports: [
    SecurityModule,
    LeaderboardModule,
    AuthModule,
    UsersModule,
    RoundsModule,
    StandingsModule,
    BetsModule,
    TeamsModule,
    DevModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
