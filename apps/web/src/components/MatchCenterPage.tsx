import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { formatMatchClock, type LiveEvent, type LiveStats, type LiveTeamState, type MatchCenterTeam } from '@fb/shared';
import { useLiveMatch } from '../hooks/useLiveMatch';
import { useMatchClock } from '../hooks/useMatchClock';
import { useCountdown } from '../hooks/useCountdown';
import { useStadiumAudio } from '../hooks/useStadiumAudio';
import { api, readableError } from '../lib/api';
import { formatDate } from '../lib/format';
import type { Bet, Round } from '../types';
import { Alert, Spinner } from './ui';
import { LivePitch } from './LivePitch';
import { LockedBets } from './LockedBets';

function EventMark({ type }: { type: LiveEvent['type'] }) {
  if (type === 'YELLOW_CARD' || type === 'RED_CARD') return <span className={`h-4 w-3 rotate-[-10deg] rounded-sm ${type === 'YELLOW_CARD' ? 'bg-amber-300' : 'bg-rose-500'}`} />;
  return <span className="text-base" aria-hidden="true">{type === 'GOAL' ? '⚽' : type === 'SUBSTITUTION' ? '↔' : type === 'SAVE' ? '◈' : type === 'CORNER' ? '⚑' : type === 'INJURY' ? '+' : '•'}</span>;
}

function Statistics({ home, away }: { home: LiveStats; away: LiveStats }) {
  const possession = home.possessionSeconds + away.possessionSeconds;
  const homePossession = possession ? Math.round(home.possessionSeconds / possession * 100) : 50;
  const rows: Array<[string, number, number]> = [
    ['Possession %', homePossession, 100 - homePossession], ['Shots', home.shots, away.shots],
    ['On target', home.shotsOnTarget, away.shotsOnTarget], ['Saves', home.saves, away.saves],
    ['Corners', home.corners, away.corners], ['Fouls', home.fouls, away.fouls],
    ['Yellow cards', home.yellows, away.yellows], ['Red cards', home.reds, away.reds], ['Offsides', home.offsides, away.offsides],
  ];
  return <div className="space-y-4">{rows.map(([label, h, a]) => <div key={label}>
    <div className="mb-1.5 flex items-center justify-between text-xs"><strong className="tabular-nums text-pitch-200">{h}</strong><span className="text-white/50">{label}</span><strong className="tabular-nums text-amber-200">{a}</strong></div>
    <div className="flex h-1 gap-1"><span className="flex flex-1 justify-end overflow-hidden rounded-l bg-white/5"><span className="bg-pitch-300/75 transition-all duration-700" style={{ width: `${h + a ? h / (h + a) * 100 : 0}%` }} /></span><span className="flex-1 overflow-hidden rounded-r bg-white/5"><span className="block h-full bg-amber-200/75 transition-all duration-700" style={{ width: `${h + a ? a / (h + a) * 100 : 0}%` }} /></span></div>
  </div>)}</div>;
}

function Lineup({ team, state }: { team: MatchCenterTeam; state: LiveTeamState }) {
  return <div><div className="mb-4 flex items-center justify-between"><h3 className="font-display text-sm font-bold text-white">{team.name}</h3><span className="text-[10px] text-white/40">{team.formation} · {state.substitutions}/5 subs</span></div>
    <div className="divide-y divide-white/5">{state.players.map(player => <div className={`flex items-center gap-3 py-2.5 text-xs ${player.status === 'ACTIVE' ? 'text-white/90' : 'text-white/35'}`} key={player.id}>
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/5 font-display text-[11px] font-bold">{player.shirtNumber}</span>
      <span className="min-w-0 flex-1 truncate">{player.name}<span className="ml-2 text-[9px] text-white/30">{player.status === 'ACTIVE' ? player.slotKey : player.status.toLowerCase()}</span></span>
      {player.goals > 0 && <span aria-label={`${player.goals} goals`}>⚽ {player.goals}</span>}
      {player.yellows > 0 && <span className="text-amber-300">▮{player.yellows}</span>}
      {player.injured && <span className="text-rose-300">+</span>}
      {player.status === 'ACTIVE' && <span className="w-9 text-right font-mono text-[10px] text-pitch-200/70">{Math.round(player.energy)}%</span>}
    </div>)}</div>
  </div>;
}

export function MatchCenterPage({ bets, round }: { bets: Bet[]; round: Round | null }) {
  const { matchId = '' } = useParams();
  const { match, error, connected, moment, caughtUp } = useLiveMatch(matchId);
  const live = match?.live;
  const { clock, stale } = useMatchClock(live);
  const countdown = useCountdown(match?.scheduledAt ?? '');
  const audio = useStadiumAudio(live?.phase, moment);
  const [tab, setTab] = useState<'feed' | 'lineups'>('feed');
  const [highlights, setHighlights] = useState(true);
  const [history, setHistory] = useState<LiveEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const historyRequest = useRef(0);
  useEffect(() => {
    historyRequest.current++;
    setHistory([]); setActionError(null); setTab('feed'); setBusy(false);
    return () => { historyRequest.current++; };
  }, [matchId]);
  const ownBets = useMemo(() => bets.filter(b => b.match.id === matchId), [bets, matchId]);
  const events = useMemo(() => [...new Map([...history, ...(live?.events ?? [])].map(e => [e.sequence, e])).values()]
    .filter(e => !highlights || e.important).sort((a, b) => b.sequence - a.sequence), [history, live?.events, highlights]);

  async function loadHistory() {
    const request = ++historyRequest.current;
    setBusy(true); setActionError(null);
    try {
      const full: LiveEvent[] = [];
      let after: number | null = 0;
      while (after !== null) {
        const page = await api.matchEvents(matchId, after);
        if (request !== historyRequest.current) return;
        full.push(...page.events); after = page.nextSequence;
      }
      setHistory(full);
    } catch (cause) { if (request === historyRequest.current) setActionError(readableError(cause)); }
    finally { if (request === historyRequest.current) setBusy(false); }
  }

  if (!match) return error ? <Alert>{error}</Alert> : <Spinner label="Taking you to the stadium" />;
  const homeScore = live?.homeScore ?? match.result?.homeScore;
  const awayScore = live?.awayScore ?? match.result?.awayScore;
  const finished = live?.phase === 'FINISHED' || Boolean(match.result);
  const playing = live?.phase === 'LIVE';

  return <div className="match-center -mx-1 space-y-5 sm:mx-0">
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
      <Link to="/matches" className="text-slate-500 hover:text-pitch-700">← Matchday board</Link>
      <span className="text-slate-400">Week {match.weekNumber} · {formatDate(match.scheduledAt)}</span>
    </div>
    <section className="relative overflow-hidden rounded-[2rem] border border-pitch-900 bg-[#071e1a] text-white shadow-[0_25px_70px_-25px_#042b1f80]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#1b694344,transparent_65%)]" />
      <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-7">
        <div className="flex items-center gap-3"><span className="font-display text-sm font-bold tracking-tight">Touchline<span className="text-pitch-300">.</span></span><span className="h-3 w-px bg-white/15" /><span className="text-[9px] font-extrabold uppercase tracking-[.2em] text-white/40">Match center</span></div>
        <div className="flex items-center gap-3"><span className={`flex items-center gap-1.5 text-[10px] font-bold ${connected && !stale ? 'text-pitch-200/70' : 'text-amber-200'}`}><span className={`h-1.5 w-1.5 rounded-full ${connected && !stale ? 'bg-pitch-300' : 'bg-amber-300'}`} />{stale ? 'Updating match' : connected ? 'Connected' : 'Reconnecting'}</span>
          <button type="button" onClick={() => void audio.toggle()} aria-pressed={audio.enabled} className="rounded-lg border border-white/15 px-2.5 py-1.5 text-[10px] font-bold text-white/65 hover:bg-white/10">{audio.enabled ? '♫ Sound on' : audio.preferred ? '♪ Resume sound' : '♪ Enable sound'}</button>
        </div>
      </div>
      <div className="relative px-5 pb-5 pt-7 sm:px-8">
        <p className="text-center text-[9px] font-extrabold uppercase tracking-[.22em] text-white/35">{match.stadiumName}</p>
        <div className="mx-auto mt-5 grid max-w-3xl grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-7">
          {[match.homeTeam, null, match.awayTeam].map((team, index) => team ? <Link to={`/teams/${team.id}`} className="flex min-w-0 flex-col items-center text-center" key={team.id}>
            {team.crestImageUrl ? <img src={team.crestImageUrl} alt="" className="h-16 w-16 object-contain drop-shadow-[0_5px_16px_#0008] sm:h-24 sm:w-24" /> : <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/15 font-display text-xl font-bold">{team.abbreviation}</div>}
            <h1 className="mt-3 w-full break-words font-display text-sm font-bold leading-tight sm:text-xl">{team.name}</h1><span className="mt-1 text-[9px] font-bold uppercase tracking-[.18em] text-white/30">{index === 0 ? 'Home' : 'Away'} · {team.formation ?? 'XI pending'}</span>
          </Link> : <div className="text-center" key="score">
            <div className="flex items-center gap-3 font-display text-5xl font-bold tabular-nums tracking-tighter sm:gap-6 sm:text-7xl"><span>{homeScore ?? '–'}</span><span className="text-2xl font-normal text-white/20 sm:text-4xl">:</span><span>{awayScore ?? '–'}</span></div>
            <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold tabular-nums ${playing ? 'bg-pitch-300 text-pitch-950' : 'bg-white/10 text-white/65'}`}>
              {playing && <span className="h-1.5 w-1.5 rounded-full bg-pitch-900 motion-safe:animate-pulse" />}{live ? clock : finished ? 'Full time' : 'Pre-match'}
            </div>
          </div>)}
        </div>
        {live && <div className="mx-auto mt-5 grid max-w-3xl grid-cols-2 gap-8 text-[10px] leading-5 text-white/50">{[live.home, live.away].map((team, index) => <p className={index ? 'text-right' : ''} key={index}>{team.players.filter(p => p.goals > 0).map(p => `${p.name}${p.goals > 1 ? ` (${p.goals})` : ''}`).join(' · ')}</p>)}</div>}
        {!live && !finished && <div className="mt-6 text-center text-xs text-white/50">{countdown.isElapsed ? 'Waiting for the teams to take the field.' : <>Kickoff in <strong className="font-mono text-pitch-200">{countdown.compactLabel}</strong></>}</div>}
        {finished && <p className="mt-5 text-center text-xs font-semibold text-pitch-200/80">{match.result || live?.settled ? 'Result confirmed · pre-match bets settled' : 'Full time · settling pre-match bets'}</p>}
      </div>
      <div className="relative px-3 pb-3 sm:px-6 sm:pb-6">
        <LivePitch match={match} moment={moment} />
        <div className="mt-3 flex items-center justify-between gap-3 px-1 text-[9px] font-bold uppercase tracking-wider text-white/35"><span>{match.homeTeam.abbreviation} →</span><span>{live?.phase === 'HALFTIME' ? 'Team talks & fresh legs' : playing ? `${live?.possession === 'HOME' ? match.homeTeam.name : match.awayTeam.name} in possession` : 'The beautiful game, every moment'}</span><span>← {match.awayTeam.abbreviation}</span></div>
      </div>
    </section>

    {(error || actionError || audio.error) && <Alert>{actionError ?? error ?? audio.error}</Alert>}
    {caughtUp && <Alert tone="info">You’re back with the live match. Missed moments are in the timeline.</Alert>}
    <LockedBets bets={ownBets} />

    {live && <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_290px]">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3"><div className="flex gap-5" role="tablist" aria-label="Match details">{(['feed', 'lineups'] as const).map(value => <button type="button" role="tab" aria-selected={tab === value} key={value} onClick={() => setTab(value)} className={`border-b-2 py-2 text-xs font-extrabold ${tab === value ? 'border-pitch-600 text-pitch-800' : 'border-transparent text-slate-400'}`}>{value === 'feed' ? 'Match feed' : 'Players & changes'}</button>)}</div>{tab === 'feed' && <button type="button" aria-pressed={highlights} onClick={() => setHighlights(!highlights)} className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-500">{highlights ? 'Key moments' : 'All commentary'}</button>}</div>
        {tab === 'feed' ? <>
          <div className="max-h-[650px] overflow-y-auto p-4 sm:p-5" aria-label="Match commentary">
            {events.length === 0 && <p className="py-8 text-center text-sm text-slate-400">The story is just beginning.</p>}
            {events.map(event => <div className="grid grid-cols-[3rem_1.75rem_1fr] gap-2 py-3" key={event.sequence}>
              <time className="pt-1 text-[10px] font-extrabold tabular-nums text-slate-400">{formatMatchClock(event.second, event.period, 'LIVE')}</time>
              <span className={`grid h-7 w-7 place-items-center rounded-full ${event.type === 'GOAL' ? 'bg-pitch-100 text-pitch-800' : 'bg-slate-50 text-slate-400'}`}><EventMark type={event.type} /></span>
              <div className={`rounded-xl px-3 py-2 ${event.type === 'GOAL' ? 'bg-pitch-50' : event.type === 'RED_CARD' ? 'bg-rose-50' : ''}`}><p className={`text-xs leading-5 ${event.important ? 'font-semibold text-ink' : 'text-slate-500'}`}>{event.text}</p>{event.side && event.important && <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">{event.side === 'HOME' ? match.homeTeam.name : match.awayTeam.name}</p>}</div>
            </div>)}
          </div>
          <button type="button" disabled={busy} onClick={() => void loadHistory()} className="w-full border-t border-slate-100 p-3 text-xs font-bold text-pitch-700 hover:bg-pitch-50 disabled:opacity-50">{busy ? 'Loading…' : 'Load complete timeline'}</button>
        </> : <div className="grid gap-7 bg-[#0a2822] p-5 sm:grid-cols-2"><Lineup team={match.homeTeam} state={live.home} /><Lineup team={match.awayTeam} state={live.away} /></div>}
      </section>
      <aside className="rounded-2xl border border-pitch-900 bg-[#0a2822] p-5 text-white shadow-card"><div className="mb-6 flex items-center justify-between"><h2 className="font-display text-base font-bold">The match in numbers</h2><span className="text-[9px] font-bold uppercase text-pitch-300">{finished ? 'Final' : 'Live'}</span></div><Statistics home={live.home.stats} away={live.away.stats} /><div className="mt-6 border-t border-white/10 pt-4"><p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-white/40">Recent pressure</p><div className="flex h-2 overflow-hidden rounded-full bg-amber-200"><span className="bg-pitch-400 transition-all duration-1000" style={{ width: `${live.pressure}%` }} /></div><div className="mt-2 flex justify-between text-[9px] text-white/40"><span>{match.homeTeam.abbreviation}</span><span>{match.awayTeam.abbreviation}</span></div></div></aside>
    </div>}

    {round?.id === match.roundId && <section><h2 className="mb-3 text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-400">Around the grounds</h2><div className="flex gap-3 overflow-x-auto pb-2">{round.matches.filter(m => m.id !== matchId).map(m => <Link to={`/matches/${m.id}/live`} key={m.id} className="w-44 shrink-0 rounded-xl border border-slate-200 bg-white p-3 hover:border-pitch-300"><p className="mb-2 text-[9px] font-bold uppercase text-pitch-700">{m.live ? formatMatchClock(m.live.second, m.live.period, m.live.phase) : formatDate(m.scheduledAt)}</p><div className="flex justify-between gap-2 text-[11px] font-bold"><span className="truncate">{m.homeTeam.shortName || m.homeTeam.name}</span><span>{m.live?.homeScore ?? m.resultPayload?.homeScore ?? '–'}</span></div><div className="mt-1 flex justify-between gap-2 text-[11px] font-bold"><span className="truncate">{m.awayTeam.shortName || m.awayTeam.name}</span><span>{m.live?.awayScore ?? m.resultPayload?.awayScore ?? '–'}</span></div></Link>)}</div></section>}
  </div>;
}
