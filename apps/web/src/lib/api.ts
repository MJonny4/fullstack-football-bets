import type {
  AuthResponse,
  Bet,
  BettingLeaderboardEntry,
  LeagueStandings,
  LedgerEntry,
  LineupDraftInput,
  LineupInput,
  ManagerTeamProfile,
  PlaceBetInput,
  PlaceBetResponse,
  PublishLineupResult,
  PublicManagerProfile,
  Round,
  Team,
  TeamMatchHistoryPage,
  TeamProfile,
  User,
} from '../types';

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

  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(path, { ...init, headers, credentials: 'include' });
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
  signup(input: { email: string; password: string; username: string; displayName: string }) {
    return request<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  login(email: string, password: string) {
    return request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  logout() {
    return request<void>('/api/auth/logout', { method: 'POST' });
  },

  forgotPassword(email: string) {
    return request<{ accepted: true }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword(token: string, password: string) {
    return request<AuthResponse>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },

  verifyEmail(token: string) {
    return request<{ verified: true }>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  resendVerification() {
    return request<{ accepted: true }>('/api/auth/resend-verification', { method: 'POST' });
  },

  me() {
    return request<User>('/api/users/me');
  },

  updateProfile(input: { username: string; displayName: string }) {
    return request<User>('/api/users/me/profile', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  updateAvatar(file: File) {
    const body = new FormData();
    body.append('avatar', file);
    return request<User>('/api/users/me/avatar', { method: 'POST', body });
  },

  removeAvatar() {
    return request<User>('/api/users/me/avatar', { method: 'DELETE' });
  },

  changePassword(input: { currentPassword: string; newPassword: string }) {
    return request<{ changed: true }>('/api/users/me/password', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  deactivateAccount(password: string) {
    return request<void>('/api/users/me/deactivate', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  ledger() {
    return request<LedgerEntry[]>('/api/users/me/ledger');
  },

  managerProfile(username: string) {
    return request<PublicManagerProfile>(`/api/users/${encodeURIComponent(username)}`);
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
