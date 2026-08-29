import { Controller, Get } from "@nestjs/common";
import { LeaderboardService } from "./leaderboard.service.js";

@Controller("leaderboard")
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  @Get()
  list() {
    return this.leaderboard.list();
  }
}
