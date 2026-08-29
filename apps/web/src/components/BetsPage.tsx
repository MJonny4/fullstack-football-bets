import { formatCoins, formatDate, formatOdds, marketLabel, resultScore, selectionLabel, toNumber } from '../lib/format';
import type { Bet } from '../types';
import { EmptyState, StatusPill, TeamCrest } from './ui';

export function BetsPage({ bets, onBrowse }: { bets: Bet[]; onBrowse: () => void }) {
  const sortedBets = [...bets].sort((left, right) => {
    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return rightTime - leftTime;
  });

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

      <div className="space-y-3">
        {sortedBets.map((bet) => {
          const score = resultScore(bet.match.resultPayload);
          const won = bet.status.toUpperCase() === 'WON';
          return (
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5" key={bet.id}>
              <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      <TeamCrest size="sm" team={bet.match.homeTeam} />
                      <TeamCrest size="sm" team={bet.match.awayTeam} />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-extrabold text-ink">
                        {bet.match.homeTeam.name} <span className="mx-1 font-medium text-slate-400">vs</span> {bet.match.awayTeam.name}
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
                  </div>
                  <div>
                    <div className={`font-display text-xl font-bold ${won ? 'text-pitch-700' : 'text-ink'}`}>
                      {won ? `+${formatCoins(bet.payout)}` : bet.status.toUpperCase() === 'PENDING' ? formatCoins(Math.floor(toNumber(bet.stake) * toNumber(bet.oddsTaken))) : '0'}
                    </div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{won ? 'payout' : bet.status.toUpperCase() === 'PENDING' ? 'possible' : 'return'}</div>
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
