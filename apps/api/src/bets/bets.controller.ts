import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { CurrentUser, type AuthenticatedUser } from "../common/current-user.decorator.js";
import { JwtAuthGuard } from "../common/jwt-auth.guard.js";
import { PlaceBetDto } from "./bets.dto.js";
import { BetsService } from "./bets.service.js";

@Controller("bets")
@UseGuards(JwtAuthGuard)
export class BetsController {
  constructor(private readonly bets: BetsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.bets.list(user.id);
  }

  @Post()
  place(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: PlaceBetDto,
  ) {
    return this.bets.place(user.id, input);
  }
}
