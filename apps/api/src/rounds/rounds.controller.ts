import { Controller, Get } from "@nestjs/common";
import { RoundsService } from "./rounds.service.js";

@Controller("rounds")
export class RoundsController {
  constructor(private readonly rounds: RoundsService) {}

  @Get("current")
  current() {
    return this.rounds.current();
  }
}
