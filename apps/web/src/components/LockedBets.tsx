import type { Bet } from '../types';
import { formatCoins, selectionLabel, marketLabel } from '../lib/format';

export function LockedBets({ bets, dark = false }: { bets: Bet[]; dark?: boolean }) {
  if (!bets.length) return null;
  return <div className={`rounded-xl border p-3 text-xs ${dark ? 'border-white/10 bg-white/5 text-white/65' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
    <p className={`text-[9px] font-extrabold uppercase tracking-[.16em] ${dark ? 'text-amber-200' : 'text-pitch-700'}`}>Your pre-match picks · locked</p>
    <div className="mt-2 space-y-2">{bets.map(bet => <div className="flex flex-wrap justify-between gap-2" key={bet.id}>
      <span>{marketLabel(bet.market)} · <strong>{selectionLabel(bet.selection)}</strong></span>
      <span className="tabular-nums">{formatCoins(bet.stake)} coins · {bet.status === 'WON' ? `Won +${formatCoins(bet.payout)}` : bet.status === 'LOST' ? 'Lost' : bet.status === 'CANCELLED' ? 'Refunded' : 'Pending full time'}</span>
    </div>)}</div>
  </div>;
}
