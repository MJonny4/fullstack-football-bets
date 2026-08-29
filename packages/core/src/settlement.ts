import { type PrismaClient, Prisma } from "@prisma/client";
import {
  calculatePayout,
  gradeBet,
  type MatchContext,
  type MatchResultPayload,
  type ResultEngine,
} from "@fb/shared";
import { MatchNotFoundError } from "./errors.js";
import { lockDueMatchLineups } from "./lineup-lock.js";
import {
  applyWalletTransaction,
  type BalanceChange,
} from "./wallet.js";

export interface SettlementResult {
  settled: boolean;
  matchId: string;
  roundId: string;
  roundSettled: boolean;
  result: MatchResultPayload | null;
  gradedBetCount: number;
  balanceChanges: BalanceChange[];
}

export interface ResolveDueOptions {
  now?: Date;
  force?: boolean;
}

export interface ResolveDueResult {
  matches: SettlementResult[];
  balanceChanges: BalanceChange[];
  lockedMatchIds: string[];
}

function assertResultPayload(result: MatchResultPayload): void {
  for (const [field, value] of Object.entries(result)) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError(`Result field ${field} must be a non-negative integer`);
    }
  }
}

export async function resolveAndSettleMatch(
  db: PrismaClient,
  matchId: string,
  engine: ResultEngine,
): Promise<SettlementResult> {
  // Direct callers receive the same deadline guarantee as the due-match sweep.
  // Future matches forced by development controls intentionally keep the
  // legacy fallback because their real lineup deadline has not occurred.
  await lockDueMatchLineups(db, { now: new Date() });
  const candidate = await db.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: true,
      awayTeam: true,
      lineupSnapshots: { select: { side: true, overallRating: true } },
    },
  });
  if (!candidate) throw new MatchNotFoundError(matchId);
  if (candidate.status === "RESOLVED") {
    return {
      settled: false,
      matchId,
      roundId: candidate.roundId,
      roundSettled: false,
      result: null,
      gradedBetCount: 0,
      balanceChanges: [],
    };
  }

  const homeSnapshot = candidate.lineupSnapshots.find(
    ({ side }) => side === "HOME",
  );
  const awaySnapshot = candidate.lineupSnapshots.find(
    ({ side }) => side === "AWAY",
  );

  const context: MatchContext = {
    id: candidate.id,
    roundId: candidate.roundId,
    scheduledAt: candidate.scheduledAt,
    homeTeam: {
      id: candidate.homeTeam.id,
      name: candidate.homeTeam.name,
      crestImageUrl: candidate.homeTeam.crestImageUrl,
      strengthRating: Number(
        homeSnapshot?.overallRating ?? candidate.homeTeam.strengthRating,
      ),
    },
    awayTeam: {
      id: candidate.awayTeam.id,
      name: candidate.awayTeam.name,
      crestImageUrl: candidate.awayTeam.crestImageUrl,
      strengthRating: Number(
        awaySnapshot?.overallRating ?? candidate.awayTeam.strengthRating,
      ),
    },
  };
  const result = await engine.resolve(context);
  assertResultPayload(result);

  return db.$transaction(async (tx) => {
    // This conditional write is the match-level idempotency claim. Concurrent
    // workers may simulate, but only one can grade or credit within its tx.
    const claim = await tx.match.updateMany({
      where: { id: matchId, status: "SCHEDULED" },
      data: {
        status: "RESOLVED",
        resultPayload: result as unknown as Prisma.InputJsonValue,
        resolvedAt: new Date(),
      },
    });
    if (claim.count === 0) {
      return {
        settled: false,
        matchId,
        roundId: candidate.roundId,
        roundSettled: false,
        result: null,
        gradedBetCount: 0,
        balanceChanges: [],
      };
    }

    const pendingBets = await tx.bet.findMany({
      where: { matchId, status: "PENDING" },
      orderBy: { id: "asc" },
    });
    const balanceChanges: BalanceChange[] = [];
    let gradedBetCount = 0;

    for (const bet of pendingBets) {
      const won = gradeBet(bet.market, bet.selection, result);
      const payout = won ? calculatePayout(bet.stake, bet.oddsTaken) : 0;
      const graded = await tx.bet.updateMany({
        where: { id: bet.id, status: "PENDING" },
        data: { status: won ? "WON" : "LOST", payout },
      });
      if (graded.count === 0) continue;
      gradedBetCount += 1;

      if (payout > 0) {
        const change = await applyWalletTransaction(
          tx,
          bet.userId,
          "PAYOUT",
          payout,
          `bet:${bet.id}:payout`,
        );
        if (change.applied) balanceChanges.push(change);
      }
    }

    const unresolvedMatches = await tx.match.count({
      where: { roundId: candidate.roundId, status: "SCHEDULED" },
    });
    let roundSettled = false;
    if (unresolvedMatches === 0) {
      const update = await tx.round.updateMany({
        where: { id: candidate.roundId, status: { not: "SETTLED" } },
        data: { status: "SETTLED" },
      });
      roundSettled = update.count === 1;
    }

    return {
      settled: true,
      matchId,
      roundId: candidate.roundId,
      roundSettled,
      result,
      gradedBetCount,
      balanceChanges,
    };
  }, { maxWait: 10_000, timeout: 30_000 });
}

export async function resolveDueMatches(
  db: PrismaClient,
  engine: ResultEngine,
  options: ResolveDueOptions = {},
): Promise<ResolveDueResult> {
  const now = options.now ?? new Date();
  if (Number.isNaN(now.getTime())) throw new RangeError("now is invalid");
  const locked = await lockDueMatchLineups(db, { now });

  const dueMatches = await db.match.findMany({
    where: {
      status: "SCHEDULED",
      ...(options.force ? {} : { scheduledAt: { lte: now } }),
    },
    select: { id: true },
    orderBy: [{ scheduledAt: "asc" }, { id: "asc" }],
  });

  const matches: SettlementResult[] = [];
  for (const { id } of dueMatches) {
    matches.push(await resolveAndSettleMatch(db, id, engine));
  }
  return {
    matches,
    balanceChanges: matches.flatMap(({ balanceChanges }) => balanceChanges),
    lockedMatchIds: locked.lockedMatchIds,
  };
}
