import type {
  BetStatus,
  BettingLeaderboardEntryDto,
  PublicManagerTeamDto,
} from "@fb/shared";

export type LeaderboardBetStatus = BetStatus;

export type LeaderboardTeam = PublicManagerTeamDto;

export interface LeaderboardUserSource {
  id: string;
  email: string;
  coinBalance: number;
  createdAt: Date;
  team: LeaderboardTeam | null;
}

export interface LeaderboardBetAggregate {
  userId: string;
  status: LeaderboardBetStatus;
  count: number;
  stake: number;
  payout: number;
}

export type BettingLeaderboardEntry = BettingLeaderboardEntryDto;

interface RankedCandidate extends BettingLeaderboardEntry {
  createdAt: Date;
  roiSortValue: number;
}

const PROVISIONAL_BET_LIMIT = 5;
const DISPLAY_NAME_LIMIT = 28;

function roundToOneDecimal(value: number): number {
  const rounded = Math.round((value + Number.EPSILON) * 10) / 10;
  return Object.is(rounded, -0) ? 0 : rounded;
}

/**
 * Produces a presentable public alias without ever returning the email domain.
 * Plus-address tags and punctuation are intentionally discarded.
 */
export function managerAliasBase(email: string): string {
  const at = email.indexOf("@");
  const localPart = (at >= 0 ? email.slice(0, at) : email).split("+", 1)[0] ?? "";
  const words = localPart.normalize("NFKC").match(/[\p{L}\p{N}]+/gu) ?? [];
  const friendly = words
    .map((word) => {
      const characters = [...word];
      const first = characters.shift();
      return first
        ? `${first.toLocaleUpperCase()}${characters.join("").toLocaleLowerCase()}`
        : "";
    })
    .filter(Boolean)
    .join(" ")
    .slice(0, DISPLAY_NAME_LIMIT)
    .trim();

  return friendly || "Manager";
}

function publicDisplayNames(users: readonly LeaderboardUserSource[]): Map<string, string> {
  const identities = users
    .map((user) => ({
      id: user.id,
      createdAt: user.createdAt,
      base: managerAliasBase(user.email),
    }))
    .sort(
      (left, right) =>
        left.createdAt.getTime() - right.createdAt.getTime() ||
        left.id.localeCompare(right.id),
    );
  const totals = new Map<string, number>();

  for (const identity of identities) {
    const key = identity.base.toLocaleLowerCase();
    totals.set(key, (totals.get(key) ?? 0) + 1);
  }

  const occurrences = new Map<string, number>();
  const names = new Map<string, string>();
  for (const identity of identities) {
    const key = identity.base.toLocaleLowerCase();
    const occurrence = (occurrences.get(key) ?? 0) + 1;
    occurrences.set(key, occurrence);
    names.set(
      identity.id,
      (totals.get(key) ?? 0) > 1
        ? `${identity.base} #${occurrence}`
        : identity.base,
    );
  }

  return names;
}

function compareRanked(left: RankedCandidate, right: RankedCandidate): number {
  return (
    right.netProfit - left.netProfit ||
    right.roiSortValue - left.roiSortValue ||
    right.settledBets - left.settledBets ||
    right.wins - left.wins ||
    left.createdAt.getTime() - right.createdAt.getTime() ||
    left.userId.localeCompare(right.userId)
  );
}

function compareUnranked(left: RankedCandidate, right: RankedCandidate): number {
  return (
    left.createdAt.getTime() - right.createdAt.getTime() ||
    left.userId.localeCompare(right.userId)
  );
}

function withoutInternalFields(candidate: RankedCandidate): BettingLeaderboardEntry {
  const { createdAt: _createdAt, roiSortValue: _roiSortValue, ...entry } = candidate;
  return entry;
}

export function buildBettingLeaderboard(
  users: readonly LeaderboardUserSource[],
  aggregates: readonly LeaderboardBetAggregate[],
): BettingLeaderboardEntry[] {
  const displayNames = publicDisplayNames(users);
  const aggregatesByUser = new Map<
    string,
    { wins: number; losses: number; pendingBets: number; settledStake: number; pendingStake: number; totalPayout: number }
  >();

  for (const aggregate of aggregates) {
    if (aggregate.status === "CANCELLED") continue;
    const stats = aggregatesByUser.get(aggregate.userId) ?? {
      wins: 0,
      losses: 0,
      pendingBets: 0,
      settledStake: 0,
      pendingStake: 0,
      totalPayout: 0,
    };

    if (aggregate.status === "PENDING") {
      stats.pendingBets += aggregate.count;
      stats.pendingStake += aggregate.stake;
    } else {
      if (aggregate.status === "WON") stats.wins += aggregate.count;
      else stats.losses += aggregate.count;
      stats.settledStake += aggregate.stake;
      stats.totalPayout += aggregate.payout;
    }
    aggregatesByUser.set(aggregate.userId, stats);
  }

  const candidates: RankedCandidate[] = users.map((user) => {
    const stats = aggregatesByUser.get(user.id) ?? {
      wins: 0,
      losses: 0,
      pendingBets: 0,
      settledStake: 0,
      pendingStake: 0,
      totalPayout: 0,
    };
    const settledBets = stats.wins + stats.losses;
    const netProfit = stats.totalPayout - stats.settledStake;
    const roiSortValue = stats.settledStake > 0
      ? (netProfit / stats.settledStake) * 100
      : Number.NEGATIVE_INFINITY;

    return {
      rank: null,
      userId: user.id,
      displayName: displayNames.get(user.id) ?? "Manager",
      team: user.team,
      coinBalance: user.coinBalance,
      settledBets,
      wins: stats.wins,
      losses: stats.losses,
      pendingBets: stats.pendingBets,
      settledStake: stats.settledStake,
      pendingStake: stats.pendingStake,
      totalPayout: stats.totalPayout,
      netProfit,
      roiPercent: stats.settledStake > 0 ? roundToOneDecimal(roiSortValue) : null,
      hitRatePercent: settledBets > 0
        ? roundToOneDecimal((stats.wins / settledBets) * 100)
        : null,
      provisional: settledBets > 0 && settledBets < PROVISIONAL_BET_LIMIT,
      createdAt: user.createdAt,
      roiSortValue,
    };
  });

  const ranked = candidates
    .filter((candidate) => candidate.settledBets > 0)
    .sort(compareRanked)
    .map((candidate, index) => withoutInternalFields({ ...candidate, rank: index + 1 }));
  const unranked = candidates
    .filter((candidate) => candidate.settledBets === 0)
    .sort(compareUnranked)
    .map(withoutInternalFields);

  return [...ranked, ...unranked];
}
