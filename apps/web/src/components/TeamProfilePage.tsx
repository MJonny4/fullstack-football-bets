import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import type {
  PublicLineupAssignmentDto,
  PublicPlayerDto,
  PublicTeamFixtureDto,
} from '@fb/shared';
import { ApiError, api, readableError } from '../lib/api';
import { formatDate } from '../lib/format';
import type { TeamProfile } from '../types';
import { TeamLink } from './TeamLink';
import { Alert, EmptyState, Icon, Spinner, TeamCrest } from './ui';

const OUTFIELD_ATTRIBUTE_LABELS = {
  pace: 'PAC',
  shooting: 'SHO',
  passing: 'PAS',
  dribbling: 'DRI',
  defending: 'DEF',
  physical: 'PHY',
} as const;

const GOALKEEPER_ATTRIBUTE_LABELS = {
  diving: 'DIV',
  handling: 'HAN',
  kicking: 'KIC',
  reflexes: 'REF',
  speed: 'SPD',
  positioning: 'POS',
} as const;

const regionNames = new Intl.DisplayNames(
  [typeof navigator === 'undefined' ? 'en' : navigator.language],
  { type: 'region' },
);

function countryName(code: string): string {
  try {
    return regionNames.of(code.toUpperCase()) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

function FlagIcon({ code }: { code: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      alt=""
      className="h-3.5 w-5 rounded-sm object-cover shadow-sm"
      onError={() => setFailed(true)}
      src={failed ? '/flags/unknown.svg' : `/flags/${code.toLowerCase()}.svg`}
    />
  );
}

function CountryFlag({ code }: { code: string }) {
  const name = countryName(code);
  return (
    <span className="inline-flex items-center gap-2">
      <FlagIcon code={code} />
      <span>{name}</span>
    </span>
  );
}

function RatingBadge({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-xl font-bold text-white">{Math.round(value)}</div>
      <div className="text-[8px] font-extrabold uppercase tracking-[.14em] text-white/45">{label}</div>
    </div>
  );
}

function AttributeGrid({ player }: { player: PublicPlayerDto }) {
  const labels = player.kind === 'GOALKEEPER'
    ? GOALKEEPER_ATTRIBUTE_LABELS
    : OUTFIELD_ATTRIBUTE_LABELS;
  return (
    <dl className="grid grid-cols-3 gap-2">
      {Object.entries(player.attributes).map(([key, value]) => (
        <div className="rounded-xl bg-slate-50 px-3 py-2 text-center" key={key}>
          <dt className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
            {labels[key as keyof typeof labels]}
          </dt>
          <dd className="mt-1 font-display text-lg font-bold text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function PlayerPanel({ player }: { player: PublicPlayerDto | null }) {
  if (!player) {
    return (
      <div className="grid min-h-80 place-items-center rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm font-semibold text-slate-400">
        Select a shirt on the pitch or a player in the squad.
      </div>
    );
  }

  return (
    <aside className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-card">
      <div className="relative bg-gradient-to-br from-slate-100 to-white px-5 pt-5">
        <div className="absolute right-5 top-5 grid h-14 w-14 place-items-center rounded-2xl bg-pitch-950 font-display text-2xl font-bold text-white shadow-lg">
          {player.overall}
        </div>
        <img
          alt="Generic player silhouette"
          className="mx-auto h-44 w-44 object-contain object-bottom"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = '/players/default-player.png';
          }}
          src={player.imageUrl ?? '/players/default-player.png'}
        />
      </div>
      <div className="border-t border-slate-100 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs font-extrabold uppercase tracking-[.14em] text-pitch-700">
              #{player.shirtNumber} · {player.primaryPosition}
            </div>
            <h2 className="mt-1 truncate font-display text-2xl font-bold text-ink">
              {player.firstName} {player.lastName}
            </h2>
            <div className="mt-2 text-xs font-semibold text-slate-500">
              <CountryFlag code={player.nationalityCode} />
            </div>
          </div>
        </div>
        {player.secondaryPositions.length > 0 && (
          <div className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Also plays {player.secondaryPositions.join(' · ')}
          </div>
        )}
        <div className="mt-5"><AttributeGrid player={player} /></div>
      </div>
    </aside>
  );
}

function PitchPlayer({
  assignment,
  player,
  selected,
  onSelect,
  colors,
}: {
  assignment: PublicLineupAssignmentDto;
  player: PublicPlayerDto;
  selected: boolean;
  onSelect: () => void;
  colors: { shirt: string; text: string };
}) {
  return (
    <button
      aria-pressed={selected}
      className="group relative z-10 flex w-16 flex-col items-center gap-1 rounded-xl px-1 py-1 focus-visible:outline-white sm:w-20"
      onClick={onSelect}
      title={`${player.firstName} ${player.lastName}, ${assignment.slotKey}`}
      type="button"
    >
      <span
        className={`grid h-11 w-11 place-items-center rounded-t-[1rem] rounded-b-lg border-2 font-display text-sm font-bold shadow-lg transition group-hover:-translate-y-1 ${selected ? 'border-gold ring-4 ring-gold/25' : 'border-white/60'}`}
        style={{ backgroundColor: colors.shirt, color: colors.text }}
      >
        {player.shirtNumber}
      </span>
      <span className="max-w-full truncate rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-extrabold text-white backdrop-blur">
        {player.lastName}
      </span>
    </button>
  );
}

function Pitch({
  profile,
  selectedPlayerId,
  onSelect,
}: {
  profile: TeamProfile;
  selectedPlayerId: string | null;
  onSelect: (playerId: string) => void;
}) {
  const lineup = profile.officialLineup;
  const players = new Map(profile.squad.map((player) => [player.id, player]));
  if (!lineup) {
    return (
      <EmptyState
        detail="This club does not have a published official XI yet."
        icon="shirt"
        title="No official lineup"
      />
    );
  }

  const rows = ['ATT', 'MID', 'DEF', 'GK'] as const;
  return (
    <div className="relative min-h-[36rem] overflow-hidden rounded-[2rem] border-4 border-white/80 bg-gradient-to-b from-[#16834e] to-[#0b6b3b] p-3 shadow-card sm:p-5">
      <div className="pointer-events-none absolute inset-3 rounded-[1.5rem] border-2 border-white/35" />
      <div className="pointer-events-none absolute inset-x-3 top-1/2 border-t-2 border-white/35" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/35" />
      <div className="pointer-events-none absolute inset-x-[28%] bottom-3 h-20 border-2 border-b-0 border-white/35" />
      <div className="pointer-events-none absolute inset-x-[28%] top-3 h-20 border-2 border-t-0 border-white/35" />
      <div className="relative grid min-h-[33rem] grid-rows-4 gap-2 py-4">
        {rows.map((unit) => (
          <div className="flex items-center justify-evenly gap-1" key={unit}>
            {lineup.assignments
              .filter((assignment) => assignment.unit === unit)
              .map((assignment) => {
                const player = players.get(assignment.playerId);
                return player ? (
                  <PitchPlayer
                    assignment={assignment}
                    colors={{ shirt: profile.primaryColor, text: profile.shirtTextColor }}
                    key={assignment.slotKey}
                    onSelect={() => onSelect(player.id)}
                    player={player}
                    selected={selectedPlayerId === player.id}
                  />
                ) : null;
              })}
          </div>
        ))}
      </div>
    </div>
  );
}

function LineupCard({ lineup }: { lineup: TeamProfile['alternatives'][number] }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[9px] font-extrabold uppercase tracking-[.14em] text-slate-400">{lineup.label}</div>
          <div className="mt-1 font-display text-2xl font-bold text-ink">{lineup.formation}</div>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-pitch-950 font-display text-lg font-bold text-white">
          {Math.round(lineup.overall)}
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-4 gap-2 text-center">
        {[
          ['ATT', lineup.attack],
          ['MID', lineup.midfield],
          ['DEF', lineup.defense],
          ['GK', lineup.goalkeeper],
        ].map(([label, value]) => (
          <div className="rounded-xl bg-slate-50 px-1 py-2" key={label}>
            <dt className="text-[8px] font-extrabold text-slate-400">{label}</dt>
            <dd className="mt-1 text-xs font-extrabold text-ink">{Math.round(Number(value))}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function squadGroup(position: string): 'Goalkeepers' | 'Defenders' | 'Midfielders' | 'Forwards' {
  if (position === 'GK') return 'Goalkeepers';
  if (['RB', 'CB', 'LB'].includes(position)) return 'Defenders';
  if (['RW', 'LW', 'ST'].includes(position)) return 'Forwards';
  return 'Midfielders';
}

function Squad({
  players,
  selectedPlayerId,
  onSelect,
}: {
  players: PublicPlayerDto[];
  selectedPlayerId: string | null;
  onSelect: (playerId: string) => void;
}) {
  const groups = ['Goalkeepers', 'Defenders', 'Midfielders', 'Forwards'] as const;
  return (
    <div className="space-y-5">
      {groups.map((group) => {
        const grouped = players.filter((player) => squadGroup(player.primaryPosition) === group);
        return (
          <section key={group}>
            <div className="mb-2 flex items-center gap-3">
              <h3 className="text-xs font-extrabold uppercase tracking-[.14em] text-slate-500">{group}</h3>
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] font-bold text-slate-400">{grouped.length}</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {grouped.map((player) => (
                <button
                  aria-pressed={selectedPlayerId === player.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${selectedPlayerId === player.id ? 'border-pitch-500 bg-pitch-50 ring-2 ring-pitch-100' : 'border-slate-200 bg-white hover:border-pitch-300'}`}
                  key={player.id}
                  onClick={() => onSelect(player.id)}
                  type="button"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 font-display text-xs font-bold text-ink">{player.shirtNumber}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-extrabold text-ink">{player.firstName} {player.lastName}</span>
                    <span className="mt-0.5 flex items-center gap-2 text-[9px] font-bold text-slate-400">
                      <FlagIcon code={player.nationalityCode} />
                      {player.primaryPosition}{player.secondaryPositions.length ? ` · ${player.secondaryPositions.join('/')}` : ''}
                    </span>
                  </span>
                  <span className="font-display text-sm font-bold text-pitch-800">{player.overall}</span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function FixtureRow({ fixture }: { fixture: PublicTeamFixtureDto }) {
  const score = fixture.result
    ? `${fixture.result.homeScore}–${fixture.result.awayScore}`
    : formatDate(fixture.scheduledAt);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
      <TeamLink className="justify-self-start" compact team={fixture.homeTeam} />
      <div className="rounded-lg bg-slate-100 px-2 py-1 text-center font-display text-xs font-bold text-ink">
        {score}
      </div>
      <TeamLink className="justify-self-end [&>span:last-child]:text-right" compact team={fixture.awayTeam} />
    </div>
  );
}

function MatchHistoryRow({
  fixture,
  teamId,
}: {
  fixture: PublicTeamFixtureDto;
  teamId: string;
}) {
  const isHome = fixture.homeTeam.id === teamId;
  const opponent = isHome ? fixture.awayTeam : fixture.homeTeam;
  const scored = fixture.result
    ? isHome ? fixture.result.homeScore : fixture.result.awayScore
    : null;
  const conceded = fixture.result
    ? isHome ? fixture.result.awayScore : fixture.result.homeScore
    : null;
  const outcome = scored === null || conceded === null
    ? null
    : scored > conceded ? 'W' : scored < conceded ? 'L' : 'D';
  const outcomeStyle = outcome === 'W'
    ? 'bg-emerald-100 text-emerald-800'
    : outcome === 'L'
      ? 'bg-rose-100 text-rose-800'
      : outcome === 'D'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-slate-100 text-slate-500';

  return (
    <article className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:gap-4 sm:px-4">
      <span
        aria-label={outcome === 'W' ? 'Win' : outcome === 'L' ? 'Loss' : outcome === 'D' ? 'Draw' : 'Result unavailable'}
        className={`grid h-8 w-8 place-items-center rounded-lg font-display text-xs font-bold ${outcomeStyle}`}
      >
        {outcome ?? '–'}
      </span>
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] font-extrabold uppercase tracking-[.12em] text-slate-400">
          <span>Matchweek {fixture.weekNumber}</span>
          <span aria-hidden="true">·</span>
          <span>{isHome ? 'Home' : 'Away'}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={fixture.scheduledAt}>{formatDate(fixture.scheduledAt)}</time>
        </div>
        <TeamLink compact team={opponent} />
      </div>
      <div className="text-right">
        <div className="font-display text-lg font-bold tabular-nums text-ink sm:text-xl">
          {scored === null || conceded === null ? '–' : `${scored}–${conceded}`}
        </div>
        <div className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400">
          {isHome ? 'vs' : 'at'} {opponent.name}
        </div>
      </div>
    </article>
  );
}

function MatchHistory({ teamId }: { teamId: string }) {
  const [matches, setMatches] = useState<PublicTeamFixtureDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    function loadHistory(clearExisting: boolean) {
      if (clearExisting) {
        setMatches([]);
        setNextCursor(null);
      }
      setError(null);
      setLoading(true);
      void api.teamMatchHistory(teamId)
        .then((page) => {
          if (!current) return;
          setMatches(page.matches);
          setNextCursor(page.nextCursor);
        })
        .catch((cause: unknown) => {
          if (current) setError(readableError(cause));
        })
        .finally(() => {
          if (current) setLoading(false);
        });
    }
    function receiveStandingsUpdate() {
      loadHistory(false);
    }
    loadHistory(true);
    window.addEventListener('football-bets:standings-update', receiveStandingsUpdate);
    return () => {
      current = false;
      window.removeEventListener('football-bets:standings-update', receiveStandingsUpdate);
    };
  }, [teamId]);

  async function loadMore() {
    if (!nextCursor || loading) return;
    setLoading(true);
    setError(null);
    try {
      const page = await api.teamMatchHistory(teamId, nextCursor);
      setMatches((current) => {
        const existing = new Set(current.map(({ id }) => id));
        return [...current, ...page.matches.filter(({ id }) => !existing.has(id))];
      });
      setNextCursor(page.nextCursor);
    } catch (cause) {
      setError(readableError(cause));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-pitch-700">All seasons</p>
          <h2 className="mt-1 font-display text-xl font-bold text-ink">Match history</h2>
        </div>
        {matches.length > 0 && (
          <span className="text-xs font-bold text-slate-400">Newest first</span>
        )}
      </div>
      <div className="mt-3 space-y-2">
        {matches.map((fixture) => (
          <MatchHistoryRow fixture={fixture} key={fixture.id} teamId={teamId} />
        ))}
        {loading && matches.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 text-center text-sm font-semibold text-slate-400">
            Loading match history…
          </div>
        )}
        {!loading && matches.length === 0 && !error && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm font-semibold text-slate-400">
            This club has not played a match yet.
          </div>
        )}
        {error && <Alert>{error}</Alert>}
      </div>
      {nextCursor && (
        <button
          className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-pitch-800 shadow-sm hover:border-pitch-300 hover:bg-pitch-50 disabled:cursor-wait disabled:opacity-60"
          disabled={loading}
          onClick={() => void loadMore()}
          type="button"
        >
          {loading ? 'Loading…' : 'Show older matches'}
        </button>
      )}
    </section>
  );
}

export function TeamProfilePage() {
  const { teamId = '' } = useParams();
  const [profile, setProfile] = useState<TeamProfile | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let current = true;
    function load(showLoading: boolean) {
      if (showLoading) setLoading(true);
      setError(null);
      setNotFound(false);
      void api.team(teamId)
        .then((result) => {
          if (!current) return;
          setProfile(result);
          setSelectedPlayerId((selected) => {
            if (selected && result.squad.some(({ id }) => id === selected)) return selected;
            return result.officialLineup?.assignments.find(({ unit }) => unit === 'ATT')?.playerId
              ?? result.officialLineup?.assignments[0]?.playerId
              ?? result.squad[0]?.id
              ?? null;
          });
        })
        .catch((cause: unknown) => {
          if (!current) return;
          if (cause instanceof ApiError && cause.status === 404) setNotFound(true);
          else setError(readableError(cause));
        })
        .finally(() => {
          if (current && showLoading) setLoading(false);
        });
    }
    function receiveTeamUpdate(event: Event) {
      const detail = (event as CustomEvent<unknown>).detail;
      if (
        detail &&
        typeof detail === 'object' &&
        (detail as { teamId?: unknown }).teamId === teamId
      ) {
        load(false);
      }
    }
    function receiveStandingsUpdate() {
      load(false);
    }
    load(true);
    window.addEventListener('football-bets:team-update', receiveTeamUpdate);
    window.addEventListener('football-bets:standings-update', receiveStandingsUpdate);
    return () => {
      current = false;
      window.removeEventListener('football-bets:team-update', receiveTeamUpdate);
      window.removeEventListener('football-bets:standings-update', receiveStandingsUpdate);
    };
  }, [teamId]);

  const selectedPlayer = useMemo(
    () => profile?.squad.find((player) => player.id === selectedPlayerId) ?? null,
    [profile, selectedPlayerId],
  );

  if (loading) return <Spinner label="Loading club profile" />;
  if (notFound) {
    return (
      <EmptyState
        action={<Link className="rounded-xl bg-pitch-700 px-5 py-3 text-sm font-extrabold text-white" to="/standings">Back to the league</Link>}
        detail="The club may no longer exist, or the link is incorrect."
        icon="shirt"
        title="Club not found"
      />
    );
  }
  if (!profile) {
    return <Alert>{error ?? 'The club profile could not be loaded.'}</Alert>;
  }

  return (
    <section>
      <div className="mb-4">
        <Link className="inline-flex items-center gap-1 text-xs font-extrabold text-slate-500 hover:text-pitch-700" to="/standings">
          <Icon className="h-4 w-4 rotate-180" name="chevron" /> League table
        </Link>
      </div>

      <header
        className="relative overflow-hidden rounded-[2rem] p-6 text-white shadow-card sm:p-8"
        style={{ background: `linear-gradient(125deg, ${profile.primaryColor}, ${profile.secondaryColor})` }}
      >
        <div className="absolute inset-0 bg-stadium-grid bg-[size:32px_32px] opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-black/40" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
          <TeamCrest size="lg" team={profile} />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-extrabold uppercase tracking-[.18em] text-white/60">{profile.abbreviation} · Founded {profile.foundedYear}</div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">{profile.name}</h1>
            <p className="mt-2 text-sm font-semibold text-white/65">{profile.city} · {profile.stadiumName}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-extrabold uppercase tracking-wider">
              <span className="rounded-full bg-white/15 px-3 py-1.5">{profile.standing ? `#${profile.standing.position} in league` : 'League position pending'}</span>
              <span className="rounded-full bg-white/15 px-3 py-1.5">{profile.manager ? `DT ${profile.manager.displayName}` : 'Unclaimed club'}</span>
              {profile.officialLineup && <span className="rounded-full bg-white/15 px-3 py-1.5">{profile.officialLineup.formation}</span>}
            </div>
          </div>
          <div className="grid grid-cols-5 gap-4 rounded-2xl border border-white/15 bg-black/20 px-5 py-4 backdrop-blur">
            <RatingBadge label="OVR" value={profile.strengthRating} />
            <RatingBadge label="ATT" value={profile.attackRating} />
            <RatingBadge label="MID" value={profile.midfieldRating} />
            <RatingBadge label="DEF" value={profile.defenseRating} />
            <RatingBadge label="GK" value={profile.goalkeeperRating} />
          </div>
        </div>
        {profile.isMine && (
          <div className="relative mt-6 flex justify-end">
            <Link className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-ink shadow-lg hover:bg-pitch-50" to="/my-team">
              <Icon className="h-4 w-4" name="shirt" /> Manage club
            </Link>
          </div>
        )}
      </header>

      {error && <div className="mt-5"><Alert>{error}</Alert></div>}

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(19rem,.55fr)]">
        <div>
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-pitch-700">Official XI</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-ink">Usual lineup</h2>
            </div>
            {profile.officialLineup && <span className="rounded-full bg-pitch-100 px-3 py-1.5 text-xs font-extrabold text-pitch-800">{profile.officialLineup.formation}</span>}
          </div>
          <Pitch onSelect={setSelectedPlayerId} profile={profile} selectedPlayerId={selectedPlayerId} />
        </div>
        <PlayerPanel player={selectedPlayer} />
      </div>

      {profile.alternatives.length > 0 && (
        <section className="mt-8">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-pitch-700">Tactical options</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-ink">Other possible lineups</h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {profile.alternatives.map((lineup) => <LineupCard key={lineup.id} lineup={lineup} />)}
          </div>
        </section>
      )}

      <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-card sm:p-7">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-pitch-700">First team</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-ink">Squad</h2>
          </div>
          <span className="text-xs font-bold text-slate-400">{profile.squad.length} players</span>
        </div>
        <div className="mt-6"><Squad onSelect={setSelectedPlayerId} players={profile.squad} selectedPlayerId={selectedPlayerId} /></div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,.65fr)]">
        <MatchHistory teamId={profile.id} />
        <section>
          <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-pitch-700">Next matches</p>
          <h2 className="mt-1 font-display text-xl font-bold text-ink">Upcoming fixtures</h2>
          <div className="mt-3 space-y-2">
            {profile.upcomingFixtures.length
              ? profile.upcomingFixtures.map((fixture) => <FixtureRow fixture={fixture} key={fixture.id} />)
              : <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm font-semibold text-slate-400">No scheduled fixtures.</div>}
          </div>
        </section>
      </div>
    </section>
  );
}
