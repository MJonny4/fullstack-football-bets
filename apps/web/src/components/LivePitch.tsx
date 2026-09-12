import { useId } from 'react';
import { type LiveEvent, type MatchCenterDto } from '@fb/shared';
import { usePitchMotion } from '../hooks/usePitchMotion';

export function LivePitch({ match, moment }: { match: MatchCenterDto; moment: LiveEvent | null }) {
  const uid = useId().replace(/:/g, '');
  const ball = match.live?.ball ?? { x: 50, y: 50, playerId: null };
  const svg = usePitchMotion(match);
  const phase = match.live?.phase;
  return <div className="relative isolate overflow-hidden rounded-2xl border border-white/10 bg-[#062c25] shadow-[inset_0_0_70px_#0005]">
    <svg ref={svg} className="block h-auto w-full" viewBox="0 0 1000 620" role="img" aria-label="Live tactical pitch. Home attacks left to right. Player numbers and ball position follow the match.">
      <defs>
        <linearGradient id={`${uid}-grass`} x2="0" y2="1"><stop stopColor="#14734e" /><stop offset="1" stopColor="#0d503f" /></linearGradient>
        <radialGradient id={`${uid}-lights`}><stop stopColor="#ffffff" stopOpacity=".12" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" /></radialGradient>
        <pattern id={`${uid}-stripes`} width="146.66" height="520" patternUnits="userSpaceOnUse"><rect width="73.33" height="520" fill="#fff" opacity=".035" /></pattern>
        <filter id={`${uid}-shadow`} x="-70%" y="-70%" width="240%" height="240%"><feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity=".35" /></filter>
      </defs>
      <rect width="1000" height="620" fill="#082c26" />
      <rect x="48" y="38" width="904" height="544" rx="5" fill={`url(#${uid}-grass)`} />
      <rect x="60" y="50" width="880" height="520" fill={`url(#${uid}-stripes)`} />
      <ellipse cx="500" cy="180" rx="630" ry="400" fill={`url(#${uid}-lights)`} />
      <g fill="none" stroke="#e4fff3" strokeOpacity=".5" strokeWidth="2">
        <rect x="60" y="50" width="880" height="520" rx="2" />
        <path d="M500 50v520" /><circle cx="500" cy="310" r="72" />
        <path d="M60 160h138v300H60M940 160H802v300h138M60 240h48v140H60M940 240h-48v140h48" />
        <path d="M198 255q60 55 0 110M802 255q-60 55 0 110" />
        <path d="M60 50q16 0 16 16M940 50q-16 0-16 16M60 570q16 0 16-16M940 570q-16 0-16-16" />
        <rect x="41" y="273" width="19" height="74" /><rect x="940" y="273" width="19" height="74" />
      </g>
      <g fill="#e4fff3" opacity=".6"><circle cx="500" cy="310" r="3" /><circle cx="155" cy="310" r="3" /><circle cx="845" cy="310" r="3" /></g>
      <text x="64" y="27" fill="#b3f5d5" opacity=".55" fontSize="11" letterSpacing="3">TOUCHLINE / MATCHDAY {match.weekNumber}</text>
      <text x="938" y="600" textAnchor="end" fill="#b3f5d5" opacity=".5" fontSize="10" letterSpacing="2">{match.stadiumName.toUpperCase()}</text>
      {phase === 'LIVE' && <path className="live-ball-trail" fill="none" stroke="white" strokeOpacity=".24" strokeWidth="2" strokeLinecap="round" />}
      {(['home', 'away'] as const).flatMap(side => {
        const team = side === 'home' ? match.homeTeam : match.awayTeam;
        const players = match.live?.[side].players.filter(p => p.status === 'ACTIVE') ?? [];
        return players.map(player => {
          return <g key={player.id} data-player-id={player.id} className="live-player">
            <title>{player.name} · #{player.shirtNumber} · Energy {Math.round(player.energy)}%</title>
            {ball.playerId === player.id && <circle r="27" fill="none" stroke="#b3f5d5" strokeWidth="2" opacity=".5" />}
            <circle r="18" fill={side === 'home' ? team.primaryColor : team.secondaryColor} stroke="white" strokeWidth={side === 'home' ? 2 : 3}
              strokeDasharray={side === 'home' ? undefined : '3 2'} filter={`url(#${uid}-shadow)`} />
            <text y="5" textAnchor="middle" fill="white" stroke="#0008" strokeWidth=".5" paintOrder="stroke" fontSize="13" fontWeight="800">{player.shirtNumber}</text>
            {player.yellows > 0 && <rect x="12" y="-24" width="8" height="11" rx="1" fill="#fbd348" />}
            <rect x="-16" y="23" width="32" height="3" rx="1.5" fill="#0005" />
            <rect x="-16" y="23" width={32 * player.energy / 100} height="3" rx="1.5" fill={player.energy > 65 ? '#b3f5d5' : '#f3bd4d'} />
          </g>;
        });
      })}
      <g className="live-ball">
        <ellipse cy="7" rx="8" ry="3" fill="#0005" />
        <g className="live-ball-surface"><circle r="6" fill="white" stroke="#0b2921" strokeWidth="1.5" />
        <path d="m-2-2 3-1 2 3-2 2-3-1Z" fill="#173b2e" /></g>
      </g>
    </svg>
    {!match.live && <div className="absolute inset-0 grid place-items-center bg-[#061e19]/35 backdrop-blur-[1px]">
      <div className="text-center"><div className="mb-3 text-3xl">⚽</div><p className="font-display text-xl font-bold text-white">The stage is set.</p><p className="mt-2 text-xs text-white/60">Kickoff is automatic. Be here when the clock reaches zero.</p></div>
    </div>}
    {(moment || phase === 'HALFTIME' || phase === 'FINISHED') && <div key={moment?.sequence ?? phase} className="pointer-events-none absolute inset-0 grid place-items-center bg-[#021610]/40">
      <div className={`live-moment max-w-[85%] rounded-2xl border px-7 py-5 text-center shadow-2xl backdrop-blur-xl ${moment?.type === 'GOAL' ? 'border-pitch-300/50 bg-pitch-950/85 text-pitch-100' : moment?.type === 'RED_CARD' ? 'border-rose-300/40 bg-rose-950/90 text-rose-100' : 'border-white/20 bg-[#071e1a]/90 text-white'}`}>
        <p className="text-[10px] font-extrabold uppercase tracking-[.3em]">{moment?.side === 'HOME' ? match.homeTeam.name : moment?.side === 'AWAY' ? match.awayTeam.name : 'Touchline broadcast'}</p>
        <p className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-5xl">{moment?.type === 'GOAL' ? 'GOOOAL!' : moment?.type === 'RED_CARD' ? 'RED CARD' : phase === 'HALFTIME' ? 'HALF TIME' : 'FULL TIME'}</p>
        <p className="mt-2 max-w-xs text-xs leading-5 opacity-70">{moment?.text ?? (phase === 'HALFTIME' ? 'A breather. A team talk. Another half to come.' : 'The final whistle. Every moment in the recap below.')}</p>
      </div>
    </div>}
  </div>;
}
