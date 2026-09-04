import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser, type AuthenticatedUser } from "../common/current-user.decorator.js";
import { SessionAuthGuard } from "../common/session-auth.guard.js";
import { SaveLineupDraftDto, SaveLineupDto } from "./teams.dto.js";
import { TeamsService } from "./teams.service.js";

@Controller("teams")
@UseGuards(SessionAuthGuard)
export class TeamsController {
  constructor(@Inject(TeamsService) private readonly teams: TeamsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.teams.list(user.id);
  }

  @Get("me")
  managerDetail(@CurrentUser() user: AuthenticatedUser) {
    return this.teams.managerDetail(user.id);
  }

  @Put("me/draft")
  saveDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: SaveLineupDraftDto,
  ) {
    return this.teams.saveDraft(user.id, input);
  }

  @Post("me/publish")
  publishDraft(@CurrentUser() user: AuthenticatedUser) {
    return this.teams.publishDraft(user.id);
  }

  @Put("me/lineup")
  saveLineup(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: SaveLineupDto,
  ) {
    return this.teams.saveLineup(user.id, input);
  }

  @Get(":id/history")
  matchHistory(
    @Param("id") teamId: string,
    @Query("cursor") cursor?: string,
  ) {
    return this.teams.matchHistory(teamId, cursor);
  }

  @Get(":id")
  detail(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") teamId: string,
  ) {
    return this.teams.detail(user.id, teamId);
  }

  @Post(":id/claim")
  claim(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") teamId: string,
  ) {
    return this.teams.claim(user.id, teamId);
  }

}
