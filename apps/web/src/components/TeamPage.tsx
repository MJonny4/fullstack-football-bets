import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { readableError } from '../lib/api';
import type { LineupInput, Team, User } from '../types';
import { Alert, EmptyState, Icon, TeamCrest } from './ui';

interface TeamPageProps {
  teams: Team[];
  user: User;
  onClaim: (teamId: string) => Promise<void>;
  onSaveLineup: (input: LineupInput) => Promise<void>;
}

const FORMATIONS = ['4-3-3', '4-2-3-1', '4-4-2', '3-5-2', '3-4-3', '5-3-2'];
const MENTALITIES = ['balanced', 'attacking', 'defensive', 'counter'];
const PRESSING = ['high', 'mid-block', 'low-block'];
const TEMPOS = ['patient', 'balanced', 'direct'];

function tacticsValue(tactics: Record<string, unknown> | null | undefined, key: string, fallback: string): string {
  const value = tactics?.[key];
  return typeof value === 'string' ? value : fallback;
}

export function TeamPage({ teams, user, onClaim, onSaveLineup }: TeamPageProps) {
  const ownedTeam = useMemo(() => teams.find((team) => team.isMine || team.dtAssignment?.userId === user.id || team.id === user.dtAssignment?.teamId), [teams, user]);
  const assignment = ownedTeam?.dtAssignment ?? user.dtAssignment;
  const currentTactics = assignment?.tactics;

  const [formation, setFormation] = useState(assignment?.formation ?? '4-3-3');
  const [mentality, setMentality] = useState(() => tacticsValue(currentTactics, 'mentality', 'balanced'));
  const [pressing, setPressing] = useState(() => tacticsValue(currentTactics, 'pressing', 'mid-block'));
  const [tempo, setTempo] = useState(() => tacticsValue(currentTactics, 'tempo', 'balanced'));
  const [notes, setNotes] = useState(() => tacticsValue(currentTactics, 'notes', ''));
  const [search, setSearch] = useState('');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    setFormation(assignment?.formation ?? '4-3-3');
    setMentality(tacticsValue(assignment?.tactics, 'mentality', 'balanced'));
    setPressing(tacticsValue(assignment?.tactics, 'pressing', 'mid-block'));
    setTempo(tacticsValue(assignment?.tactics, 'tempo', 'balanced'));
    setNotes(tacticsValue(assignment?.tactics, 'notes', ''));
  }, [assignment?.formation, assignment?.tactics]);

  const filteredTeams = teams.filter((team) => team.name.toLowerCase().includes(search.trim().toLowerCase()));

  async function claim(teamId: string) {
    setClaimingId(teamId);
    setMessage(null);
    try {
      await onClaim(teamId);
      setMessage({ tone: 'success', text: 'The dugout is yours. Set your first tactical plan below.' });
    } catch (error) {
      setMessage({ tone: 'error', text: readableError(error) });
    } finally {
      setClaimingId(null);
    }
  }

  async function saveLineup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await onSaveLineup({
        formation,
        tactics: { mentality, pressing, tempo, notes: notes.trim() },
      });
      setMessage({ tone: 'success', text: 'Lineup plan saved. It is ready for the future match engine.' });
    } catch (error) {
      setMessage({ tone: 'error', text: readableError(error) });
    } finally {
      setSaving(false);
    }
  }

  if (teams.length === 0) {
    return <EmptyState detail="Teams will appear after the league seed has run." icon="shirt" title="No teams available" />;
  }

  return (
    <section>
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[.16em] text-pitch-700">Manager mode</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">Your dugout</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Claim one unassigned club and record its tactical identity. Your setup is stored now and will influence simulation in a future slice.
        </p>
      </div>

      {message && <div className="mt-5"><Alert tone={message.tone}>{message.text}</Alert></div>}

      {ownedTeam ? (
        <div className="mt-7 grid gap-6 xl:grid-cols-[.72fr_1.28fr]">
          <aside className="relative overflow-hidden rounded-[2rem] bg-pitch-950 p-7 text-white shadow-card">
            <div className="absolute inset-0 bg-stadium-grid bg-[size:32px_32px] opacity-50" />
            <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-pitch-400/20 blur-3xl" />
            <div className="relative">
              <span className="inline-flex rounded-full bg-pitch-400/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.16em] text-pitch-200">Your club</span>
              <div className="mt-8 flex items-center gap-5">
                <TeamCrest size="lg" team={ownedTeam} />
                <div className="min-w-0">
                  <h2 className="font-display text-2xl font-bold leading-tight">{ownedTeam.name}</h2>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-white/45">Strength {ownedTeam.strengthRating}/100</p>
                </div>
              </div>
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[.06] p-4">
                <div className="text-[10px] font-extrabold uppercase tracking-[.14em] text-white/40">Current shape</div>
                <div className="mt-2 font-display text-3xl font-bold text-pitch-200">{formation}</div>
                <div className="mt-2 text-xs font-medium capitalize text-white/55">{mentality} · {pressing} · {tempo}</div>
              </div>
              <p className="mt-6 text-xs leading-5 text-white/40">The current weighted-random result engine only uses team strength. This plan is intentionally data-only for now.</p>
            </div>
          </aside>

          <form className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-card sm:p-7" onSubmit={saveLineup}>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-pitch-50 text-pitch-700"><Icon name="shirt" /></span>
              <div>
                <h2 className="font-display text-xl font-bold text-ink">Lineup & tactics</h2>
                <p className="text-xs text-slate-400">A lightweight plan until players are introduced.</p>
              </div>
            </div>

            <div className="mt-7">
              <span className="mb-2 block text-sm font-extrabold text-ink">Formation</span>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {FORMATIONS.map((item) => (
                  <button
                    aria-pressed={formation === item}
                    className={`rounded-xl border px-2 py-2.5 text-xs font-extrabold transition ${formation === item ? 'border-pitch-600 bg-pitch-50 text-pitch-800 ring-2 ring-pitch-100' : 'border-slate-200 text-slate-500 hover:border-pitch-300'}`}
                    key={item}
                    onClick={() => setFormation(item)}
                    type="button"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
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

            <div className="mt-6 flex justify-end">
              <button className="rounded-xl bg-pitch-700 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-pitch-800 disabled:opacity-60" disabled={saving} type="submit">
                {saving ? 'Saving plan…' : 'Save tactical plan'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="mt-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">Choose your club</h2>
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
                  <TeamCrest team={team} />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-extrabold text-ink">{team.name}</h3>
                    <p className="mt-1 text-xs font-semibold text-slate-400">Strength {team.strengthRating}/100</p>
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

          {filteredTeams.length === 0 && <div className="mt-5"><EmptyState detail="Try a different club name." icon="shirt" title="No matching teams" /></div>}
        </div>
      )}
    </section>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
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
