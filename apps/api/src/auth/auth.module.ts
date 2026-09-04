import { Module } from "@nestjs/common";
import { LeaderboardModule } from "../leaderboard/leaderboard.module.js";
import { MailModule } from "../mail/mail.module.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";

@Module({
  imports: [LeaderboardModule, MailModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
