import { Link } from 'react-router';
import { useCountdown } from '../hooks/useCountdown';
import { useMatchClock } from '../hooks/useMatchClock';
import { formatDate, resultScore } from '../lib/format';
import type { Bet, Match } from '../types';
import { TeamCrest } from './ui';
import { LockedBets } from './LockedBets';

export function LiveMatchCard({ match, bets }: { match: Match; bets: Bet[] }) {
  const live = match.live;
  const { clock, stale } = useMatchClock(live);
  const countdown = useCountdown(match.scheduledAt);
  const playing = live && live.phase !== 'PENDING' && live.phase !== 'FINISHED';
  const finished = live?.phase === 'FINISHED' || match.status === 'RESOLVED';
  const score = live ? `${live.homeScore} : ${live.awayScore}` : resultScore(match.resultPayload);
  return <article className={`relative overflow-hidden rounded-[1.75rem] border shadow-card ${playing ? 'border-pitch-500 bg-[#071f1b] text-white' : 'border-slate-200 bg-white text-ink'}`}>
    {playing && <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-pitch-400/10 blur-3xl" />}
    <header className={`relative flex items-center justify-between border-b px-5 py-4 text-[10px] font-extrabold uppercase tracking-wider ${playing ? 'border-white/10 text-white/50' : 'border-slate-100 text-slate-400'}`}>
      <span>{formatDate(match.scheduledAt)}</span>
      <span className={`flex items-center gap-2 rounded-full px-2.5 py-1 ${playing ? 'bg-pitch-400/15 text-pitch-200' : 'bg-slate-100 text-slate-500'}`}>
        {playing && <span className="h-1.5 w-1.5 rounded-full bg-pitch-300 motion-safe:animate-pulse" />}
        {playing ? stale ? 'Reconnecting' : live.phase === 'HALFTIME' ? 'Half time' : 'Live' : finished ? 'Full time' : 'Markets closed'}
      </span>
    </header>
    <div className="relative p-5 sm:p-6">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        {[match.homeTeam, null, match.awayTeam].map((team, i) => team ? <Link key={team.id} to={`/teams/${team.id}`} className="flex min-w-0 flex-col items-center gap-2 text-center">
          <TeamCrest team={team} size="lg" /><span className="w-full truncate font-display text-sm font-bold">{team.shortName || team.name}</span>
        </Link> : <div className="min-w-20 text-center" key={i}>
          <div className="font-display text-4xl font-bold tabular-nums tracking-tight">{score ?? 'vs'}</div>
          <div className={`mt-2 text-xs font-bold ${playing ? 'text-pitch-300' : 'text-slate-400'}`}>{live ? clock : finished ? 'FT' : countdown.isElapsed ? 'Awaiting kickoff' : countdown.compactLabel}</div>
        </div>)}
      </div>
      {live && <>
        <div className="mt-6 flex h-1 overflow-hidden rounded-full bg-white/15" aria-label={`Home pressure ${Math.round(live.pressure)} percent`}>
          <div className="bg-pitch-400 transition-all duration-1000" style={{ width: `${live.pressure}%` }} />
          <div className="flex-1 bg-amber-300/70" />
        </div>
        <p className={`mt-3 min-h-10 text-xs leading-5 ${playing ? 'text-white/65' : 'text-slate-500'}`}>{live.lastEvent?.text ?? 'The players are ready for kickoff.'}</p>
      </>}
      {finished && <p className="mt-4 text-center text-xs font-semibold text-slate-500">{match.status === 'RESOLVED' || live?.settled ? 'Result confirmed' : 'Full time · settling bets'}</p>}
      <div className="mt-4"><LockedBets bets={bets} dark={Boolean(playing)} /></div>
      <Link to={`/matches/${match.id}/live`} className={`mt-5 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-extrabold transition ${playing ? 'bg-pitch-300 text-pitch-950 hover:bg-pitch-200' : 'bg-pitch-50 text-pitch-800 hover:bg-pitch-100'}`}>
        {playing ? 'Enter the match →' : finished ? 'View match recap →' : 'Open match center →'}
      </Link>
    </div>
  </article>;
}
