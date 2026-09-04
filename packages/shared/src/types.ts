export const ROUND_STATUSES = ["OPEN", "CLOSED", "SETTLED"] as const;
export type RoundStatus = (typeof ROUND_STATUSES)[number];

export const MATCH_STATUSES = ["SCHEDULED", "RESOLVED"] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const BET_STATUSES = ["PENDING", "WON", "LOST", "CANCELLED"] as const;
export type BetStatus = (typeof BET_STATUSES)[number];

export const SCHEDULED_DAYS = ["SAT", "SUN"] as const;
export type ScheduledDay = (typeof SCHEDULED_DAYS)[number];

export const LEDGER_TYPES = ["TOPUP", "STAKE", "PAYOUT", "REFUND"] as const;
export type LedgerType = (typeof LEDGER_TYPES)[number];

export interface TeamSummary {
  id: string;
  name: string;
  crestImageUrl: string | null;
  strengthRating: number;
}

export interface PublicTeamSummaryDto extends TeamSummary {
  slug: string;
  abbreviation: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  shirtTextColor: string;
  isClaimed: boolean;
  isMine: boolean;
}

interface PublicPlayerBaseDto {
  id: string;
  firstName: string;
  lastName: string;
  nationalityCode: string;
  shirtNumber: number;
  overall: number;
  imageUrl: string | null;
}

export interface PublicGoalkeeperDto extends PublicPlayerBaseDto {
  kind: "GOALKEEPER";
  primaryPosition: "GK";
  secondaryPositions: [];
  attributes: GoalkeeperAttributes;
}

export interface PublicOutfieldPlayerDto extends PublicPlayerBaseDto {
  kind: "OUTFIELD";
  primaryPosition: OutfieldPosition;
  secondaryPositions: OutfieldPosition[];
  attributes: OutfieldAttributes;
}

export type PublicPlayerDto =
  | PublicGoalkeeperDto
  | PublicOutfieldPlayerDto;

export interface PublicLineupAssignmentDto {
  slotKey: string;
  playerId: string;
  slotPosition: PlayerPosition;
  unit: LineupUnitGroup;
  positionPenalty: number;
  adjustedRating: number;
}

export interface PublicLineupRatingsDto {
  overall: number;
  attack: number;
  midfield: number;
  defense: number;
  goalkeeper: number;
}

export interface PublicOfficialLineupDto extends PublicLineupRatingsDto {
  id: string;
  label: string;
  formation: Formation;
  publishedAt: string | null;
  assignments: PublicLineupAssignmentDto[];
}

export interface PublicAlternativeLineupDto extends PublicLineupRatingsDto {
  id: string;
  label: string;
  formation: Formation;
}

export interface PublicTeamStandingDto {
  position: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: Array<"W" | "D" | "L">;
}

export interface PublicTeamFixtureDto {
  id: string;
  weekNumber: number;
  scheduledAt: string;
  lineupLocksAt: string;
  status: MatchStatus;
  homeTeam: TeamSummary;
  awayTeam: TeamSummary;
  result: MatchResultPayload | null;
}

export interface PublicTeamMatchHistoryPageDto {
  matches: PublicTeamFixtureDto[];
  nextCursor: string | null;
}

export interface PublicTeamProfileDto extends PublicTeamSummaryDto {
  city: string;
  stadiumName: string;
  foundedYear: number;
  attackRating: number;
  midfieldRating: number;
  defenseRating: number;
  goalkeeperRating: number;
  manager: PublicManagerIdentityDto | null;
  standing: PublicTeamStandingDto | null;
  officialLineup: PublicOfficialLineupDto | null;
  alternatives: PublicAlternativeLineupDto[];
  squad: PublicPlayerDto[];
  recentResults: PublicTeamFixtureDto[];
  upcomingFixtures: PublicTeamFixtureDto[];
}

export interface ManagerLineupAssignmentInput {
  slotKey: string;
  playerId: string;
}

export interface ManagerLineupDraftInput {
  formation: Formation;
  assignments: ManagerLineupAssignmentInput[];
}

export interface ManagerTeamProfileDto extends PublicTeamProfileDto {
  tactics: Record<string, unknown> | null;
  draftLineup: PublicOfficialLineupDto | null;
}

export interface PublishTeamLineupResultDto {
  changed: boolean;
  repricedMatchIds: string[];
  profile: ManagerTeamProfileDto;
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
  username: string;
  displayName: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  coinBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicManagerIdentityDto {
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface PublicManagerProfileDto extends PublicManagerIdentityDto {
  team: PublicManagerTeamDto | null;
}

export interface DTAssignmentDto {
  id: string;
  userId: string;
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
  cancelledAt: string | null;
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
  username: string;
  avatarUrl: string | null;
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
import type {
  Formation,
  LineupUnitGroup,
} from "./formations.js";
import type {
  GoalkeeperAttributes,
  OutfieldAttributes,
  OutfieldPosition,
  PlayerPosition,
} from "./players.js";
