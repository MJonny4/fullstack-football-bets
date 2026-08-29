import { Controller, Get, Inject } from "@nestjs/common";
import { RoundsService } from "./rounds.service.js";

@Controller("rounds")
export class RoundsController {
  constructor(@Inject(RoundsService) private readonly rounds: RoundsService) {}

  @Get("current")
  current() {
    return this.rounds.current();
  }
}
