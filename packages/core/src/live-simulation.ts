import { randomBytes } from "node:crypto";
import { Prisma, type PrismaClient, type MatchSimulation } from "@prisma/client";
import {
  LIVE_ENGINE_VERSION, SIMULATION_STEP_MS, LIVE_IDLE_INTERVAL_MS,
  type LiveEvent, type LiveMatchSnapshot, type LiveMatchSummary, type MatchCenterDto,
  type SimulationInput, type SimulationState, type SimulationTeam, type MatchResultPayload,
} from "@fb/shared";
import { MatchNotFoundError } from "./errors.js";
import { lockDueMatchLineups } from "./lineup-lock.js";
import { initializeSimulation, simulationResult, stepSimulation } from "./simulation-engine.js";
import { settleLiveMatch, type SettlementResult } from "./settlement.js";
import { closeBettingWindows } from "./lifecycle.js";

const json = (value: unknown) => value as Prisma.InputJsonValue;
type PublicSimulationSource = Pick<MatchSimulation, "matchId" | "state" | "revision" | "startedAt">;
export const publicSimulationSelect = { matchId: true, state: true, revision: true, startedAt: true, lastSequence: true } as const;

export function liveSummary(simulation: PublicSimulationSource, settled: boolean, now = new Date()): LiveMatchSummary {
  const state = simulation.state as unknown as SimulationState;
  return {
    matchId: simulation.matchId, phase: state.phase, period: state.period, second: state.second,
    addedMinutes: state.addedMinutes, revision: simulation.revision, latestSequence: state.sequence,
    startedAt: simulation.startedAt.toISOString(),
    observedAt: new Date(simulation.startedAt.getTime() + Math.max(0, state.step - 1) * SIMULATION_STEP_MS).toISOString(),
    serverTime: now.toISOString(), settled, homeScore: state.home.stats.goals, awayScore: state.away.stats.goals,
    pressure: state.pressure, lastEvent: state.lastEvent,
  };
}

export function liveSnapshot(simulation: PublicSimulationSource, settled: boolean, events: LiveEvent[], now = new Date()): LiveMatchSnapshot {
  const state = simulation.state as unknown as SimulationState;
  return { ...liveSummary(simulation, settled, now), possession: state.possession,
    ball: state.ball, home: state.home, away: state.away, events };
}

/** Small board updates do not need teams, frozen lineups, or event history. */
export async function readLiveSummary(db: PrismaClient, matchId: string): Promise<LiveMatchSummary | null> {
  const match = await db.match.findUnique({ where: { id: matchId },
    select: { status: true, simulation: { select: publicSimulationSelect } } });
  return match?.simulation ? liveSummary(match.simulation, match.status === "RESOLVED") : null;
}

export async function readMatchCenter(db: PrismaClient, matchId: string): Promise<MatchCenterDto> {
  // A repeatable snapshot aligns score, event boundary, and settlement status.
  return db.$transaction(async tx => {
    const match = await tx.match.findUnique({ where: { id: matchId }, include: {
      homeTeam: true, awayTeam: true, round: { select: { weekNumber: true } },
      simulation: { select: publicSimulationSelect }, lineupSnapshots: { select: { side: true, formation: true } },
    } });
    if (!match) throw new MatchNotFoundError(matchId);
    const events = match.simulation ? await tx.matchEvent.findMany({
      where: { matchId, sequence: { lte: match.simulation.lastSequence } },
      orderBy: { sequence: "desc" }, take: 80,
    }) : [];
    const team = (side: "HOME" | "AWAY") => {
      const t = side === "HOME" ? match.homeTeam : match.awayTeam;
      return { id: t.id, name: t.name, abbreviation: t.abbreviation, primaryColor: t.primaryColor,
        secondaryColor: t.secondaryColor, crestImageUrl: t.crestImageUrl,
        formation: match.lineupSnapshots.find(s => s.side === side)?.formation ?? null };
    };
    return { id: match.id, roundId: match.roundId, weekNumber: match.round.weekNumber,
      scheduledAt: match.scheduledAt.toISOString(), stadiumName: match.homeTeam.stadiumName,
      homeTeam: team("HOME"), awayTeam: team("AWAY"), supportsLive: match.simulationVersion !== null,
      result: match.resultPayload as unknown as MatchResultPayload | null,
      live: match.simulation ? liveSnapshot(match.simulation, match.status === "RESOLVED",
        events.reverse().map(e => e.payload as unknown as LiveEvent)) : null };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}

export async function initializeLiveMatch(db: PrismaClient, matchId: string, now = new Date(), demo = false): Promise<boolean> {
  await lockDueMatchLineups(db, { now, matchId, force: demo });
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "Match" WHERE "id" = ${matchId} FOR UPDATE`;
    const match = await tx.match.findUnique({ where: { id: matchId }, include: {
      simulation: true, lineupSnapshots: true, round: true,
    } });
    if (!match) throw new MatchNotFoundError(matchId);
    if (match.simulation || match.status === "RESOLVED" || (!demo && match.scheduledAt > now)) return false;
    if (match.simulationVersion !== LIVE_ENGINE_VERSION) throw new Error(`Unsupported live match version ${match.simulationVersion}`);
    if (match.round.status === "OPEN" || (!demo && now < match.round.bettingClosesAt)) {
      throw new Error("Close the betting window before starting a live match");
    }
    const home = match.lineupSnapshots.find(s => s.side === "HOME")?.simulationTeam;
    const away = match.lineupSnapshots.find(s => s.side === "AWAY")?.simulationTeam;
    if (!home || !away) throw new Error(`Match ${matchId} is missing immutable simulation lineups`);
    const input: SimulationInput = { version: LIVE_ENGINE_VERSION, matchId,
      home: home as unknown as SimulationTeam, away: away as unknown as SimulationTeam };
    const seed = randomBytes(24).toString("hex");
    const state = initializeSimulation(input, seed);
    await tx.matchSimulation.create({ data: { matchId, version: input.version, seed,
      input: json(input), state: json(state), startedAt: demo ? now : match.scheduledAt, updatedAt: now } });
    await tx.matchLiveOutbox.create({ data: { matchId, revision: 0 } });
    return true;
  });
}

export async function advanceLiveMatch(db: PrismaClient, matchId: string, now = new Date(), maxSteps = 120): Promise<boolean> {
  if (!Number.isFinite(now.getTime()) || !Number.isSafeInteger(maxSteps) || maxSteps < 1 || maxSteps > 2000) {
    throw new Error("Invalid simulation advancement");
  }
  const checkpoint = await db.matchSimulation.findUnique({ where: { matchId } });
  if (!checkpoint || checkpoint.phase === "FINISHED") return false;
  if (checkpoint.version !== LIVE_ENGINE_VERSION) throw new Error("Unsupported checkpoint version");
  const dueStep = Math.max(0, Math.floor((now.getTime() - checkpoint.startedAt.getTime()) / SIMULATION_STEP_MS) + 1);
  const target = Math.min(dueStep, checkpoint.step + maxSteps);
  if (target <= checkpoint.step) return false;
  const input = checkpoint.input as unknown as SimulationInput;
  let state = checkpoint.state as unknown as SimulationState;
  const events: LiveEvent[] = [];
  while (state.step < target && state.phase !== "FINISHED") {
    const next = stepSimulation(input, state);
    state = next.state;
    events.push(...next.events);
  }
  const finishedAt = state.phase === "FINISHED"
    ? new Date(checkpoint.startedAt.getTime() + (state.step - 1) * SIMULATION_STEP_MS) : null;
  return db.$transaction(async tx => {
    const claim = await tx.matchSimulation.updateMany({
      where: { matchId, revision: checkpoint.revision, phase: { not: "FINISHED" } },
      data: { revision: { increment: 1 }, state: json(state), step: state.step,
        lastSequence: state.sequence, phase: state.phase, updatedAt: now, finishedAt,
        ...(finishedAt ? { finalPayload: json(simulationResult(state)) } : {}) },
    });
    if (!claim.count) return false;
    if (events.length) await tx.matchEvent.createMany({ data: events.map(event => ({
      matchId, sequence: event.sequence, step: event.step, payload: json(event), createdAt: now,
    })) });
    await tx.matchLiveOutbox.create({ data: { matchId, revision: checkpoint.revision + 1 } });
    return true;
  });
}

/** Each match is isolated so a missing squad cannot stall the rest of a matchday. */
export async function progressLiveMatches(db: PrismaClient, now = new Date(), options: {
  /** Omit when presence is unavailable: safely keep every match in normal mode. */
  watchedMatchIds?: ReadonlySet<string>;
} = {}): Promise<{
  advanced: string[]; settlements: SettlementResult[]; errors: Array<{ matchId: string; message: string }>;
}> {
  const due = await db.match.findMany({ where: { status: "SCHEDULED", simulationVersion: { not: null },
    OR: [{ scheduledAt: { lte: now } }, { simulation: { isNot: null } }] },
    select: { id: true, simulation: { select: { phase: true, step: true, startedAt: true } } },
    orderBy: [{ scheduledAt: "asc" }, { id: "asc" }], take: 50 });
  const advanced: string[] = [];
  const settlements: SettlementResult[] = [];
  const errors: Array<{ matchId: string; message: string }> = [];
  // Kickoff is not dependent on the Friday close job having been delivered.
  // This only closes windows whose real deadline has already elapsed.
  if (due.some(match => !match.simulation)) await closeBettingWindows(db, { now });
  for (const match of due) {
    try {
      const checkpoint = match.simulation;
      if (checkpoint && checkpoint.phase !== "FINISHED" && options.watchedMatchIds
        && !options.watchedMatchIds.has(match.id)) {
        const observedAt = checkpoint.startedAt.getTime() + Math.max(0, checkpoint.step - 1) * SIMULATION_STEP_MS;
        if (now.getTime() - observedAt < LIVE_IDLE_INTERVAL_MS) continue;
      }
      // Idle mode changes only batching/persistence frequency, never football
      // steps, random draws, wall-clock anchor, or the final result.
      if (!checkpoint) await initializeLiveMatch(db, match.id, now);
      if (await advanceLiveMatch(db, match.id, now)) advanced.push(match.id);
      const simulation = await db.matchSimulation.findUnique({ where: { matchId: match.id }, select: { phase: true } });
      if (simulation?.phase === "FINISHED") settlements.push(await settleLiveMatch(db, match.id));
    } catch (error) {
      errors.push({ matchId: match.id, message: error instanceof Error ? error.message : String(error) });
    }
  }
  return { advanced, settlements, errors };
}

/** Delivery is at least once. A crash after publish simply causes deduplicated redelivery. */
export async function flushMatchOutbox(db: PrismaClient,
  publish: (message: { matchId: string; revision: number; settled: boolean }) => Promise<unknown>): Promise<number> {
  const pending = await db.matchLiveOutbox.findMany({ where: { deliveredAt: null },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: 200 });
  // Coalesce old revisions while catching up without discarding settlement notifications.
  const matches = new Map<string, typeof pending>();
  for (const entry of pending) matches.set(entry.matchId, [...(matches.get(entry.matchId) ?? []), entry]);
  for (const [matchId, entries] of matches) {
    await publish({ matchId, revision: Math.max(...entries.map(e => e.revision)), settled: entries.some(e => e.settled) });
    await db.matchLiveOutbox.updateMany({ where: { id: { in: entries.map(e => e.id) }, deliveredAt: null },
      data: { deliveredAt: new Date() } });
  }
  return pending.length;
}
