import { Controller, Get, Inject } from "@nestjs/common";
import { LeaderboardService } from "./leaderboard.service.js";

@Controller("leaderboard")
export class LeaderboardController {
  constructor(
    @Inject(LeaderboardService)
    private readonly leaderboard: LeaderboardService,
  ) {}

  @Get()
  list() {
    return this.leaderboard.list();
  }
}
