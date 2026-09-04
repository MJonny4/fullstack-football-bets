import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { compare, hash } from "bcryptjs";
import {
  AccountTokenPurpose,
  createUserWithInitialBalance,
  prisma,
} from "@fb/core";
import { createOpaqueToken, hashOpaqueToken } from "../common/session.js";
import { SessionService } from "../common/session.service.js";
import { privateUserResponse } from "../common/user-response.js";
import { LeaderboardGateway } from "../leaderboard/leaderboard.gateway.js";
import { MailService } from "../mail/mail.service.js";
import { isPrismaError } from "../common/prisma-errors.js";
import type {
  CredentialsDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  SignupDto,
  TokenDto,
} from "./auth.dto.js";

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

function startingBalance(): number {
  const value = Number(process.env.INITIAL_COIN_BALANCE ?? 1_000);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error("INITIAL_COIN_BALANCE must be a positive integer");
  }
  return value;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(SessionService)
    private readonly sessions: SessionService,
    @Inject(LeaderboardGateway)
    private readonly leaderboard: LeaderboardGateway,
    @Inject(MailService)
    private readonly mail: MailService,
  ) {}

  async signup(credentials: SignupDto) {
    const username = credentials.username
      ? this.assertAvailableUsername(credentials.username)
      : await this.generatedUsername(credentials.email);
    const displayName = credentials.displayName?.trim() || this.displayNameFromEmail(credentials.email);
    const passwordHash = await hash(credentials.password, 12);

    try {
      const user = await createUserWithInitialBalance(prisma, {
        email: credentials.email,
        username,
        displayName,
        passwordHash,
        initialBalance: startingBalance(),
      });
      const session = await this.sessions.create(user.id);
      await Promise.all([
        this.leaderboard.broadcast(),
        this.sendVerificationEmail(user),
      ]);
      return { token: session.token, user: privateUserResponse(user) };
    } catch (error) {
      if (isPrismaError(error, "P2002")) {
        throw new ConflictException("That email address or username is already in use");
      }
      throw error;
    }
  }

  async login(credentials: CredentialsDto) {
    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
    });
    if (
      !user ||
      user.deactivatedAt ||
      !(await compare(credentials.password, user.passwordHash))
    ) {
      throw new UnauthorizedException("Invalid email or password");
    }
    const session = await this.sessions.create(user.id);
    return { token: session.token, user: privateUserResponse(user) };
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessions.revoke(sessionId);
  }

  async requestPasswordReset(input: ForgotPasswordDto): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || user.deactivatedAt) return;

    const token = await this.issueAccountToken(user.id, AccountTokenPurpose.PASSWORD_RESET, 60);
    const url = this.actionUrl("/reset-password", token);
    await this.mail.send({
      to: user.email,
      subject: "Reset your Touchline password",
      text: `Reset your password using this link (valid for one hour): ${url}`,
      html: `<p>Reset your Touchline password using the link below. It is valid for one hour.</p><p><a href="${url}">Reset password</a></p>`,
    });
  }

  async resetPassword(input: ResetPasswordDto) {
    const token = await prisma.accountToken.findUnique({
      where: { tokenHash: hashOpaqueToken(input.token) },
      include: { user: true },
    });
    if (
      !token ||
      token.purpose !== AccountTokenPurpose.PASSWORD_RESET ||
      token.consumedAt ||
      token.expiresAt.getTime() <= Date.now() ||
      token.user.deactivatedAt
    ) {
      throw new BadRequestException("This password reset link is invalid or expired");
    }

    const passwordHash = await hash(input.password, 12);
    const now = new Date();
    const user = await prisma.$transaction(async (tx) => {
      await tx.accountToken.update({
        where: { id: token.id },
        data: { consumedAt: now },
      });
      await tx.userSession.updateMany({
        where: { userId: token.userId, revokedAt: null },
        data: { revokedAt: now },
      });
      return tx.user.update({
        where: { id: token.userId },
        data: { passwordHash },
      });
    });
    const session = await this.sessions.create(user.id);
    return { token: session.token, user: privateUserResponse(user) };
  }

  async verifyEmail(input: TokenDto) {
    const token = await prisma.accountToken.findUnique({
      where: { tokenHash: hashOpaqueToken(input.token) },
      include: { user: true },
    });
    if (
      token?.purpose === AccountTokenPurpose.EMAIL_VERIFICATION &&
      token.user.emailVerifiedAt &&
      !token.user.deactivatedAt
    ) {
      return { verified: true };
    }
    if (
      !token ||
      token.purpose !== AccountTokenPurpose.EMAIL_VERIFICATION ||
      token.consumedAt ||
      token.expiresAt.getTime() <= Date.now() ||
      token.user.deactivatedAt
    ) {
      throw new BadRequestException("This verification link is invalid or expired");
    }

    const now = new Date();
    await prisma.$transaction([
      prisma.accountToken.update({
        where: { id: token.id },
        data: { consumedAt: now },
      }),
      prisma.user.update({
        where: { id: token.userId },
        data: { emailVerifiedAt: now },
      }),
    ]);
    return { verified: true };
  }

  async resendVerification(userId: string): Promise<void> {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.emailVerifiedAt && !user.deactivatedAt) {
      await this.sendVerificationEmail(user);
    }
  }

  private async sendVerificationEmail(user: {
    id: string;
    email: string;
    emailVerifiedAt: Date | null;
  }): Promise<void> {
    if (user.emailVerifiedAt) return;
    const token = await this.issueAccountToken(user.id, AccountTokenPurpose.EMAIL_VERIFICATION, 24 * 60);
    const url = this.actionUrl("/verify-email", token);
    await this.mail.send({
      to: user.email,
      subject: "Verify your Touchline email",
      text: `Verify your email using this link (valid for 24 hours): ${url}`,
      html: `<p>Welcome to Touchline.</p><p><a href="${url}">Verify your email address</a></p><p>This link is valid for 24 hours.</p>`,
    });
  }

  private async issueAccountToken(
    userId: string,
    purpose: AccountTokenPurpose,
    lifetimeMinutes: number,
  ): Promise<string> {
    const token = createOpaqueToken();
    await prisma.$transaction([
      prisma.accountToken.deleteMany({
        where: { userId, purpose, consumedAt: null },
      }),
      prisma.accountToken.create({
        data: {
          userId,
          purpose,
          tokenHash: hashOpaqueToken(token),
          expiresAt: new Date(Date.now() + lifetimeMinutes * 60 * 1_000),
        },
      }),
    ]);
    return token;
  }

  private actionUrl(path: string, token: string): string {
    const base = process.env.APP_PUBLIC_URL?.trim() || "http://localhost:8080";
    const url = new URL(path, base.endsWith("/") ? base : `${base}/`);
    url.searchParams.set("token", token);
    return url.toString();
  }

  private assertAvailableUsername(username: string): string {
    const normalized = username.trim().toLowerCase();
    if (RESERVED_USERNAMES.has(normalized)) {
      throw new ConflictException("That username is reserved");
    }
    return normalized;
  }

  private async generatedUsername(email: string): Promise<string> {
    const local = email.split("@", 1)[0] ?? "manager";
    let base = local
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 20);
    if (base.length < 3 || RESERVED_USERNAMES.has(base)) base = `manager_${base}`.slice(0, 20);

    for (let suffix = 0; suffix < 10_000; suffix += 1) {
      const candidate = suffix === 0 ? base : `${base.slice(0, 20)}_${suffix}`;
      const exists = await prisma.user.findUnique({
        where: { username: candidate },
        select: { id: true },
      });
      if (!exists) return candidate;
    }
    throw new ConflictException("Could not generate an available username");
  }

  private displayNameFromEmail(email: string): string {
    const local = email.split("@", 1)[0] ?? "Manager";
    const words = local.match(/[\p{L}\p{N}]+/gu) ?? [];
    const displayName = words
      .map((word) => `${word.charAt(0).toLocaleUpperCase()}${word.slice(1).toLocaleLowerCase()}`)
      .join(" ")
      .slice(0, 40)
      .trim();
    return displayName || "Manager";
  }
}
