import { type PrismaClient, Prisma } from "@prisma/client";
import {
  calculatePayout,
  gradeBet,
  type MatchContext,
  type MatchResultPayload,
  type ResultEngine,
  type SimulationState,
} from "@fb/shared";
import { MatchNotFoundError } from "./errors.js";
import { lockDueMatchLineups } from "./lineup-lock.js";
import { simulationResult } from "./simulation-engine.js";
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
  for (const field of ["homeScore", "awayScore", "homeCards", "awayCards", "homeCorners", "awayCorners"] as const) {
    const value = result[field];
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
  if (candidate.simulationVersion) {
    throw new Error("Live matches must reach full time before settlement");
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

  return settleResult(db, matchId, candidate.roundId, result);
}

/** Only a committed full-time checkpoint can enter the wallet transaction. */
export async function settleLiveMatch(db: PrismaClient, matchId: string): Promise<SettlementResult> {
  const match = await db.match.findUnique({ where: { id: matchId }, include: { simulation: true } });
  if (!match) throw new MatchNotFoundError(matchId);
  if (!match.simulationVersion || !match.simulation || match.simulation.phase !== "FINISHED" || !match.simulation.finalPayload) {
    throw new Error("Live matches must reach full time before settlement");
  }
  const result = simulationResult(match.simulation.state as unknown as SimulationState);
  const stored = match.simulation.finalPayload as unknown as MatchResultPayload;
  assertResultPayload(stored);
  for (const key of Object.keys(result) as Array<keyof MatchResultPayload>) {
    if (result[key] !== stored[key]) throw new Error("Full-time result differs from committed match state");
  }
  return settleResult(db, matchId, match.roundId, stored, match.simulation.revision);
}

async function settleResult(db: PrismaClient, matchId: string, roundId: string,
  result: MatchResultPayload, liveRevision?: number): Promise<SettlementResult> {

  return db.$transaction(async (tx) => {
    // Serializing the short finalization transactions within a round makes the
    // final unresolved count correct when two matches finish concurrently.
    await tx.$queryRaw`SELECT "id" FROM "Round" WHERE "id" = ${roundId} FOR UPDATE`;
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
        roundId,
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
      where: { roundId, status: "SCHEDULED" },
    });
    let roundSettled = false;
    if (unresolvedMatches === 0) {
      const update = await tx.round.updateMany({
        where: { id: roundId, status: { not: "SETTLED" } },
        data: { status: "SETTLED" },
      });
      roundSettled = update.count === 1;
    }

    if (liveRevision !== undefined) {
      await tx.matchLiveOutbox.create({ data: { matchId, revision: liveRevision, settled: true } });
    }
    return {
      settled: true,
      matchId,
      roundId,
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
      simulationVersion: null,
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
