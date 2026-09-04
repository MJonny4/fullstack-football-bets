import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import { CurrentUser, type AuthenticatedUser } from "../common/current-user.decorator.js";
import { SessionAuthGuard } from "../common/session-auth.guard.js";
import { clearSessionCookie, setSessionCookie } from "../common/session.js";
import { AuthService } from "./auth.service.js";
import {
  CredentialsDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  SignupDto,
  TokenDto,
} from "./auth.dto.js";

@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post("signup")
  @Throttle({ default: { limit: process.env.NODE_ENV === "test" ? 10_000 : 8, ttl: 15 * 60_000 } })
  async signup(
    @Body() credentials: SignupDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.sessionResponse(await this.auth.signup(credentials), response);
  }

  @Post("login")
  @Throttle({ default: { limit: process.env.NODE_ENV === "test" ? 10_000 : 12, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() credentials: CredentialsDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.sessionResponse(await this.auth.login(credentials), response);
  }

  @Post("logout")
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.logout(user.sessionId);
    clearSessionCookie(response);
  }

  @Post("forgot-password")
  @Throttle({ default: { limit: process.env.NODE_ENV === "test" ? 10_000 : 3, ttl: 15 * 60_000 } })
  @HttpCode(HttpStatus.ACCEPTED)
  async forgotPassword(@Body() input: ForgotPasswordDto) {
    await this.auth.requestPasswordReset(input);
    return { accepted: true };
  }

  @Post("reset-password")
  @Throttle({ default: { limit: process.env.NODE_ENV === "test" ? 10_000 : 6, ttl: 15 * 60_000 } })
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() input: ResetPasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.sessionResponse(await this.auth.resetPassword(input), response);
  }

  @Post("verify-email")
  @Throttle({ default: { limit: process.env.NODE_ENV === "test" ? 10_000 : 10, ttl: 15 * 60_000 } })
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() input: TokenDto) {
    return this.auth.verifyEmail(input);
  }

  @Post("resend-verification")
  @Throttle({ default: { limit: process.env.NODE_ENV === "test" ? 10_000 : 3, ttl: 60 * 60_000 } })
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async resendVerification(@CurrentUser() user: AuthenticatedUser) {
    await this.auth.resendVerification(user.id);
    return { accepted: true };
  }

  private sessionResponse(
    result: Awaited<ReturnType<AuthService["login"]>>,
    response: Response,
  ) {
    setSessionCookie(response, result.token);
    return {
      user: result.user,
      ...(process.env.NODE_ENV === "test" ? { accessToken: result.token } : {}),
    };
  }
}
