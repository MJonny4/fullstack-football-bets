import { useMemo, useState, type FormEvent } from 'react';
import { readableError } from '../lib/api';
import {
  formatDate,
  formatOdds,
  marketLabel,
  normalizeMarket,
  resultScore,
  selectionLabel,
  toNumber,
} from '../lib/format';
import type { Match, OddsQuote, PlaceBetInput } from '../types';
import { Alert, Icon, StatusPill } from './ui';
import { TeamLink } from './TeamLink';

interface MatchCardProps {
  match: Match;
  balance: number;
  bettingClosed: boolean;
  ownTeamInvolved: boolean;
  onPlaceBet: (input: PlaceBetInput) => Promise<void>;
}

interface MarketGroup {
  key: string;
  market: string;
  quotes: OddsQuote[];
}

function quoteLabel(quote: OddsQuote, match: Match): string {
  const normalizedMarket = normalizeMarket(quote.market);
  const normalizedSelection = quote.selection.trim().toUpperCase();
  const isMatchResult = ['MATCH_RESULT', 'ONE_X_TWO', '1X2'].includes(normalizedMarket);

  if (isMatchResult && ['HOME', '1'].includes(normalizedSelection)) return match.homeTeam.name;
  if (isMatchResult && ['AWAY', '2'].includes(normalizedSelection)) return match.awayTeam.name;
  return selectionLabel(quote.selection);
}

function groupQuotes(quotes: OddsQuote[]): MarketGroup[] {
  const groups = new Map<string, MarketGroup>();
  for (const quote of quotes) {
    const key = normalizeMarket(quote.market);
    const current = groups.get(key);
    if (current) current.quotes.push(quote);
    else groups.set(key, { key, market: quote.market, quotes: [quote] });
  }

  const order = ['MATCH_RESULT', 'ONE_X_TWO', '1X2', 'EXACT_SCORE', 'FINAL_SCORE', 'TOTAL_CARDS', 'CARDS_TOTAL', 'TOTAL_CORNERS', 'CORNERS_TOTAL'];
  return [...groups.values()].sort((left, right) => {
    const leftIndex = order.indexOf(left.key);
    const rightIndex = order.indexOf(right.key);
    return (leftIndex < 0 ? 999 : leftIndex) - (rightIndex < 0 ? 999 : rightIndex);
  });
}

export function MatchCard({ match, balance, bettingClosed, ownTeamInvolved, onPlaceBet }: MatchCardProps) {
  const groups = useMemo(() => groupQuotes(match.odds ?? []), [match.odds]);
  const [activeMarket, setActiveMarket] = useState(groups[0]?.key ?? '');
  const [selected, setSelected] = useState<OddsQuote | null>(null);
  const [stake, setStake] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const score = resultScore(match.resultPayload);

  const currentGroup = groups.find((group) => group.key === activeMarket) ?? groups[0];
  const stakeValue = Number(stake);
  const isValidStake = Number.isInteger(stakeValue) && stakeValue > 0;
  const isAffordable = isValidStake && stakeValue <= balance;
  const potentialReturn = selected && isValidStake ? Math.floor(stakeValue * toNumber(selected.odds)) : 0;
  const isResolved = match.status.toUpperCase() === 'RESOLVED';

  function chooseMarket(key: string) {
    setActiveMarket(key);
    setSelected(null);
    setMessage(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !isAffordable || bettingClosed || isResolved || ownTeamInvolved) return;

    setSubmitting(true);
    setMessage(null);
    try {
      await onPlaceBet({
        matchId: match.id,
        market: selected.market,
        selection: selected.selection,
        stake: stakeValue,
      });
      setStake('');
      setSelected(null);
      setMessage({ tone: 'success', text: 'Bet placed. Your odds are locked in.' });
    } catch (error) {
      setMessage({ tone: 'error', text: readableError(error) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-card">
      <header className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Icon name="clock" className="h-4 w-4" />
            <span>{match.scheduledDay ? selectionLabel(match.scheduledDay) : formatDate(match.scheduledAt)}</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>{formatDate(match.scheduledAt)}</span>
          </div>
          <StatusPill status={match.status} />
        </div>
      </header>

      <div className="px-5 pb-5 pt-6 sm:px-6 sm:pb-6">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
          <TeamLink className="min-w-0" team={match.homeTeam} />
          <div className="text-center">
            {score ? (
              <div className="font-display text-3xl font-bold tracking-tight text-ink">{score}</div>
            ) : (
              <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-extrabold uppercase tracking-widest text-slate-400">vs</div>
            )}
            <div className="mt-2 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">{score ? 'Full time' : 'Fixture'}</div>
          </div>
          <TeamLink className="min-w-0" team={match.awayTeam} />
        </div>

        {groups.length > 0 ? (
          <>
            <div className="hide-scrollbar -mx-1 mt-7 flex gap-1 overflow-x-auto border-b border-slate-100 px-1" role="tablist" aria-label="Bet markets">
              {groups.map((group) => (
                <button
                  aria-selected={currentGroup?.key === group.key}
                  className={`shrink-0 border-b-2 px-3 pb-2.5 text-xs font-extrabold transition ${currentGroup?.key === group.key ? 'border-pitch-600 text-pitch-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                  key={group.key}
                  onClick={() => chooseMarket(group.key)}
                  role="tab"
                  type="button"
                >
                  {marketLabel(group.market)}
                </button>
              ))}
            </div>

            {currentGroup && (
              <div
                className={`mt-4 grid gap-2 ${currentGroup.quotes.length > 6 ? 'grid-cols-4 sm:grid-cols-5' : currentGroup.quotes.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}
                role="tabpanel"
              >
                {currentGroup.quotes.map((quote) => {
                  const chosen = selected?.market === quote.market && selected?.selection === quote.selection;
                  return (
                    <button
                      aria-pressed={chosen}
                      className={`group min-w-0 rounded-xl border px-2 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-55 ${chosen ? 'border-pitch-600 bg-pitch-50 ring-2 ring-pitch-100' : 'border-slate-200 bg-white hover:border-pitch-300 hover:bg-pitch-50/50'}`}
                      disabled={bettingClosed || isResolved || ownTeamInvolved}
                      key={`${quote.market}:${quote.selection}`}
                      onClick={() => {
                        setSelected(quote);
                        setMessage(null);
                      }}
                      type="button"
                    >
                      <span className={`block truncate text-[11px] font-bold ${chosen ? 'text-pitch-800' : 'text-slate-500'}`}>{quoteLabel(quote, match)}</span>
                      <span className={`mt-1 block font-display text-base font-bold ${chosen ? 'text-pitch-800' : 'text-ink'}`}>{formatOdds(quote.odds)}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <form className="mt-4" onSubmit={submit}>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <label className="relative block">
                  <span className="sr-only">Stake in coins</span>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 pr-16 text-sm font-bold text-ink outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-pitch-500 focus:bg-white focus:ring-4 focus:ring-pitch-100 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={bettingClosed || isResolved || ownTeamInvolved}
                    inputMode="numeric"
                    max={Math.floor(balance)}
                    min="1"
                    onChange={(event) => {
                      setStake(event.target.value);
                      setMessage(null);
                    }}
                    pattern="[0-9]*"
                    placeholder="Stake"
                    step="1"
                    type="number"
                    value={stake}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] font-extrabold uppercase tracking-wider text-slate-400">coins</span>
                </label>
                <button
                  className="min-w-28 rounded-xl bg-pitch-700 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-pitch-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                  disabled={!selected || !isAffordable || bettingClosed || isResolved || ownTeamInvolved || submitting}
                  type="submit"
                >
                  {submitting ? 'Placing…' : 'Place bet'}
                </button>
              </div>

              <div className="mt-2 min-h-5 text-xs">
                {ownTeamInvolved ? (
                  <span className="font-semibold text-amber-700">Managers cannot bet on matches involving their own club.</span>
                ) : bettingClosed || isResolved ? (
                  <span className="font-semibold text-slate-400">Betting is unavailable for this match.</span>
                ) : stake && !isValidStake ? (
                  <span className="font-semibold text-rose-600">Enter a whole-number stake of at least 1 coin.</span>
                ) : isValidStake && !isAffordable ? (
                  <span className="font-semibold text-rose-600">Your stake is above your available balance.</span>
                ) : selected && isValidStake ? (
                  <span className="font-semibold text-slate-500">Potential return: <strong className="text-ink">{potentialReturn} coins</strong></span>
                ) : (
                  <span className="font-semibold text-slate-400">Choose one outcome and enter your stake.</span>
                )}
              </div>
            </form>

            {message && <div className="mt-2"><Alert tone={message.tone}>{message.text}</Alert></div>}
          </>
        ) : (
          <div className="mt-7 rounded-2xl bg-slate-50 px-4 py-5 text-center text-sm font-semibold text-slate-400">Odds are not available yet.</div>
        )}
      </div>
    </article>
  );
}
