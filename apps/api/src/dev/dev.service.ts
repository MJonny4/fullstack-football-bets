import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  closeBettingWindows,
  openNextRound,
  prisma,
  resolveDueMatches,
} from "@fb/core";
import type { ResultEngine } from "@fb/shared";
import { LeaderboardGateway } from "../leaderboard/leaderboard.gateway.js";
import { RESULT_ENGINE } from "./result-engine.provider.js";

@Injectable()
export class DevService {
  constructor(
    @Inject(RESULT_ENGINE) private readonly engine: ResultEngine,
    private readonly leaderboard: LeaderboardGateway,
  ) {}

  async openRound() {
    this.ensureEnabled();
    try {
      const result = await openNextRound(prisma, {
        now: new Date(),
        timezone: process.env.APP_TZ ?? "Europe/Madrid",
        topupAmount: Number(process.env.TOPUP_AMOUNT ?? 200),
        force: true,
      });
      await this.leaderboard.broadcast();
      return result;
    } catch (error) {
      if (error instanceof Error && /open round/i.test(error.message)) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  async closeWindow() {
    this.ensureEnabled();
    return closeBettingWindows(prisma, { now: new Date(), force: true });
  }

  async resolveDue() {
    this.ensureEnabled();
    const result = await resolveDueMatches(prisma, this.engine, {
      now: new Date(),
      force: true,
    });
    await this.leaderboard.broadcast();
    return result;
  }

  private ensureEnabled() {
    if (process.env.DEV_TOOLS?.toLowerCase() !== "true") {
      throw new NotFoundException();
    }
  }
}
