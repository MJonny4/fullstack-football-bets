import type {
  AuthResponse,
  Bet,
  BettingLeaderboardEntry,
  LeagueStandings,
  LineupDraftInput,
  LineupInput,
  ManagerTeamProfile,
  PlaceBetInput,
  PlaceBetResponse,
  PublishLineupResult,
  Round,
  Team,
  TeamMatchHistoryPage,
  TeamProfile,
  User,
} from '../types';

const TOKEN_KEY = 'football-bets.access-token';

export class ApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export function getAccessToken(): string | null {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

function errorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === 'string' && payload.trim()) return payload;
  if (payload && typeof payload === 'object') {
    const value = (payload as { message?: unknown }).message;
    if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string').join('. ');
    if (typeof value === 'string' && value.trim()) return value;
    const error = (payload as { error?: unknown }).error;
    if (typeof error === 'string' && error.trim()) return error;
  }
  return fallback;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getAccessToken();

  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(path, { ...init, headers });
  } catch {
    throw new ApiError('The server could not be reached. Check your connection and try again.', 0);
  }

  const contentType = response.headers.get('content-type') ?? '';
  const payload: unknown = response.status === 204
    ? undefined
    : contentType.includes('application/json')
      ? await response.json().catch(() => undefined)
      : await response.text().catch(() => undefined);

  if (!response.ok) {
    throw new ApiError(errorMessage(payload, `Request failed (${response.status})`), response.status, payload);
  }

  return payload as T;
}

export const api = {
  signup(email: string, password: string) {
    return request<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  login(email: string, password: string) {
    return request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  me() {
    return request<User>('/api/users/me');
  },

  async currentRound() {
    try {
      return await request<Round>('/api/rounds/current');
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  bets() {
    return request<Bet[]>('/api/bets');
  },

  placeBet(input: PlaceBetInput) {
    return request<PlaceBetResponse>('/api/bets', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  cancelBet(betId: string) {
    return request<PlaceBetResponse>(`/api/bets/${encodeURIComponent(betId)}`, {
      method: 'DELETE',
    });
  },

  leaderboard() {
    return request<BettingLeaderboardEntry[]>('/api/leaderboard');
  },

  standings() {
    return request<LeagueStandings>('/api/standings');
  },

  teams() {
    return request<Team[]>('/api/teams');
  },

  team(teamId: string) {
    return request<TeamProfile>(`/api/teams/${encodeURIComponent(teamId)}`);
  },

  teamMatchHistory(teamId: string, cursor?: string) {
    const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
    return request<TeamMatchHistoryPage>(
      `/api/teams/${encodeURIComponent(teamId)}/history${query}`,
    );
  },

  managerTeam() {
    return request<ManagerTeamProfile>('/api/teams/me');
  },

  saveLineupDraft(input: LineupDraftInput) {
    return request<ManagerTeamProfile>('/api/teams/me/draft', {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  publishLineup() {
    return request<PublishLineupResult>('/api/teams/me/publish', {
      method: 'POST',
    });
  },

  claimTeam(teamId: string) {
    return request<unknown>(`/api/teams/${encodeURIComponent(teamId)}/claim`, { method: 'POST' });
  },

  saveLineup(input: LineupInput) {
    return request<DTAssignmentResponse>('/api/teams/me/lineup', {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },
};

interface DTAssignmentResponse {
  formation?: string;
  tactics?: Record<string, unknown>;
  [key: string]: unknown;
}

export function readableError(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
