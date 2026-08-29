import { type PrismaClient, Prisma } from "@prisma/client";
import { createOddsQuotes } from "@fb/shared";
import { DateTime } from "luxon";
import { getRoundSchedule, type RandomSource } from "./schedule.js";
import {
  applyWalletTransaction,
  type BalanceChange,
} from "./wallet.js";

export const DEFAULT_TIMEZONE = "Europe/Madrid";
export const DEFAULT_WEEKLY_TOPUP = 200;
export const MATCH_KICKOFF_HOUR = 17;

export interface OpenRoundOptions {
  now?: Date;
  timezone?: string;
  topupAmount?: number;
  random?: RandomSource;
  /** Opens the next unused competition week, even if this local week is open. */
  force?: boolean;
}

export interface OpenRoundResult {
  created: boolean;
  roundId: string;
  weekNumber: number;
  matchIds: string[];
  balanceChanges: BalanceChange[];
}

export interface CloseBettingOptions {
  now?: Date;
  force?: boolean;
}

export interface CloseBettingResult {
  closedRoundIds: string[];
}

function assertValidDate(value: Date, label: string): void {
  if (Number.isNaN(value.getTime())) throw new RangeError(`${label} is invalid`);
}

function nextFridayClose(now: Date, timezone: string): DateTime {
  const localNow = DateTime.fromJSDate(now, { zone: timezone });
  if (!localNow.isValid) {
    throw new RangeError(`Invalid timezone ${timezone}`);
  }
  const startOfWeek = localNow.startOf("week");
  let close = startOfWeek.plus({ days: 4 }).set({
    hour: 23,
    minute: 59,
    second: 0,
    millisecond: 0,
  });
  if (localNow >= close) close = close.plus({ weeks: 1 });
  return close;
}

function lifecycleKey(timezone: string, close: DateTime): string {
  return `${timezone}:${close.toFormat("yyyy-LL-dd")}`;
}

export async function openNextRound(
  db: PrismaClient,
  options: OpenRoundOptions = {},
): Promise<OpenRoundResult> {
  const now = options.now ?? new Date();
  const timezone = options.timezone ?? DEFAULT_TIMEZONE;
  const topupAmount = options.topupAmount ?? DEFAULT_WEEKLY_TOPUP;
  const random = options.random ?? Math.random;
  assertValidDate(now, "now");
  if (!Number.isSafeInteger(topupAmount) || topupAmount <= 0) {
    throw new RangeError("topupAmount must be a positive whole number");
  }

  const initialClose = nextFridayClose(now, timezone);

  return db.$transaction(async (tx) => {
    let bettingClosesAt = initialClose;
    let key = lifecycleKey(timezone, bettingClosesAt);
    let existing = await tx.round.findUnique({
      where: { lifecycleKey: key },
      include: { matches: { select: { id: true } } },
    });

    if (existing && !options.force) {
      return {
        created: false,
        roundId: existing.id,
        weekNumber: existing.weekNumber,
        matchIds: existing.matches.map(({ id }) => id),
        balanceChanges: [],
      };
    }

    while (existing) {
      bettingClosesAt = bettingClosesAt.plus({ weeks: 1 });
      key = lifecycleKey(timezone, bettingClosesAt);
      existing = await tx.round.findUnique({
        where: { lifecycleKey: key },
        include: { matches: { select: { id: true } } },
      });
    }

    const teams = await tx.team.findMany({ orderBy: { id: "asc" } });
    if (teams.length !== 20) {
      throw new Error(
        `Cannot open a round until exactly 20 teams exist (found ${teams.length})`,
      );
    }
    const latestWeek = await tx.round.aggregate({ _max: { weekNumber: true } });
    const weekNumber = (latestWeek._max.weekNumber ?? 0) + 1;
    const schedule = getRoundSchedule(teams, weekNumber, { random });
    const round = await tx.round.create({
      data: {
        weekNumber,
        lifecycleKey: key,
        opensAt: now,
        bettingClosesAt: bettingClosesAt.toJSDate(),
        status: "OPEN",
      },
    });

    const matchIds: string[] = [];
    for (const pairing of schedule) {
      const daysAfterClose = pairing.scheduledDay === "SAT" ? 1 : 2;
      const scheduledAt = bettingClosesAt.plus({ days: daysAfterClose }).set({
        hour: MATCH_KICKOFF_HOUR,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
      const match = await tx.match.create({
        data: {
          roundId: round.id,
          homeTeamId: pairing.homeTeamId,
          awayTeamId: pairing.awayTeamId,
          scheduledDay: pairing.scheduledDay,
          scheduledAt: scheduledAt.toJSDate(),
        },
      });
      matchIds.push(match.id);

      const quotes = createOddsQuotes(
        pairing.homeTeam.strengthRating,
        pairing.awayTeam.strengthRating,
      );
      await tx.oddsSnapshot.createMany({
        data: quotes.map(({ market, selection, odds }) => ({
          matchId: match.id,
          market,
          selection,
          odds: new Prisma.Decimal(odds),
          computedAt: now,
        })),
      });
    }

    const users = await tx.user.findMany({ select: { id: true } });
    const balanceChanges: BalanceChange[] = [];
    for (const user of users) {
      const change = await applyWalletTransaction(
        tx,
        user.id,
        "TOPUP",
        topupAmount,
        `round:${round.id}:topup`,
      );
      if (change.applied) balanceChanges.push(change);
    }

    return {
      created: true,
      roundId: round.id,
      weekNumber,
      matchIds,
      balanceChanges,
    };
  }, { maxWait: 10_000, timeout: 30_000 });
}

export async function closeBettingWindows(
  db: PrismaClient,
  options: CloseBettingOptions = {},
): Promise<CloseBettingResult> {
  const now = options.now ?? new Date();
  assertValidDate(now, "now");

  return db.$transaction(async (tx) => {
    const candidates = await tx.round.findMany({
      where: {
        status: "OPEN",
        ...(options.force ? {} : { bettingClosesAt: { lte: now } }),
      },
      select: { id: true },
    });
    if (candidates.length === 0) return { closedRoundIds: [] };

    const ids = candidates.map(({ id }) => id);
    await tx.round.updateMany({
      where: { id: { in: ids }, status: "OPEN" },
      data: { status: "CLOSED" },
    });
    return { closedRoundIds: ids };
  });
}

export const closeExpiredRounds = closeBettingWindows;
