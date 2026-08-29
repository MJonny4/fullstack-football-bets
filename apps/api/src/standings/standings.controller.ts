import { Controller, Get, Inject } from "@nestjs/common";
import { StandingsService } from "./standings.service.js";

@Controller("standings")
export class StandingsController {
  constructor(
    @Inject(StandingsService)
    private readonly standings: StandingsService,
  ) {}

  @Get()
  current() {
    return this.standings.current();
  }
}
