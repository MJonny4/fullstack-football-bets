import { useState } from 'react';
import { useCountdown } from '../hooks/useCountdown';
import { readableError } from '../lib/api';
import { formatCoins, formatDate, formatOdds, marketLabel, resultScore, selectionLabel, toNumber } from '../lib/format';
import type { Bet, Round } from '../types';
import { Alert, EmptyState, StatusPill } from './ui';
import { TeamLink } from './TeamLink';

export function BetsPage({
  bets,
  onBrowse,
  onCancel,
  round,
}: {
  bets: Bet[];
  onBrowse: () => void;
  onCancel: (betId: string) => Promise<void>;
  round: Round | null;
}) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cancellationCountdown = useCountdown(round?.bettingClosesAt ?? '');
  const sortedBets = [...bets].sort((left, right) => {
    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return rightTime - leftTime;
  });

  async function cancel(betId: string) {
    setCancellingId(betId);
    setError(null);
    try {
      await onCancel(betId);
    } catch (cause) {
      setError(readableError(cause));
    } finally {
      setCancellingId(null);
    }
  }

  if (sortedBets.length === 0) {
    return (
      <EmptyState
        action={<button className="rounded-xl bg-pitch-700 px-5 py-3 text-sm font-extrabold text-white hover:bg-pitch-800" onClick={onBrowse} type="button">Browse this week’s odds</button>}
        detail="Once you back an outcome, the stake, locked price and result will all stay visible here."
        icon="ticket"
        title="Your bet history is empty"
      />
    );
  }

  return (
    <section>
      <div className="mb-6">
        <p className="text-xs font-extrabold uppercase tracking-[.16em] text-pitch-700">Your ledger</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">Bet history</h1>
        <p className="mt-2 text-sm text-slate-500">Every bet keeps the price you took, even if the market moves later.</p>
      </div>

      {error && <div className="mb-5"><Alert>{error}</Alert></div>}

      <div className="space-y-3">
        {sortedBets.map((bet) => {
          const score = resultScore(bet.match.resultPayload);
          const won = bet.status.toUpperCase() === 'WON';
          const cancelled = bet.status.toUpperCase() === 'CANCELLED';
          const canCancel = bet.status.toUpperCase() === 'PENDING'
            && bet.match.round?.id === round?.id
            && round?.status === 'OPEN'
            && !cancellationCountdown.isElapsed;
          return (
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5" key={bet.id}>
              <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <TeamLink compact team={bet.match.homeTeam} />
                        <span className="text-xs font-medium text-slate-400">vs</span>
                        <TeamLink compact team={bet.match.awayTeam} />
                      </div>
                      <div className="mt-1 text-xs font-semibold text-slate-400">
                        {score ? `FT ${score}` : formatDate(bet.match.scheduledAt)}
                        {bet.match.round?.weekNumber ? ` · Week ${bet.match.round.weekNumber}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                    <span><span className="text-slate-400">Market</span> <strong className="ml-1 text-ink">{marketLabel(bet.market)}</strong></span>
                    <span><span className="text-slate-400">Pick</span> <strong className="ml-1 text-ink">{selectionLabel(bet.selection)}</strong></span>
                    <span><span className="text-slate-400">Odds</span> <strong className="ml-1 font-display text-ink">{formatOdds(bet.oddsTaken)}</strong></span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-5 border-t border-slate-100 pt-4 sm:block sm:min-w-36 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0 sm:text-right">
                  <div>
                    <StatusPill status={bet.status} />
                    <div className="mt-2 text-xs font-semibold text-slate-400">Stake {formatCoins(bet.stake)}</div>
                    {canCancel && (
                      <button
                        className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[10px] font-extrabold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                        disabled={cancellingId !== null}
                        onClick={() => void cancel(bet.id)}
                        type="button"
                      >
                        {cancellingId === bet.id ? 'Cancelling…' : 'Cancel & refund'}
                      </button>
                    )}
                  </div>
                  <div>
                    <div className={`font-display text-xl font-bold ${won || cancelled ? 'text-pitch-700' : 'text-ink'}`}>
                      {won
                        ? `+${formatCoins(bet.payout)}`
                        : cancelled
                          ? formatCoins(bet.stake)
                          : bet.status.toUpperCase() === 'PENDING'
                            ? formatCoins(Math.floor(toNumber(bet.stake) * toNumber(bet.oddsTaken)))
                            : '0'}
                    </div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{won ? 'payout' : cancelled ? 'refunded' : bet.status.toUpperCase() === 'PENDING' ? 'possible' : 'return'}</div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
