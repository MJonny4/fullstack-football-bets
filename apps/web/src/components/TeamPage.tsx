import {
  FORMATIONS,
  FORMATION_TEMPLATES,
  calculateLineupRatings,
  getPositionPenalty,
  selectBestLineup,
  type Formation,
  type PublicPlayerDto,
} from '@fb/shared';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { api, readableError } from '../lib/api';
import { formatDate } from '../lib/format';
import type {
  LineupDraftInput,
  LineupInput,
  ManagerTeamProfile,
  Team,
  User,
} from '../types';
import { TeamLink } from './TeamLink';
import { Alert, EmptyState, Spinner, TeamCrest } from './ui';

interface TeamPageProps {
  teams: Team[];
  user: User;
  onClaim: (teamId: string) => Promise<void>;
  onSaveLineup: (input: LineupInput) => Promise<void>;
  onRefresh: () => Promise<void>;
}

const MENTALITIES = ['balanced', 'attacking', 'defensive', 'counter'];
const PRESSING = ['high', 'mid-block', 'low-block'];
const TEMPOS = ['patient', 'balanced', 'direct'];

function tacticsValue(
  tactics: Record<string, unknown> | null | undefined,
  key: string,
  fallback: string,
): string {
  const value = tactics?.[key];
  return typeof value === 'string' ? value : fallback;
}

function lineupRecord(
  lineup: ManagerTeamProfile['draftLineup'] | ManagerTeamProfile['officialLineup'],
): Record<string, string> {
  return Object.fromEntries(
    (lineup?.assignments ?? []).map(({ slotKey, playerId }) => [slotKey, playerId]),
  );
}

function lineupSignature(
  formation: Formation,
  assignments: Record<string, string>,
): string {
  return `${formation}:${FORMATION_TEMPLATES[formation]
    .map(({ key }) => `${key}=${assignments[key] ?? ''}`)
    .join('|')}`;
}

function draftInput(
  formation: Formation,
  assignments: Record<string, string>,
): LineupDraftInput {
  return {
    formation,
    assignments: FORMATION_TEMPLATES[formation].map(({ key }) => ({
      slotKey: key,
      playerId: assignments[key] ?? '',
    })),
  };
}

function bestAssignments(
  formation: Formation,
  players: PublicPlayerDto[],
): Record<string, string> {
  const ratings = selectBestLineup(formation, players);
  return Object.fromEntries(
    ratings.assignments.map(({ slotKey, player }) => [slotKey, player.id]),
  );
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

function RatingBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 px-2 py-2 text-center">
      <div className="font-display text-lg font-bold text-ink">{Math.round(value)}</div>
      <div className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400">{label}</div>
    </div>
  );
}

function ManagerPitch({
  profile,
  ratings,
  selectedSlot,
  onSelectSlot,
}: {
  profile: ManagerTeamProfile;
  ratings: ReturnType<typeof calculateLineupRatings<PublicPlayerDto>>;
  selectedSlot: string;
  onSelectSlot: (slotKey: string) => void;
}) {
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
            {ratings.assignments
              .filter((assignment) => assignment.unit === unit)
              .map((assignment) => (
                <button
                  aria-pressed={selectedSlot === assignment.slotKey}
                  className="group relative z-10 flex w-16 flex-col items-center gap-1 rounded-xl px-1 py-1 focus-visible:outline-white sm:w-20"
                  key={assignment.slotKey}
                  onClick={() => onSelectSlot(assignment.slotKey)}
                  title={`Edit ${assignment.slotKey}: ${assignment.player.firstName} ${assignment.player.lastName}`}
                  type="button"
                >
                  <span
                    className={`relative grid h-11 w-11 place-items-center rounded-t-[1rem] rounded-b-lg border-2 font-display text-sm font-bold shadow-lg transition group-hover:-translate-y-1 ${selectedSlot === assignment.slotKey ? 'border-gold ring-4 ring-gold/30' : 'border-white/60'}`}
                    style={{
                      backgroundColor: profile.primaryColor,
                      color: profile.shirtTextColor,
                    }}
                  >
                    {assignment.player.shirtNumber}
                    {assignment.positionPenalty > 0 && (
                      <span className="absolute -right-2 -top-2 rounded-full bg-amber-300 px-1.5 py-0.5 text-[8px] font-black text-amber-950">
                        -{assignment.positionPenalty}
                      </span>
                    )}
                  </span>
                  <span className="max-w-full truncate rounded-md bg-black/65 px-1.5 py-0.5 text-[9px] font-extrabold text-white backdrop-blur">
                    {assignment.player.lastName}
                  </span>
                  <span className="text-[8px] font-black text-white/65">{assignment.slotKey}</span>
                </button>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SquadChooser({
  players,
  assignments,
  selectedSlot,
  onChoose,
}: {
  players: PublicPlayerDto[];
  assignments: Record<string, string>;
  selectedSlot: string;
  onChoose: (playerId: string) => void;
}) {
  const starterSlot = new Map(
    Object.entries(assignments).map(([slotKey, playerId]) => [playerId, slotKey]),
  );
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {[...players]
        .sort((left, right) => {
          const leftStarts = starterSlot.has(left.id) ? 0 : 1;
          const rightStarts = starterSlot.has(right.id) ? 0 : 1;
          return leftStarts - rightStarts || right.overall - left.overall;
        })
        .map((player) => {
          const slot = starterSlot.get(player.id);
          const selected = slot === selectedSlot;
          return (
            <button
              aria-pressed={selected}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${selected ? 'border-gold bg-amber-50 ring-2 ring-amber-100' : 'border-slate-200 bg-white hover:border-pitch-300'}`}
              key={player.id}
              onClick={() => onChoose(player.id)}
              type="button"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 font-display text-sm font-bold text-ink">
                {player.shirtNumber}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-extrabold text-ink">
                  {player.firstName} {player.lastName}
                </span>
                <span className="mt-1 flex items-center gap-2 text-[9px] font-bold text-slate-400">
                  <FlagIcon code={player.nationalityCode} />
                  {player.primaryPosition}
                  {player.secondaryPositions.length > 0 && ` · ${player.secondaryPositions.join('/')}`}
                </span>
              </span>
              <span className="text-right">
                <span className="block font-display text-sm font-bold text-pitch-800">{player.overall}</span>
                <span className={`mt-1 block text-[8px] font-black uppercase tracking-wider ${slot ? 'text-pitch-600' : 'text-slate-400'}`}>
                  {slot ?? 'Bench'}
                </span>
              </span>
            </button>
          );
        })}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-extrabold text-ink">{label}</span>
      <select
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold capitalize text-ink outline-none focus:border-pitch-500 focus:bg-white focus:ring-4 focus:ring-pitch-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function ManagerEditor({
  profile,
  setProfile,
  onSaveLineup,
  onRefresh,
}: {
  profile: ManagerTeamProfile;
  setProfile: (profile: ManagerTeamProfile) => void;
  onSaveLineup: (input: LineupInput) => Promise<void>;
  onRefresh: () => Promise<void>;
}) {
  const initialLineup = profile.draftLineup ?? profile.officialLineup;
  const initialFormation = initialLineup?.formation ?? '4-3-3';
  const initialAssignments = initialLineup
    ? lineupRecord(initialLineup)
    : bestAssignments('4-3-3', profile.squad);
  const [formation, setFormation] = useState<Formation>(initialFormation);
  const [assignments, setAssignments] = useState<Record<string, string>>(initialAssignments);
  const [selectedSlot, setSelectedSlot] = useState(
    FORMATION_TEMPLATES[initialFormation].find(({ unit }) => unit === 'ATT')?.key
      ?? FORMATION_TEMPLATES[initialFormation][0].key,
  );
  const [serverSignature, setServerSignature] = useState(() =>
    lineupSignature(initialFormation, initialAssignments),
  );
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<{ tone: 'error' | 'success' | 'info'; text: string } | null>(null);

  const [mentality, setMentality] = useState(() => tacticsValue(profile.tactics, 'mentality', 'balanced'));
  const [pressing, setPressing] = useState(() => tacticsValue(profile.tactics, 'pressing', 'mid-block'));
  const [tempo, setTempo] = useState(() => tacticsValue(profile.tactics, 'tempo', 'balanced'));
  const [notes, setNotes] = useState(() => tacticsValue(profile.tactics, 'notes', ''));
  const [savingTactics, setSavingTactics] = useState(false);

  const playersById = useMemo(
    () => new Map(profile.squad.map((player) => [player.id, player])),
    [profile.squad],
  );
  const ratings = useMemo(() => {
    try {
      return calculateLineupRatings(
        formation,
        FORMATION_TEMPLATES[formation].map(({ key }) => {
          const player = playersById.get(assignments[key] ?? '');
          if (!player) throw new Error(`Choose a player for ${key}`);
          return { slotKey: key, player };
        }),
      );
    } catch {
      return null;
    }
  }, [assignments, formation, playersById]);
  const currentSignature = lineupSignature(formation, assignments);
  const dirty = currentSignature !== serverSignature;
  const selectedTemplateSlot = FORMATION_TEMPLATES[formation].find(
    ({ key }) => key === selectedSlot,
  );
  const nextFixture = profile.upcomingFixtures[0];

  function changeFormation(nextFormation: Formation) {
    try {
      const nextAssignments = bestAssignments(nextFormation, profile.squad);
      setFormation(nextFormation);
      setAssignments(nextAssignments);
      setSelectedSlot(
        FORMATION_TEMPLATES[nextFormation].find(({ unit }) => unit === 'ATT')?.key
          ?? FORMATION_TEMPLATES[nextFormation][0].key,
      );
      setMessage({
        tone: 'info',
        text: `${nextFormation} loaded with the strongest compatible XI. You can make substitutions below.`,
      });
    } catch (error) {
      setMessage({ tone: 'error', text: readableError(error) });
    }
  }

  function choosePlayer(playerId: string) {
    if (!selectedTemplateSlot) return;
    const player = playersById.get(playerId);
    const currentPlayerId = assignments[selectedSlot];
    const currentPlayer = currentPlayerId ? playersById.get(currentPlayerId) : undefined;
    if (!player || !currentPlayerId || !currentPlayer || playerId === currentPlayerId) return;
    if (getPositionPenalty(player, selectedTemplateSlot.position) === null) {
      setMessage({
        tone: 'error',
        text: `${player.primaryPosition} ${player.lastName} cannot play ${selectedTemplateSlot.position}.`,
      });
      return;
    }

    const occupiedSlotKey = Object.entries(assignments).find(
      ([, assignedPlayerId]) => assignedPlayerId === playerId,
    )?.[0];
    if (occupiedSlotKey) {
      const occupiedTemplate = FORMATION_TEMPLATES[formation].find(
        ({ key }) => key === occupiedSlotKey,
      );
      if (!occupiedTemplate || getPositionPenalty(currentPlayer, occupiedTemplate.position) === null) {
        setMessage({
          tone: 'error',
          text: `${currentPlayer.lastName} cannot complete that position swap. Select a substitute from the bench instead.`,
        });
        return;
      }
    }

    setAssignments((current) => ({
      ...current,
      [selectedSlot]: playerId,
      ...(occupiedSlotKey ? { [occupiedSlotKey]: currentPlayerId } : {}),
    }));
    setMessage(null);
  }

  async function saveDraft(): Promise<ManagerTeamProfile | null> {
    if (!ratings) {
      setMessage({ tone: 'error', text: 'Complete every position before saving the draft.' });
      return null;
    }
    setSaving(true);
    setMessage(null);
    try {
      const nextProfile = await api.saveLineupDraft(draftInput(formation, assignments));
      setProfile(nextProfile);
      setServerSignature(currentSignature);
      setMessage({ tone: 'success', text: 'Private draft saved. Other managers still see your published XI.' });
      return nextProfile;
    } catch (error) {
      setMessage({ tone: 'error', text: readableError(error) });
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!ratings) {
      setMessage({ tone: 'error', text: 'Complete every position before publishing.' });
      return;
    }
    setPublishing(true);
    setMessage(null);
    try {
      if (dirty) {
        const saved = await api.saveLineupDraft(draftInput(formation, assignments));
        setProfile(saved);
        setServerSignature(currentSignature);
      }
      const result = await api.publishLineup();
      setProfile(result.profile);
      setServerSignature(currentSignature);
      await onRefresh();
      setMessage({
        tone: result.changed ? 'success' : 'info',
        text: result.changed
          ? `Official XI published. ${result.repricedMatchIds.length === 1 ? 'One open match was repriced.' : `${result.repricedMatchIds.length} open matches were repriced.`}`
          : 'This XI is already official, so no ratings or odds changed.',
      });
    } catch (error) {
      setMessage({ tone: 'error', text: readableError(error) });
    } finally {
      setPublishing(false);
    }
  }

  async function saveTactics(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingTactics(true);
    setMessage(null);
    try {
      await onSaveLineup({
        formation,
        tactics: { mentality, pressing, tempo, notes: notes.trim() },
      });
      setMessage({ tone: 'success', text: 'Tactical notes saved privately.' });
    } catch (error) {
      setMessage({ tone: 'error', text: readableError(error) });
    } finally {
      setSavingTactics(false);
    }
  }

  return (
    <section>
      <header
        className="relative overflow-hidden rounded-[2rem] p-6 text-white shadow-card sm:p-8"
        style={{ background: `linear-gradient(125deg, ${profile.primaryColor}, ${profile.secondaryColor})` }}
      >
        <div className="absolute inset-0 bg-stadium-grid bg-[size:32px_32px] opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-black/45" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
          <Link to={`/teams/${encodeURIComponent(profile.id)}`}><TeamCrest size="lg" team={profile} /></Link>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-extrabold uppercase tracking-[.18em] text-white/60">Manager workspace · Private until published</div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">{profile.name}</h1>
            <p className="mt-2 text-sm font-semibold text-white/65">
              Select a shirt, then choose a player. Position penalties are reflected immediately.
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-right backdrop-blur">
            <div className="text-[9px] font-extrabold uppercase tracking-[.16em] text-white/45">Draft strength</div>
            <div className="mt-1 font-display text-4xl font-bold">{ratings ? Math.round(ratings.overall) : '—'}</div>
            <div className="mt-1 text-[10px] font-bold text-white/50">Official {Math.round(profile.strengthRating)}</div>
          </div>
        </div>
      </header>

      {message && <div className="mt-5"><Alert tone={message.tone}>{message.text}</Alert></div>}

      <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-pitch-700">Shape</p>
            <h2 className="mt-1 font-display text-xl font-bold text-ink">Choose the formation</h2>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {FORMATIONS.map((item) => (
              <button
                aria-pressed={formation === item}
                className={`rounded-xl border px-3 py-2.5 text-xs font-extrabold transition ${formation === item ? 'border-pitch-600 bg-pitch-50 text-pitch-800 ring-2 ring-pitch-100' : 'border-slate-200 text-slate-500 hover:border-pitch-300'}`}
                key={item}
                onClick={() => changeFormation(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(21rem,.75fr)]">
        <div>
          {ratings ? (
            <ManagerPitch onSelectSlot={setSelectedSlot} profile={profile} ratings={ratings} selectedSlot={selectedSlot} />
          ) : (
            <EmptyState detail="Choose a valid player for all eleven positions." icon="shirt" title="Incomplete XI" />
          )}
        </div>
        <aside className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-pitch-700">Selected position</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-ink">{selectedSlot}</h2>
              <p className="mt-1 text-xs text-slate-500">Choose any compatible squad member below.</p>
            </div>
            {selectedTemplateSlot && (
              <span className="rounded-xl bg-pitch-100 px-3 py-2 text-xs font-black text-pitch-800">{selectedTemplateSlot.position}</span>
            )}
          </div>
          <div className="mt-5 max-h-[31rem] overflow-y-auto pr-1">
            <SquadChooser assignments={assignments} onChoose={choosePlayer} players={profile.squad} selectedSlot={selectedSlot} />
          </div>
        </aside>
      </div>

      <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-card sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-pitch-700">Live calculation</p>
            <h2 className="mt-1 font-display text-xl font-bold text-ink">Lineup ratings</h2>
            <div className="mt-4 grid grid-cols-5 gap-2">
              <RatingBox label="OVR" value={ratings?.overall ?? 0} />
              <RatingBox label="ATT" value={ratings?.attack ?? 0} />
              <RatingBox label="MID" value={ratings?.midfield ?? 0} />
              <RatingBox label="DEF" value={ratings?.defense ?? 0} />
              <RatingBox label="GK" value={ratings?.goalkeeper ?? 0} />
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              {nextFixture
                ? `Next match XI locks at ${formatDate(nextFixture.lineupLocksAt)} — exactly one hour before kickoff. Publishing after that deadline only affects later unlocked matches.`
                : 'There is no upcoming match deadline yet. Your published XI will become the official default.'}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <button
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-extrabold text-ink hover:border-pitch-400 disabled:opacity-50"
              disabled={saving || publishing || !dirty || !ratings}
              onClick={() => void saveDraft()}
              type="button"
            >
              {saving ? 'Saving…' : dirty ? 'Save private draft' : 'Draft saved'}
            </button>
            <button
              className="rounded-xl bg-pitch-700 px-5 py-3 text-sm font-extrabold text-white shadow-glow hover:bg-pitch-800 disabled:opacity-50"
              disabled={saving || publishing || !ratings}
              onClick={() => void publish()}
              type="button"
            >
              {publishing ? 'Publishing…' : dirty ? 'Save & publish XI' : 'Publish official XI'}
            </button>
          </div>
        </div>
      </section>

      <form className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-card sm:p-6" onSubmit={saveTactics}>
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-pitch-700">Private notes</p>
          <h2 className="mt-1 font-display text-xl font-bold text-ink">Tactical identity</h2>
          <p className="mt-1 text-xs text-slate-500">These settings are visible only to you and do not change ratings yet.</p>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <SelectField label="Mentality" onChange={setMentality} options={MENTALITIES} value={mentality} />
          <SelectField label="Pressing" onChange={setPressing} options={PRESSING} value={pressing} />
          <SelectField label="Build-up" onChange={setTempo} options={TEMPOS} value={tempo} />
        </div>
        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-extrabold text-ink">Manager notes <span className="font-medium text-slate-400">(optional)</span></span>
          <textarea
            className="min-h-28 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-ink outline-none transition placeholder:text-slate-400 focus:border-pitch-500 focus:bg-white focus:ring-4 focus:ring-pitch-100"
            maxLength={500}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="E.g. overlap on the left, protect the middle after losing possession…"
            value={notes}
          />
        </label>
        <div className="mt-5 flex justify-end">
          <button className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-50" disabled={savingTactics} type="submit">
            {savingTactics ? 'Saving…' : 'Save tactical notes'}
          </button>
        </div>
      </form>
    </section>
  );
}

export function TeamPage({ teams, user, onClaim, onSaveLineup, onRefresh }: TeamPageProps) {
  const ownedTeam = useMemo(
    () => teams.find(
      (team) => team.isMine || team.dtAssignment?.userId === user.id || team.id === user.dtAssignment?.teamId,
    ),
    [teams, user],
  );
  const [profile, setProfile] = useState<ManagerTeamProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    if (!ownedTeam) {
      setProfile(null);
      return;
    }
    let current = true;
    setLoadingProfile(true);
    setProfileError(null);
    void api.managerTeam()
      .then((result) => {
        if (current) setProfile(result);
      })
      .catch((error: unknown) => {
        if (current) setProfileError(readableError(error));
      })
      .finally(() => {
        if (current) setLoadingProfile(false);
      });
    return () => {
      current = false;
    };
  }, [ownedTeam?.id]);

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  async function claim(teamId: string) {
    setClaimingId(teamId);
    setMessage(null);
    try {
      await onClaim(teamId);
      setMessage({ tone: 'success', text: 'The dugout is yours. Your full squad is ready.' });
    } catch (error) {
      setMessage({ tone: 'error', text: readableError(error) });
    } finally {
      setClaimingId(null);
    }
  }

  if (teams.length === 0) {
    return <EmptyState detail="Teams will appear after the league seed has run." icon="shirt" title="No teams available" />;
  }
  if (ownedTeam) {
    if (loadingProfile) return <Spinner label="Opening your manager workspace" />;
    if (!profile) {
      return <Alert>{profileError ?? 'Your squad could not be loaded. Refresh the page and try again.'}</Alert>;
    }
    if (profile.squad.length < 11 || !profile.officialLineup) {
      return (
        <EmptyState
          detail="Run the squad seed/backfill before opening the manager workspace. Your club claim is safe."
          icon="shirt"
          title="Squad data is not ready"
        />
      );
    }
    return (
      <ManagerEditor
        key={profile.id}
        onRefresh={onRefresh}
        onSaveLineup={onSaveLineup}
        profile={profile}
        setProfile={setProfile}
      />
    );
  }

  return (
    <section>
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[.16em] text-pitch-700">Manager mode</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">Choose your dugout</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Every club already has a persistent 23-player squad and a system-selected official XI. Claiming gives you private draft and publishing control.
        </p>
      </div>

      {message && <div className="mt-5"><Alert tone={message.tone}>{message.text}</Alert></div>}

      <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">Available clubs</h2>
          <p className="mt-1 text-sm text-slate-500">Claiming is first come, first served and limited to one club.</p>
        </div>
        <label className="relative block w-full sm:w-64">
          <span className="sr-only">Search teams</span>
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-pitch-500 focus:ring-4 focus:ring-pitch-100"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search teams…"
            type="search"
            value={search}
          />
        </label>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filteredTeams.map((team) => {
          const claimed = team.isClaimed ?? Boolean(team.dtAssignment);
          return (
            <article className={`flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-card ${claimed ? 'border-slate-200 opacity-65' : 'border-slate-200 hover:border-pitch-300'}`} key={team.id}>
              <div className="min-w-0 flex-1">
                <TeamLink compact team={team} />
                <p className="mt-1 text-xs font-semibold text-slate-400">Strength {Math.round(team.strengthRating)}/100</p>
              </div>
              <button
                className="rounded-xl bg-pitch-100 px-3 py-2 text-xs font-extrabold text-pitch-800 transition hover:bg-pitch-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                disabled={claimed || claimingId !== null}
                onClick={() => void claim(team.id)}
                type="button"
              >
                {claimingId === team.id ? 'Claiming…' : claimed ? 'Taken' : 'Claim'}
              </button>
            </article>
          );
        })}
      </div>

      {filteredTeams.length === 0 && (
        <div className="mt-5"><EmptyState detail="Try a different club name." icon="shirt" title="No matching teams" /></div>
      )}
    </section>
  );
}
