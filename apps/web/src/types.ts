import type {
  BetStatus,
  BettingLeaderboardEntryDto,
  Market,
  MatchResultPayload,
  MatchStatus,
  RoundStatus,
  ScheduledDay,
  StandingsResponse,
} from '@fb/shared';

export type Numeric = number | string;

export interface DTAssignment {
  userId?: string;
  teamId?: string;
  claimedAt?: string;
  formation?: string | null;
  tactics?: Record<string, unknown> | null;
}

export interface User {
  id: string;
  email: string;
  coinBalance: Numeric;
  dtAssignment?: DTAssignment | null;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Team {
  id: string;
  name: string;
  crestImageUrl: string | null;
  strengthRating: number;
  dtAssignment?: (DTAssignment & { user?: Pick<User, 'id' | 'email'> }) | null;
  isClaimed?: boolean;
  isMine?: boolean;
}

export interface OddsQuote {
  market: Market;
  selection: string;
  odds: Numeric;
}

export interface MatchResult extends Partial<MatchResultPayload> {
  homeGoals?: number;
  awayGoals?: number;
  homeScore?: number;
  awayScore?: number;
  homeCards?: number;
  awayCards?: number;
  totalCards?: number;
  homeCorners?: number;
  awayCorners?: number;
  totalCorners?: number;
  [key: string]: unknown;
}

export interface Match {
  id: string;
  scheduledDay: ScheduledDay;
  scheduledAt: string;
  status: MatchStatus;
  homeTeam: Team;
  awayTeam: Team;
  odds: OddsQuote[];
  resultPayload?: MatchResult | null;
}

export interface Round {
  id: string;
  weekNumber: number;
  status: RoundStatus;
  opensAt: string;
  bettingClosesAt: string;
  matches: Match[];
}

export interface Bet {
  id: string;
  market: Market;
  selection: string;
  stake: Numeric;
  oddsTaken: Numeric;
  status: BetStatus;
  payout?: Numeric | null;
  createdAt?: string;
  match: Match & { round?: Pick<Round, 'id' | 'weekNumber'> };
}

export type LeagueStandings = StandingsResponse;
export type BettingLeaderboardEntry = BettingLeaderboardEntryDto;

export interface PlaceBetInput {
  matchId: string;
  market: Market;
  selection: string;
  stake: number;
}

export interface PlaceBetResponse {
  bet: Omit<Bet, 'match'>;
  coinBalance: Numeric;
}

export interface LineupInput {
  formation: string;
  tactics: Record<string, unknown>;
}

export type AppTab = 'matches' | 'standings' | 'bets' | 'leaderboard' | 'team';
