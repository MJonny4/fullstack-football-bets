import { useMemo } from 'react';
import { formatDate } from '../lib/format';
import type { PlaceBetInput, Round } from '../types';
import { useCountdown } from '../hooks/useCountdown';
import { MatchCard } from './MatchCard';
import { EmptyState, Icon, StatusPill } from './ui';

interface MatchesPageProps {
  round: Round | null;
  balance: number;
  managedTeamId: string | null;
  onPlaceBet: (input: PlaceBetInput) => Promise<void>;
}

export function MatchesPage({ round, balance, managedTeamId, onPlaceBet }: MatchesPageProps) {
  const countdown = useCountdown(round?.bettingClosesAt ?? '');
  const bettingClosed = !round || round.status.toUpperCase() !== 'OPEN' || countdown.isElapsed;

  const matchGroups = useMemo(() => {
    const groups = new Map<string, Round['matches']>();
    for (const match of round?.matches ?? []) {
      const key = match.scheduledDay || formatDate(match.scheduledAt).split(',')[0] || 'Fixtures';
      const existing = groups.get(key);
      if (existing) existing.push(match);
      else groups.set(key, [match]);
    }
    return [...groups.entries()];
  }, [round]);

  if (!round) {
    return (
      <EmptyState
        detail="The next set of fixtures and markets will appear here as soon as the weekly round opens."
        icon="clock"
        title="No active round yet"
      />
    );
  }

  return (
    <div>
      <section className="relative overflow-hidden rounded-[2rem] bg-pitch-950 px-6 py-7 text-white shadow-card sm:px-8 sm:py-8">
        <div className="absolute inset-0 bg-stadium-grid bg-[size:34px_34px] opacity-60" />
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-pitch-400/20 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={round.status} />
              <span className="text-xs font-bold uppercase tracking-[.16em] text-white/45">Week {round.weekNumber}</span>
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">This week’s board</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
              Compare the markets, make one call at a time, and remember: your price is locked when the bet lands.
            </p>
          </div>

          <div className={`rounded-2xl border px-5 py-4 backdrop-blur ${bettingClosed ? 'border-rose-300/20 bg-rose-400/10' : 'border-white/10 bg-white/[.07]'}`}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/45">
              <Icon name="clock" className="h-4 w-4" />
              {bettingClosed ? 'Window status' : 'Betting closes in'}
            </div>
            <div className="mt-1 font-display text-2xl font-bold tabular-nums text-white">{bettingClosed ? 'Closed' : countdown.compactLabel}</div>
            <div className="mt-1 text-[11px] font-medium text-white/40">{formatDate(round.bettingClosesAt)}</div>
          </div>
        </div>
      </section>

      {bettingClosed && round.status.toUpperCase() === 'OPEN' && countdown.isElapsed && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          The displayed deadline has passed. New bets are disabled while the server closes the round.
        </div>
      )}

      {matchGroups.length > 0 ? (
        <div className="mt-8 space-y-9">
          {matchGroups.map(([day, matches]) => (
            <section key={day}>
              <div className="mb-4 flex items-center gap-3">
                <h2 className="font-display text-xl font-bold text-ink">{day}</h2>
                <span className="rounded-full bg-slate-200/70 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{matches.length} matches</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <div className="grid gap-5 xl:grid-cols-2">
                {matches.map((match) => (
                  <MatchCard
                    balance={balance}
                    bettingClosed={bettingClosed}
                    key={match.id}
                    match={match}
                    ownTeamInvolved={managedTeamId === match.homeTeam.id || managedTeamId === match.awayTeam.id}
                    onPlaceBet={onPlaceBet}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-7">
          <EmptyState detail="Pairings are still being prepared for this round." icon="ball" title="Fixtures coming soon" />
        </div>
      )}
    </div>
  );
}
