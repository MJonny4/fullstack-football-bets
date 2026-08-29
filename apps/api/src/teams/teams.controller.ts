import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser, type AuthenticatedUser } from "../common/current-user.decorator.js";
import { JwtAuthGuard } from "../common/jwt-auth.guard.js";
import { SaveLineupDto } from "./teams.dto.js";
import { TeamsService } from "./teams.service.js";

@Controller("teams")
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private readonly teams: TeamsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.teams.list(user.id);
  }

  @Post(":id/claim")
  claim(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") teamId: string,
  ) {
    return this.teams.claim(user.id, teamId);
  }

  @Put("me/lineup")
  saveLineup(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: SaveLineupDto,
  ) {
    return this.teams.saveLineup(user.id, input);
  }
}
