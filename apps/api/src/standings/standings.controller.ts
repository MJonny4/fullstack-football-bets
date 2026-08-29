import { Controller, Get } from "@nestjs/common";
import { StandingsService } from "./standings.service.js";

@Controller("standings")
export class StandingsController {
  constructor(private readonly standings: StandingsService) {}

  @Get()
  current() {
    return this.standings.current();
  }
}
