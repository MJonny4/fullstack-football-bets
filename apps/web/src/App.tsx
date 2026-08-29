import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router';
import { io } from 'socket.io-client';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { BetsPage } from './components/BetsPage';
import { LeaderboardPage } from './components/LeaderboardPage';
import { LeagueTablePage } from './components/LeagueTablePage';
import { MatchesPage } from './components/MatchesPage';
import { TeamPage } from './components/TeamPage';
import { TeamProfilePage } from './components/TeamProfilePage';
import { Alert, Brand, CoinBalance, Icon, Spinner, type IconName } from './components/ui';
import { ApiError, api, getAccessToken, readableError } from './lib/api';
import { initials, toNumber } from './lib/format';
import type { Bet, BettingLeaderboardEntry, LeagueStandings, LineupInput, PlaceBetInput, Round, Team } from './types';

const NAVIGATION: { path: string; label: string; mobileLabel?: string; icon: IconName }[] = [
  { path: '/matches', label: 'Matches', icon: 'ball' },
  { path: '/standings', label: 'League', icon: 'table' },
  { path: '/bets', label: 'My bets', icon: 'ticket' },
  { path: '/leaderboard', label: 'Bettors', icon: 'ranking' },
  { path: '/my-team', label: 'My team', mobileLabel: 'Team', icon: 'shirt' },
];

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <main className="grid min-h-screen place-items-center bg-cream">
        <div className="text-center">
          <Brand />
          <div className="mt-5"><Spinner label="Restoring your session" /></div>
        </div>
      </main>
    );
  }

  return user ? <Dashboard /> : <AuthScreen />;
}

function Dashboard() {
  const { user, logout, refreshUser, updateBalance } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [round, setRound] = useState<Round | null>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [standings, setStandings] = useState<LeagueStandings | null>(null);
  const [leaderboard, setLeaderboard] = useState<BettingLeaderboardEntry[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const managedTeamId = teams.find((team) => team.isMine)?.id ?? user?.dtAssignment?.teamId ?? null;

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [currentRound, currentBets, currentStandings, currentLeaderboard, currentTeams] = await Promise.all([
        api.currentRound(),
        api.bets(),
        api.standings(),
        api.leaderboard(),
        api.teams(),
      ]);
      setRound(currentRound);
      setBets(currentBets);
      setStandings(currentStandings);
      setLeaderboard(currentLeaderboard);
      setTeams(currentTeams);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) logout();
      else setError(readableError(cause));
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;

    const token = getAccessToken();
    const socket = io({
      path: '/socket.io',
      auth: token ? { token } : undefined,
    });

    function receiveLeaderboard(payload: unknown) {
      if (!Array.isArray(payload)) return;
      const entries = payload.filter(isBettingLeaderboardEntry);
      setLeaderboard(entries);
      const ownEntry = entries.find((entry) => entry.userId === userId);
      if (ownEntry) updateBalance(ownEntry.coinBalance);
    }

    function receiveStandings(payload: unknown) {
      if (isLeagueStandings(payload)) setStandings(payload);
    }

    function receiveRound(payload: unknown) {
      if (isRound(payload)) setRound(payload);
    }

    function receiveTeam(payload: unknown) {
      if (!payload || typeof payload !== 'object' || typeof (payload as { teamId?: unknown }).teamId !== 'string') return;
      void api.teams().then(setTeams).catch(() => undefined);
      window.dispatchEvent(new CustomEvent('football-bets:team-update', { detail: payload }));
    }

    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('connect_error', () => setSocketConnected(false));
    socket.on('leaderboard:update', receiveLeaderboard);
    socket.on('standings:update', receiveStandings);
    socket.on('round:update', receiveRound);
    socket.on('team:update', receiveTeam);

    return () => {
      socket.off('leaderboard:update', receiveLeaderboard);
      socket.off('standings:update', receiveStandings);
      socket.off('round:update', receiveRound);
      socket.off('team:update', receiveTeam);
      socket.disconnect();
    };
  }, [updateBalance, user?.id]);

  const placeBet = useCallback(async (input: PlaceBetInput) => {
    const result = await api.placeBet(input);

    // A successful POST is final; subsequent refresh failures must not invite a duplicate bet.
    updateBalance(result.coinBalance);
    const [betsResult, userResult] = await Promise.allSettled([api.bets(), refreshUser()]);
    if (betsResult.status === 'fulfilled') setBets(betsResult.value);
    if (userResult.status === 'rejected') setError('Your bet was placed, but the latest balance could not be loaded. It will refresh with the live table.');
  }, [refreshUser, updateBalance]);

  const cancelBet = useCallback(async (betId: string) => {
    const result = await api.cancelBet(betId);
    updateBalance(result.coinBalance);
    const [betsResult, userResult] = await Promise.allSettled([api.bets(), refreshUser()]);
    if (betsResult.status === 'fulfilled') setBets(betsResult.value);
    if (userResult.status === 'rejected') setError('Your bet was cancelled and refunded, but the latest balance could not be loaded.');
  }, [refreshUser, updateBalance]);

  const claimTeam = useCallback(async (teamId: string) => {
    await api.claimTeam(teamId);
    const [nextTeams, nextLeaderboard] = await Promise.all([
      api.teams(),
      api.leaderboard(),
      refreshUser(),
    ]);
    setTeams(nextTeams);
    setLeaderboard(nextLeaderboard);
  }, [refreshUser]);

  const saveLineup = useCallback(async (input: LineupInput) => {
    await api.saveLineup(input);
    const [nextTeams] = await Promise.all([api.teams(), refreshUser()]);
    setTeams(nextTeams);
  }, [refreshUser]);

  const refreshFootballData = useCallback(async () => {
    const [nextRound, nextTeams] = await Promise.all([
      api.currentRound(),
      api.teams(),
    ]);
    setRound(nextRound);
    setTeams(nextTeams);
  }, []);

  const selectedNavigation = useMemo(
    () => NAVIGATION.find((item) => item.path === location.pathname),
    [location.pathname],
  );
  const mobileContext = selectedNavigation ?? (
    location.pathname.startsWith('/teams/')
      ? { icon: 'shirt' as const, label: 'Club profile' }
      : { icon: 'ball' as const, label: 'Touchline' }
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-cream pb-24 lg:pb-0">
      <header className="sticky top-0 z-30 border-b border-black/20 bg-gradient-to-r from-pitch-950/95 via-pitch-900/95 to-[#07553d]/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_16px_36px_-22px_rgba(4,43,31,0.95)] backdrop-blur-xl">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-pitch-300/60 to-transparent" />
        <div className="mx-auto flex h-24 max-w-[1440px] items-center justify-between gap-2 px-3 sm:gap-5 sm:px-6 lg:px-8">
          <div className="shrink-0 [&>div>span:last-child]:hidden min-[390px]:[&>div>span:last-child]:inline lg:[&>div>span:last-child]:hidden xl:[&>div>span:last-child]:inline">
            <Brand light />
          </div>

          <nav className="hidden items-center gap-1.5 rounded-[1.35rem] border border-white/15 bg-black/15 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_12px_24px_-16px_rgba(0,0,0,0.9)] ring-1 ring-black/10 lg:flex" aria-label="Primary navigation">
            {NAVIGATION.map((item) => (
              <NavLink
                className={({ isActive }) => `flex items-center gap-2 rounded-2xl px-3 py-3 text-sm font-bold transition-all duration-200 focus-visible:outline-white motion-reduce:transform-none xl:px-4 ${isActive ? '-translate-y-0.5 bg-gradient-to-b from-pitch-200 to-pitch-300 text-pitch-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_0_#0c754f,0_9px_18px_-9px_rgba(0,0,0,0.9)]' : 'text-white/65 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white'}`}
                key={item.path}
                to={item.path}
              >
                <Icon className="h-4 w-4" name={item.icon} />
                {item.label}
                {item.path === '/bets' && bets.length > 0 && <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] text-current">{bets.length}</span>}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="[&>div]:border-gold/40 [&>div]:bg-gold/15 [&>div]:text-amber-50 [&>div]:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
              <CoinBalance compact value={user.coinBalance} />
            </div>
            <div className="hidden h-10 w-px bg-white/15 sm:block" />
            <div className="hidden min-w-0 sm:block lg:hidden xl:block">
              <div className="max-w-40 truncate text-xs font-extrabold text-white">{user.email}</div>
              <div className="text-[10px] font-semibold text-pitch-200/70">League manager</div>
            </div>
            <span className="hidden h-10 w-10 place-items-center rounded-2xl border border-white/15 bg-white/10 text-xs font-extrabold text-pitch-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_5px_12px_-7px_rgba(0,0,0,0.9)] sm:grid">{initials(user.email)}</span>
            <button className="grid h-10 w-10 place-items-center rounded-2xl border border-transparent text-white/60 transition-all hover:border-white/10 hover:bg-white/10 hover:text-rose-200 focus-visible:outline-white" onClick={logout} title="Sign out" type="button">
              <Icon className="h-5 w-5" name="logout" />
              <span className="sr-only">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="mb-5 flex items-center gap-2 text-xs font-bold text-slate-400 lg:hidden">
          <Icon className="h-4 w-4" name={mobileContext.icon} />
          <span>{mobileContext.label}</span>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-3">
            <div className="flex-1"><Alert>{error}</Alert></div>
            <button className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-pitch-700" onClick={() => void loadDashboard()} title="Retry" type="button">
              <Icon name="refresh" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white"><Spinner label="Loading the weekly board" /></div>
        ) : (
          <>
            <Routes>
              <Route path="/" element={<Navigate replace to="/matches" />} />
              <Route path="/matches" element={<MatchesPage balance={toNumber(user.coinBalance)} managedTeamId={managedTeamId} onPlaceBet={placeBet} round={round} />} />
              <Route path="/standings" element={<LeagueTablePage standings={standings} user={user} />} />
              <Route path="/bets" element={<BetsPage bets={bets} onBrowse={() => navigate('/matches')} onCancel={cancelBet} round={round} />} />
              <Route path="/leaderboard" element={<LeaderboardPage connected={socketConnected} entries={leaderboard} user={user} />} />
              <Route path="/my-team" element={<TeamPage onClaim={claimTeam} onRefresh={refreshFootballData} onSaveLineup={saveLineup} teams={teams} user={user} />} />
              <Route path="/teams/:teamId" element={<TeamProfilePage />} />
              <Route path="*" element={<Navigate replace to="/matches" />} />
            </Routes>
          </>
        )}
      </main>

      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-[1.4rem] border border-white/15 bg-gradient-to-b from-pitch-900/95 to-pitch-950/95 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_38px_-12px_rgba(4,43,31,0.8)] ring-1 ring-black/10 backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">
        {NAVIGATION.map((item) => (
          <NavLink
            className={({ isActive }) => `flex flex-col items-center gap-1 rounded-2xl px-1 py-2.5 text-[10px] font-extrabold transition-all duration-200 focus-visible:outline-white motion-reduce:transform-none ${isActive ? '-translate-y-1 bg-gradient-to-b from-pitch-200 to-pitch-300 text-pitch-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_0_#0c754f,0_10px_18px_-10px_rgba(0,0,0,0.9)]' : 'text-white/55 hover:bg-white/10 hover:text-white'}`}
            key={item.path}
            to={item.path}
          >
            <Icon className="h-5 w-5" name={item.icon} />
            {item.mobileLabel ?? item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function isBettingLeaderboardEntry(value: unknown): value is BettingLeaderboardEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<BettingLeaderboardEntry>;
  return (entry.rank === null || typeof entry.rank === 'number')
    && typeof entry.userId === 'string'
    && typeof entry.displayName === 'string'
    && typeof entry.netProfit === 'number'
    && typeof entry.settledBets === 'number'
    && (typeof entry.coinBalance === 'number' || typeof entry.coinBalance === 'string');
}

function isLeagueStandings(value: unknown): value is LeagueStandings {
  if (!value || typeof value !== 'object') return false;
  const table = value as Partial<LeagueStandings>;
  return typeof table.seasonNumber === 'number'
    && typeof table.currentMatchweek === 'number'
    && typeof table.playedMatches === 'number'
    && Array.isArray(table.entries);
}

function isRound(value: unknown): value is Round {
  if (!value || typeof value !== 'object') return false;
  const round = value as Partial<Round>;
  return typeof round.id === 'string'
    && typeof round.weekNumber === 'number'
    && Array.isArray(round.matches);
}
