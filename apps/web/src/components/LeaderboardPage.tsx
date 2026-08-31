import { formatCoins } from '../lib/format';
import type { BettingLeaderboardEntry, User } from '../types';
import { EmptyState, Icon, TeamCrest } from './ui';
import { Link } from 'react-router';

function signedCoins(value: number): string {
  if (value > 0) return `+${formatCoins(value)}`;
  return formatCoins(value);
}

function percentage(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(1)}%`;
}

function profitStyle(value: number): string {
  if (value > 0) return 'text-pitch-700';
  if (value < 0) return 'text-rose-700';
  return 'text-slate-500';
}

function ManagerIdentity({ entry, compact = false }: { entry: BettingLeaderboardEntry; compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {entry.team ? (
        <Link aria-label={`Open ${entry.team.name} club profile`} className="rounded-xl" to={`/teams/${encodeURIComponent(entry.team.id)}`}>
          <TeamCrest size="sm" team={entry.team} />
        </Link>
      ) : (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
          <Icon className="h-4 w-4" name="ranking" />
        </span>
      )}
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="block truncate text-sm font-extrabold text-ink">{entry.displayName}</span>
          {entry.provisional && (
            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-amber-800">
              Provisional
            </span>
          )}
        </span>
        {!compact && (
          <span className="mt-0.5 block truncate text-[10px] font-semibold text-slate-400">
            {entry.team ? (
              <Link className="underline-offset-2 hover:text-pitch-700 hover:underline" to={`/teams/${encodeURIComponent(entry.team.id)}`}>{entry.team.name}</Link>
            ) : 'Independent manager'}
            {entry.pendingBets > 0 ? ` · ${entry.pendingBets} pending` : ''}
          </span>
        )}
      </span>
    </div>
  );
}

export function LeaderboardPage({ entries, user, connected }: { entries: BettingLeaderboardEntry[]; user: User; connected: boolean }) {
  const ranked = entries
    .filter((entry): entry is BettingLeaderboardEntry & { rank: number } => entry.rank !== null)
    .sort((left, right) => left.rank - right.rank);
  const unranked = entries.filter((entry) => entry.rank === null);
  const ordered = [...ranked, ...unranked];
  const podium = ranked.slice(0, 3);
  const ownEntry = entries.find((entry) => entry.userId === user.id);

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-pitch-700">Manager performance</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">Betting leaderboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Ranked by net profit from settled bets. Pending wagers and weekly top-ups never affect performance.
          </p>
        </div>
        <div
          aria-live="polite"
          className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${connected ? 'bg-pitch-100 text-pitch-800' : 'bg-amber-100 text-amber-800'}`}
          role="status"
        >
          <span aria-hidden="true" className={`h-2 w-2 rounded-full motion-safe:animate-pulse ${connected ? 'bg-pitch-500' : 'bg-amber-500'}`} />
          {connected ? 'Live updates on' : 'Reconnecting…'}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[11px] font-semibold leading-5 text-slate-500 shadow-card sm:px-5">
        <span>All-time performance · one settled bet earns a rank · records remain provisional through the first four results.</span>
        <span className="font-extrabold text-slate-700">Profit → ROI → settled bets → wins</span>
      </div>

      {ranked.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            detail="Rankings begin when the first wager is settled. Pending bets are shown in your personal activity but do not count yet."
            icon="ranking"
            title="No settled bets yet"
          />
          {ownEntry && ownEntry.pendingBets > 0 && (
            <div className="mx-auto mt-4 max-w-xl rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-center">
              <div className="text-sm font-extrabold text-amber-900">You have {ownEntry.pendingBets} pending {ownEntry.pendingBets === 1 ? 'wager' : 'wagers'}</div>
              <div className="mt-1 text-xs font-semibold text-amber-700">{formatCoins(ownEntry.pendingStake)} coins will enter your record after settlement.</div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {podium.map((entry, index) => {
              const mine = entry.userId === user.id;
              return (
                <article
                  className={`relative overflow-hidden rounded-2xl border p-5 ${index === 0 ? 'border-gold/50 bg-gradient-to-br from-amber-50 to-white sm:-translate-y-2' : mine ? 'border-pitch-200 bg-pitch-50/60' : 'border-slate-200 bg-white'}`}
                  key={entry.userId}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={`grid h-9 min-w-9 place-items-center rounded-full px-2 font-display text-sm font-bold ${index === 0 ? 'bg-gold text-amber-950' : 'bg-slate-100 text-slate-500'}`}>#{entry.rank}</span>
                    {mine && <span className="rounded-full bg-pitch-200 px-2 py-1 text-[8px] font-extrabold uppercase tracking-wider text-pitch-900">You</span>}
                  </div>
                  <div className="mt-5"><ManagerIdentity entry={entry} /></div>
                  <div className={`mt-5 font-display text-2xl font-bold ${profitStyle(entry.netProfit)}`}>{signedCoins(entry.netProfit)}</div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Net profit</div>
                  <div className="mt-3 text-xs font-bold text-slate-500">
                    ROI {percentage(entry.roiPercent)} · {entry.wins}–{entry.losses} · {percentage(entry.hitRatePercent)} hit rate
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-5 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card lg:block">
            <table className="w-full border-collapse">
              <caption className="sr-only">All-time betting leaderboard ranked by settled net profit</caption>
              <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">
                <tr>
                  <th className="w-16 px-3 py-3.5 text-center" scope="col">Rank</th>
                  <th className="px-3 py-3.5 text-left" scope="col">Manager</th>
                  <th className="px-3 py-3.5 text-center" scope="col">Record</th>
                  <th className="px-3 py-3.5 text-center" scope="col">Hit rate</th>
                  <th className="px-3 py-3.5 text-right" scope="col">Settled stake</th>
                  <th className="px-3 py-3.5 text-right" scope="col">Net P/L</th>
                  <th className="px-3 py-3.5 text-center" scope="col">ROI</th>
                  <th className="px-4 py-3.5 text-right" scope="col">Available</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ordered.map((entry) => {
                  const mine = entry.userId === user.id;
                  return (
                    <tr className={mine ? 'bg-pitch-50/70' : 'transition-colors hover:bg-slate-50/70'} key={entry.userId}>
                      <td className="px-3 py-4 text-center font-display text-sm font-bold text-slate-500">
                        {entry.rank === null ? '—' : `#${entry.rank}`}
                      </td>
                      <th className="px-3 py-4 text-left" scope="row">
                        <div className="flex items-center gap-2">
                          <ManagerIdentity entry={entry} />
                          {mine && <span className="rounded-full bg-pitch-200 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-pitch-900">You</span>}
                        </div>
                      </th>
                      <td className="px-3 py-4 text-center text-xs font-extrabold text-ink">{entry.settledBets ? `${entry.wins}–${entry.losses}` : '—'}</td>
                      <td className="px-3 py-4 text-center text-xs font-bold text-slate-500">{percentage(entry.hitRatePercent)}</td>
                      <td className="px-3 py-4 text-right text-xs font-bold text-slate-500">{formatCoins(entry.settledStake)}</td>
                      <td className={`px-3 py-4 text-right font-display text-sm font-bold ${profitStyle(entry.netProfit)}`}>{signedCoins(entry.netProfit)}</td>
                      <td className="px-3 py-4 text-center text-xs font-extrabold text-ink">{percentage(entry.roiPercent)}</td>
                      <td className="px-4 py-4 text-right text-xs font-bold text-slate-500">{formatCoins(entry.coinBalance)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ol className="mt-5 space-y-3 lg:hidden" aria-label="Betting leaderboard">
            {ordered.map((entry) => {
              const mine = entry.userId === user.id;
              return (
                <li className={`rounded-2xl border p-4 shadow-card ${mine ? 'border-pitch-200 bg-pitch-50/70' : 'border-slate-200 bg-white'}`} key={entry.userId}>
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 min-w-9 place-items-center rounded-xl bg-slate-100 px-2 font-display text-xs font-bold text-slate-500">
                      {entry.rank === null ? '—' : `#${entry.rank}`}
                    </span>
                    <div className="min-w-0 flex-1"><ManagerIdentity compact entry={entry} /></div>
                    <div className="text-right">
                      <div className={`font-display text-base font-bold ${profitStyle(entry.netProfit)}`}>{signedCoins(entry.netProfit)}</div>
                      <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Net P/L</div>
                    </div>
                  </div>
                  <dl className="mt-4 grid grid-cols-4 rounded-xl bg-slate-50 p-3 text-center">
                    <MobileMetric label="Record" value={entry.settledBets ? `${entry.wins}–${entry.losses}` : '—'} />
                    <MobileMetric label="Hit rate" value={percentage(entry.hitRatePercent)} />
                    <MobileMetric label="ROI" value={percentage(entry.roiPercent)} />
                    <MobileMetric label="Available" value={formatCoins(entry.coinBalance)} />
                  </dl>
                  {(entry.pendingBets > 0 || mine) && (
                    <div className="mt-3 flex items-center justify-between gap-3 text-[10px] font-semibold text-slate-400">
                      <span>{entry.team?.name ?? 'Independent manager'}{mine ? ' · You' : ''}</span>
                      {entry.pendingBets > 0 && <span>{entry.pendingBets} pending · {formatCoins(entry.pendingStake)} coins</span>}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </>
      )}

      {ownEntry && ownEntry.rank !== null && ownEntry.rank > 3 && (
        <p className="mt-4 text-center text-xs font-semibold text-slate-400">
          You are #{ownEntry.rank} with {signedCoins(ownEntry.netProfit)} net profit and {percentage(ownEntry.roiPercent)} ROI.
        </p>
      )}
    </section>
  );
}

function MobileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="mt-1 text-xs font-extrabold text-ink">{value}</dd>
    </div>
  );
}
