import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { api, readableError } from '../lib/api';
import type { PublicManagerProfile } from '../types';
import { Alert, Icon, Spinner, TeamCrest } from './ui';
import { UserAvatar } from './UserAvatar';

export function PublicManagerProfilePage() {
  const { username = '' } = useParams();
  const [profile, setProfile] = useState<PublicManagerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProfile(null);
    setError(null);
    void api.managerProfile(username).then(setProfile).catch((cause) => setError(readableError(cause)));
  }, [username]);

  if (error) return <Alert>{error}</Alert>;
  if (!profile) return <Spinner label="Loading manager profile" />;

  return (
    <section className="mx-auto max-w-3xl">
      <div className="relative overflow-hidden rounded-[2rem] bg-pitch-950 px-6 py-10 text-center text-white shadow-card sm:px-10">
        <div className="absolute inset-0 bg-stadium-grid bg-[size:38px_38px] opacity-60" />
        <div className="absolute left-1/2 top-0 h-52 w-52 -translate-x-1/2 rounded-full bg-pitch-400/20 blur-3xl" />
        <div className="relative">
          <UserAvatar className="mx-auto ring-4 ring-white/10" size="lg" user={profile} />
          <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.18em] text-pitch-200/65">Touchline manager</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{profile.displayName}</h1>
          <p className="mt-1 text-sm font-bold text-pitch-200/70">@{profile.username}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-pitch-700">Managed club</p>
        {profile.team ? (
          <Link className="mt-4 flex items-center gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-pitch-300 hover:bg-pitch-50" to={`/teams/${encodeURIComponent(profile.team.id)}`}>
            <TeamCrest team={profile.team} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-xl font-bold text-ink">{profile.team.name}</div>
              <div className="mt-1 text-xs font-semibold text-slate-400">Open club profile</div>
            </div>
            <Icon className="h-5 w-5 text-slate-300" name="chevron" />
          </Link>
        ) : (
          <p className="mt-4 rounded-2xl bg-slate-50 px-5 py-6 text-center text-sm font-semibold text-slate-400">This manager is currently independent.</p>
        )}
      </div>
    </section>
  );
}
