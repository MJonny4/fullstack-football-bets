import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "./auth/auth.module.js";
import { BetsModule } from "./bets/bets.module.js";
import { SecurityModule } from "./common/security.module.js";
import { DevModule } from "./dev/dev.module.js";
import { HealthController } from "./health.controller.js";
import { LeaderboardModule } from "./leaderboard/leaderboard.module.js";
import { MailModule } from "./mail/mail.module.js";
import { RoundsModule } from "./rounds/rounds.module.js";
import { StandingsModule } from "./standings/standings.module.js";
import { TeamsModule } from "./teams/teams.module.js";
import { UsersModule } from "./users/users.module.js";

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      name: "default",
      ttl: 60_000,
      limit: process.env.NODE_ENV === "test" ? 10_000 : 300,
    }]),
    SecurityModule,
    LeaderboardModule,
    MailModule,
    AuthModule,
    UsersModule,
    RoundsModule,
    StandingsModule,
    BetsModule,
    TeamsModule,
    DevModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
