import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { compare, hash } from "bcryptjs";
import { prisma } from "@fb/core";
import sharp from "sharp";
import { isPrismaError } from "../common/prisma-errors.js";
import { SessionService } from "../common/session.service.js";
import { serializeTeam } from "../common/team-response.js";
import {
  privateUserResponse,
  publicUserResponse,
} from "../common/user-response.js";
import { LeaderboardGateway } from "../leaderboard/leaderboard.gateway.js";
import type {
  ChangePasswordDto,
  DeactivateAccountDto,
  UpdateProfileDto,
} from "./users.dto.js";

const RESERVED_USERNAMES = new Set([
  "admin",
  "api",
  "help",
  "login",
  "logout",
  "manager",
  "profile",
  "register",
  "settings",
  "support",
  "team",
]);

@Injectable()
export class UsersService {
  constructor(
    private readonly sessions: SessionService,
    private readonly liveUpdates: LeaderboardGateway,
  ) {}

  async me(userId: string) {
    const user = await prisma.user.findFirstOrThrow({
      where: { id: userId, deactivatedAt: null },
      include: {
        dtAssignment: { include: { team: true } },
      },
    });
    return {
      ...privateUserResponse(user),
      dtAssignment: user.dtAssignment
        ? {
            ...user.dtAssignment,
            team: serializeTeam(user.dtAssignment.team),
          }
        : null,
    };
  }

  async publicProfile(username: string) {
    const user = await prisma.user.findFirst({
      where: { username: username.trim().toLowerCase(), deactivatedAt: null },
      select: {
        username: true,
        displayName: true,
        avatarUpdatedAt: true,
        dtAssignment: {
          select: {
            team: { select: { id: true, name: true, crestImageUrl: true } },
          },
        },
      },
    });
    if (!user) throw new NotFoundException("Manager profile not found");
    return {
      ...publicUserResponse(user),
      team: user.dtAssignment?.team ?? null,
    };
  }

  async updateProfile(userId: string, input: UpdateProfileDto) {
    if (input.username && RESERVED_USERNAMES.has(input.username)) {
      throw new ConflictException("That username is reserved");
    }
    if (input.username === undefined && input.displayName === undefined) {
      throw new BadRequestException("Provide a username or display name to update");
    }

    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(input.username !== undefined ? { username: input.username } : {}),
          ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
        },
      });
    } catch (error) {
      if (isPrismaError(error, "P2002")) {
        throw new ConflictException("That username is already taken");
      }
      throw error;
    }
    await this.liveUpdates.broadcast();
    return this.me(userId);
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      throw new BadRequestException("Choose a JPEG, PNG, or WebP image");
    }

    let avatarData: Buffer;
    try {
      avatarData = await sharp(file.buffer, { failOn: "warning" })
        .rotate()
        .resize(320, 320, { fit: "cover", position: "attention" })
        .webp({ quality: 84 })
        .toBuffer();
    } catch {
      throw new BadRequestException("The uploaded image could not be processed");
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        avatarData: new Uint8Array(avatarData),
        avatarMimeType: "image/webp",
        avatarUpdatedAt: new Date(),
      },
    });
    await this.liveUpdates.broadcast();
    return this.me(userId);
  }

  async removeAvatar(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        avatarData: null,
        avatarMimeType: null,
        avatarUpdatedAt: null,
      },
    });
    await this.liveUpdates.broadcast();
    return this.me(userId);
  }

  async avatar(username: string) {
    const user = await prisma.user.findFirst({
      where: { username: username.trim().toLowerCase(), deactivatedAt: null },
      select: { avatarData: true, avatarMimeType: true, avatarUpdatedAt: true },
    });
    if (!user?.avatarData || !user.avatarMimeType || !user.avatarUpdatedAt) {
      throw new NotFoundException("Avatar not found");
    }
    return user;
  }

  async changePassword(userId: string, sessionId: string, input: ChangePasswordDto) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!(await compare(input.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException("Your current password is incorrect");
    }
    if (input.currentPassword === input.newPassword) {
      throw new BadRequestException("Choose a password you have not just used");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hash(input.newPassword, 12) },
    });
    await this.sessions.revokeOthers(userId, sessionId);
    return { changed: true };
  }

  async deactivate(userId: string, input: DeactivateAccountDto): Promise<void> {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!(await compare(input.password, user.passwordHash))) {
      throw new UnauthorizedException("Your password is incorrect");
    }

    const now = new Date();
    await prisma.$transaction([
      prisma.dTAssignment.deleteMany({ where: { userId } }),
      prisma.accountToken.deleteMany({ where: { userId } }),
      prisma.userSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { deactivatedAt: now },
      }),
    ]);
    await this.liveUpdates.broadcast();
  }
}
