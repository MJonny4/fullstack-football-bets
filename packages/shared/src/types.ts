export const ROUND_STATUSES = ["OPEN", "CLOSED", "SETTLED"] as const;
export type RoundStatus = (typeof ROUND_STATUSES)[number];

export const MATCH_STATUSES = ["SCHEDULED", "RESOLVED"] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const BET_STATUSES = ["PENDING", "WON", "LOST"] as const;
export type BetStatus = (typeof BET_STATUSES)[number];

export const SCHEDULED_DAYS = ["SAT", "SUN"] as const;
export type ScheduledDay = (typeof SCHEDULED_DAYS)[number];

export const LEDGER_TYPES = ["TOPUP", "STAKE", "PAYOUT"] as const;
export type LedgerType = (typeof LEDGER_TYPES)[number];

export interface TeamSummary {
  id: string;
  name: string;
  crestImageUrl: string | null;
  strengthRating: number;
}

export interface MatchContext {
  id: string;
  roundId: string;
  scheduledAt: Date;
  homeTeam: TeamSummary;
  awayTeam: TeamSummary;
}

export interface MatchResultPayload {
  homeScore: number;
  awayScore: number;
  homeCards: number;
  awayCards: number;
  homeCorners: number;
  awayCorners: number;
}

/** The stable swap point for the real match simulator delivered in slice 3. */
export interface ResultEngine {
  resolve(match: MatchContext): Promise<MatchResultPayload>;
}

export interface UserDto {
  id: string;
  email: string;
  coinBalance: number;
  createdAt: string;
}

export interface DTAssignmentDto {
  id: string;
  userId: string;
  teamId: string;
  claimedAt: string;
  formation: string | null;
  tactics: Record<string, unknown> | null;
}

export interface RoundDto {
  id: string;
  weekNumber: number;
  opensAt: string;
  bettingClosesAt: string;
  status: RoundStatus;
}

export interface MatchDto {
  id: string;
  roundId: string;
  homeTeam: TeamSummary;
  awayTeam: TeamSummary;
  scheduledDay: ScheduledDay;
  scheduledAt: string;
  status: MatchStatus;
  result: MatchResultPayload | null;
}

export interface OddsSnapshotDto {
  id: string;
  matchId: string;
  market: import("./markets.js").Market;
  selection: string;
  odds: number;
  computedAt: string;
}

export interface BetDto {
  id: string;
  userId: string;
  matchId: string;
  market: import("./markets.js").Market;
  selection: string;
  stake: number;
  oddsTaken: number;
  status: BetStatus;
  payout: number | null;
  createdAt: string;
}

export interface LedgerEntryDto {
  id: string;
  userId: string;
  type: LedgerType;
  amount: number;
  balanceAfter: number;
  reference: string;
  createdAt: string;
}

export interface PublicManagerTeamDto {
  id: string;
  name: string;
  crestImageUrl: string | null;
}

export interface BettingLeaderboardEntryDto {
  rank: number | null;
  userId: string;
  displayName: string;
  team: PublicManagerTeamDto | null;
  coinBalance: number;
  settledBets: number;
  wins: number;
  losses: number;
  pendingBets: number;
  settledStake: number;
  pendingStake: number;
  totalPayout: number;
  netProfit: number;
  roiPercent: number | null;
  hitRatePercent: number | null;
  provisional: boolean;
}
