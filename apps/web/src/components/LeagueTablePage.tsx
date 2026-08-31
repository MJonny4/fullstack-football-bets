import type { LeagueStandings, User } from '../types';
import { EmptyState } from './ui';
import { TeamLink } from './TeamLink';

type Standing = LeagueStandings['entries'][number];
type FormResult = Standing['form'][number];

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

function formLabel(result: FormResult): string {
  if (result === 'W') return 'Win';
  if (result === 'D') return 'Draw';
  return 'Loss';
}

function FormBadge({ result }: { result: FormResult }) {
  const style = result === 'W'
    ? 'bg-pitch-100 text-pitch-800'
    : result === 'D'
      ? 'bg-slate-100 text-slate-600'
      : 'bg-rose-100 text-rose-700';

  return (
    <span
      aria-label={formLabel(result)}
      className={`grid h-6 w-6 place-items-center rounded-md text-[10px] font-extrabold ${style}`}
      title={formLabel(result)}
    >
      <span aria-hidden="true">{result}</span>
    </span>
  );
}

function FormGuide({ form }: { form: Standing['form'] }) {
  if (form.length === 0) return <span className="text-xs font-semibold text-slate-300">—</span>;
  return (
    <span className="inline-flex gap-1" aria-label="Last five results">
      {form.map((result, index) => <FormBadge key={`${result}-${index}`} result={result} />)}
    </span>
  );
}

function positionStyle(position: number, total: number): string {
  if (position === 1) return 'border-l-gold';
  if (position <= 4) return 'border-l-pitch-500';
  if (total >= 6 && position > total - 3) return 'border-l-rose-400';
  return 'border-l-transparent';
}

function positionBadgeStyle(position: number, total: number): string {
  if (position === 1) return 'bg-amber-100 text-amber-800';
  if (position <= 4) return 'bg-pitch-100 text-pitch-800';
  if (total >= 6 && position > total - 3) return 'bg-rose-100 text-rose-700';
  return 'bg-slate-100 text-slate-500';
}

function tieBreakerLabel(value: string): string {
  const normalized = value.toLowerCase().replaceAll('_', ' ');
  const labels: Record<string, string> = {
    points: 'Points',
    'goal difference': 'Goal difference',
    'goals for': 'Goals scored',
    'goals scored': 'Goals scored',
    wins: 'Wins',
    'team name': 'Club name',
    name: 'Club name',
  };
  return labels[normalized] ?? normalized.replace(/\b\w/g, (character) => character.toUpperCase());
}

function lastUpdated(value: string | null): string {
  if (!value) return 'Waiting for the first full-time result';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Updated after the latest full-time result' : `Updated ${dateTimeFormatter.format(parsed)}`;
}

export function LeagueTablePage({ standings, user }: { standings: LeagueStandings | null; user: User }) {
  if (!standings || standings.entries.length === 0) {
    return (
      <EmptyState
        detail="The league table will appear once the competition teams have been set up."
        icon="trophy"
        title="No league table yet"
      />
    );
  }

  const ownTeamId = user.dtAssignment?.teamId;
  const totalTeams = standings.entries.length;
  const ordering = standings.tieBreakers
    .filter((value) => value !== 'TEAM_ID')
    .map(tieBreakerLabel)
    .join(' · ');

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-pitch-700">League competition</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">League table</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Three points for a win, one for a draw. Clubs are separated by goal difference, then goals scored.
          </p>
        </div>
        <div className="rounded-full border border-pitch-200 bg-pitch-50 px-3 py-2 text-xs font-extrabold text-pitch-800">
          Season {standings.seasonNumber} · Matchweek {standings.currentMatchweek}
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat label="Season" value={standings.seasonNumber} />
        <SummaryStat label="Matchweek" value={`${standings.currentMatchweek} / ${standings.roundsPerSeason}`} />
        <SummaryStat label="Matches played" value={`${standings.playedMatches} / ${standings.totalMatches}`} />
        <SummaryStat label="Goals scored" value={standings.goalsScored} />
      </dl>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-5 gap-y-3 text-[11px] font-bold text-slate-500">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="Position markers">
          <Legend color="bg-gold" label="League leader" />
          <Legend color="bg-pitch-500" label="Positions 2–4" />
          <Legend color="bg-rose-400" label="Bottom three" />
        </div>
        <span>{lastUpdated(standings.lastResolvedAt)}</span>
      </div>

      <div className="mt-4 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card lg:block">
        <table className="w-full border-collapse">
          <caption className="sr-only">
            Season {standings.seasonNumber} league table after matchweek {standings.currentMatchweek}
          </caption>
          <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">
            <tr>
              <th className="w-16 px-3 py-3.5 text-center" scope="col"><abbr title="Position">Pos</abbr></th>
              <th className="px-3 py-3.5 text-left" scope="col">Club</th>
              <StatHeading abbreviation="P" label="Played" />
              <StatHeading abbreviation="W" label="Won" />
              <StatHeading abbreviation="D" label="Drawn" />
              <StatHeading abbreviation="L" label="Lost" />
              <StatHeading abbreviation="GF" label="Goals for" />
              <StatHeading abbreviation="GA" label="Goals against" />
              <StatHeading abbreviation="GD" label="Goal difference" />
              <th className="w-32 px-3 py-3.5 text-center" scope="col">Form</th>
              <th className="w-16 px-3 py-3.5 text-center text-ink" scope="col"><abbr title="Points">Pts</abbr></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {standings.entries.map((entry) => {
              const mine = entry.team.id === ownTeamId;
              return (
                <tr className={mine ? 'bg-pitch-50/70' : 'transition-colors hover:bg-slate-50/70'} key={entry.team.id}>
                  <td className={`border-l-4 px-3 py-3 text-center ${positionStyle(entry.position, totalTeams)}`}>
                    <span className={`inline-grid h-7 min-w-7 place-items-center rounded-lg px-1.5 font-display text-xs font-bold ${positionBadgeStyle(entry.position, totalTeams)}`}>
                      {entry.position}
                    </span>
                  </td>
                  <th className="px-3 py-3 text-left" scope="row">
                    <div className="flex items-center gap-3">
                      <TeamLink compact team={entry.team} />
                      <span className="min-w-0">
                        {mine && <span className="mt-0.5 block text-[9px] font-extrabold uppercase tracking-wider text-pitch-700">Your club</span>}
                      </span>
                    </div>
                  </th>
                  <StatCell>{entry.played}</StatCell>
                  <StatCell>{entry.wins}</StatCell>
                  <StatCell>{entry.draws}</StatCell>
                  <StatCell>{entry.losses}</StatCell>
                  <StatCell>{entry.goalsFor}</StatCell>
                  <StatCell>{entry.goalsAgainst}</StatCell>
                  <StatCell emphasized={entry.goalDifference !== 0}>{signed(entry.goalDifference)}</StatCell>
                  <td className="px-3 py-3 text-center"><FormGuide form={entry.form} /></td>
                  <td className="px-3 py-3 text-center font-display text-base font-bold text-ink">{entry.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card lg:hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] border-b border-slate-100 bg-slate-50 px-4 py-3 text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">
          <span>Club</span><span>Points</span>
        </div>
        <ol className="divide-y divide-slate-100" aria-label={`Season ${standings.seasonNumber} league standings`}>
          {standings.entries.map((entry) => {
            const mine = entry.team.id === ownTeamId;
            return (
              <li className={`border-l-4 p-4 ${positionStyle(entry.position, totalTeams)} ${mine ? 'bg-pitch-50/70' : ''}`} key={entry.team.id}>
                <div className="flex items-center gap-3">
                  <span className={`grid h-8 min-w-8 place-items-center rounded-lg px-1.5 font-display text-xs font-bold ${positionBadgeStyle(entry.position, totalTeams)}`}>
                    <span className="sr-only">Position </span>{entry.position}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <TeamLink compact team={entry.team} />
                      {mine && <span className="shrink-0 rounded-full bg-pitch-200 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-pitch-900">Your club</span>}
                    </div>
                    <div className="mt-1 text-[10px] font-semibold text-slate-400">Played {entry.played} · {entry.wins}-{entry.draws}-{entry.losses}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xl font-bold text-ink">{entry.points}</div>
                    <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Pts</div>
                  </div>
                </div>

                <dl className="mt-3 grid grid-cols-7 rounded-xl bg-slate-50/80 p-2">
                  <MobileStat label="P" title="Played" value={entry.played} />
                  <MobileStat label="W" title="Won" value={entry.wins} />
                  <MobileStat label="D" title="Drawn" value={entry.draws} />
                  <MobileStat label="L" title="Lost" value={entry.losses} />
                  <MobileStat label="GF" title="Goals for" value={entry.goalsFor} />
                  <MobileStat label="GA" title="Goals against" value={entry.goalsAgainst} />
                  <MobileStat label="GD" title="Goal difference" value={signed(entry.goalDifference)} />
                </dl>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-[9px] font-extrabold uppercase tracking-[.12em] text-slate-400">Recent form</span>
                  <FormGuide form={entry.form} />
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {ordering && (
        <p className="mt-4 text-center text-[11px] font-semibold text-slate-400">
          Table order: {ordering}.
        </p>
      )}
    </section>
  );
}

function SummaryStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-card">
      <dt className="text-[9px] font-extrabold uppercase tracking-[.14em] text-slate-400">{label}</dt>
      <dd className="mt-1 font-display text-xl font-bold text-ink">{value}</dd>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className={`h-2 w-2 rounded-full ${color}`} />{label}</span>;
}

function StatHeading({ abbreviation, label }: { abbreviation: string; label: string }) {
  return <th className="w-12 px-2 py-3.5 text-center" scope="col"><abbr title={label}>{abbreviation}</abbr></th>;
}

function StatCell({ children, emphasized = false }: { children: number | string; emphasized?: boolean }) {
  return <td className={`px-2 py-3 text-center text-xs font-bold ${emphasized ? 'text-ink' : 'text-slate-500'}`}>{children}</td>;
}

function MobileStat({ label, title, value }: { label: string; title: string; value: number | string }) {
  return (
    <div className="text-center">
      <dt className="text-[8px] font-extrabold uppercase text-slate-400"><abbr title={title}>{label}</abbr></dt>
      <dd className="mt-0.5 text-xs font-extrabold text-ink">{value}</dd>
    </div>
  );
}
