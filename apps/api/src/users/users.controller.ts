import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { prisma } from "@fb/core";
import { CurrentUser, type AuthenticatedUser } from "../common/current-user.decorator.js";
import { SessionAuthGuard } from "../common/session-auth.guard.js";
import { clearSessionCookie } from "../common/session.js";
import {
  ChangePasswordDto,
  DeactivateAccountDto,
  UpdateProfileDto,
} from "./users.dto.js";
import { UsersService } from "./users.service.js";

@Controller("users")
@UseGuards(SessionAuthGuard)
export class UsersController {
  constructor(@Inject(UsersService) private readonly users: UsersService) {}

  @Get("me")
  me(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.users.me(currentUser.id);
  }

  @Patch("me/profile")
  updateProfile(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() input: UpdateProfileDto,
  ) {
    return this.users.updateProfile(currentUser.id, input);
  }

  @Post("me/avatar")
  @UseInterceptors(FileInterceptor("avatar", { limits: { fileSize: 2 * 1024 * 1024 } }))
  updateAvatar(
    @CurrentUser() currentUser: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.users.updateAvatar(currentUser.id, file);
  }

  @Delete("me/avatar")
  removeAvatar(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.users.removeAvatar(currentUser.id);
  }

  @Post("me/password")
  @HttpCode(HttpStatus.OK)
  changePassword(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() input: ChangePasswordDto,
  ) {
    return this.users.changePassword(currentUser.id, currentUser.sessionId, input);
  }

  @Post("me/deactivate")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() input: DeactivateAccountDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.users.deactivate(currentUser.id, input);
    clearSessionCookie(response);
  }

  @Get("me/ledger")
  ledger(@CurrentUser() currentUser: AuthenticatedUser) {
    return prisma.ledgerEntry.findMany({
      where: { userId: currentUser.id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 100,
    });
  }

  @Get(":username/avatar")
  @Header("Cache-Control", "public, max-age=31536000, immutable")
  async avatar(@Param("username") username: string) {
    const avatar = await this.users.avatar(username);
    return new StreamableFile(avatar.avatarData as Uint8Array, {
      type: avatar.avatarMimeType ?? "image/webp",
    });
  }

  @Get(":username")
  publicProfile(@Param("username") username: string) {
    return this.users.publicProfile(username);
  }
}
