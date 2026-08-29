import { Module } from "@nestjs/common";
import { LeaderboardModule } from "../leaderboard/leaderboard.module.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";

@Module({
  imports: [LeaderboardModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
