import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { api, readableError } from '../lib/api';
import { formatCoins, formatDate } from '../lib/format';
import type { BettingLeaderboardEntry, LedgerEntry, User } from '../types';
import { Alert, CoinBalance, Icon, TeamCrest } from './ui';
import { UserAvatar } from './UserAvatar';

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-extrabold text-ink">{label}</span>
      {hint && <span className="ml-2 text-xs font-semibold text-slate-400">{hint}</span>}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-ink outline-none transition placeholder:text-slate-400 focus:border-pitch-500 focus:ring-4 focus:ring-pitch-100 disabled:bg-slate-50 disabled:text-slate-400';

export function ProfilePage({
  user,
  leaderboardEntry,
  onUserChange,
  onLogout,
}: {
  user: User;
  leaderboardEntry?: BettingLeaderboardEntry;
  onUserChange: (user: User) => void;
  onLogout: () => Promise<void>;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [username, setUsername] = useState(user.username);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [profileBusy, setProfileBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [deactivateBusy, setDeactivateBusy] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(user.displayName);
    setUsername(user.username);
  }, [user.displayName, user.username]);

  useEffect(() => {
    void api.ledger().then(setLedger).catch(() => undefined);
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileBusy(true);
    setProfileMessage(null);
    try {
      const updated = await api.updateProfile({ displayName: displayName.trim(), username: username.trim().toLowerCase() });
      onUserChange(updated);
      setProfileMessage({ tone: 'success', text: 'Your public identity has been updated.' });
    } catch (error) {
      setProfileMessage({ tone: 'error', text: readableError(error) });
    } finally {
      setProfileBusy(false);
    }
  }

  async function uploadAvatar(file: File | undefined) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setProfileMessage({ tone: 'error', text: 'Choose an image smaller than 2 MB.' });
      return;
    }
    setAvatarBusy(true);
    setProfileMessage(null);
    try {
      onUserChange(await api.updateAvatar(file));
      setProfileMessage({ tone: 'success', text: 'Profile photo updated.' });
    } catch (error) {
      setProfileMessage({ tone: 'error', text: readableError(error) });
    } finally {
      setAvatarBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function removeAvatar() {
    setAvatarBusy(true);
    setProfileMessage(null);
    try {
      onUserChange(await api.removeAvatar());
      setProfileMessage({ tone: 'success', text: 'Profile photo removed. Your initials are back.' });
    } catch (error) {
      setProfileMessage({ tone: 'error', text: readableError(error) });
    } finally {
      setAvatarBusy(false);
    }
  }

  async function resendVerification() {
    setVerificationSent(false);
    try {
      await api.resendVerification();
      setVerificationSent(true);
    } catch (error) {
      setProfileMessage({ tone: 'error', text: readableError(error) });
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage(null);
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ tone: 'error', text: 'The new passwords do not match.' });
      return;
    }
    setPasswordBusy(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({ tone: 'success', text: 'Password updated. Other signed-in devices were disconnected.' });
    } catch (error) {
      setPasswordMessage({ tone: 'error', text: readableError(error) });
    } finally {
      setPasswordBusy(false);
    }
  }

  async function deactivate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDeactivateBusy(true);
    setDeactivateError(null);
    try {
      await api.deactivateAccount(deactivatePassword);
      await onLogout();
    } catch (error) {
      setDeactivateError(readableError(error));
      setDeactivateBusy(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] bg-pitch-950 px-6 py-7 text-white shadow-card sm:px-8 sm:py-8">
        <div className="absolute inset-0 bg-stadium-grid bg-[size:36px_36px] opacity-60" />
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-pitch-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <UserAvatar className="ring-4 ring-white/10" size="lg" user={user} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate font-display text-3xl font-bold tracking-tight">{user.displayName}</h1>
              <span className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider ${user.emailVerified ? 'bg-pitch-300/20 text-pitch-200' : 'bg-amber-300/15 text-amber-200'}`}>
                {user.emailVerified ? 'Verified email' : 'Email pending'}
              </span>
            </div>
            <p className="mt-1 text-sm font-bold text-pitch-200/70">@{user.username}</p>
            <p className="mt-3 text-xs font-semibold text-white/45">Member since {formatDate(user.createdAt)}</p>
          </div>
          <div className="self-start sm:self-center [&>div]:border-gold/30 [&>div]:bg-gold/10 [&>div]:text-white">
            <CoinBalance value={user.coinBalance} />
          </div>
        </div>
      </div>

      {!user.emailVerified && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <div>
            <div className="font-extrabold">Verify your email address</div>
            <div className="mt-0.5 text-xs font-semibold text-amber-700">Verification protects password recovery and future account changes.</div>
          </div>
          <button className="rounded-xl bg-amber-900 px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-50" disabled={verificationSent} onClick={() => void resendVerification()} type="button">
            {verificationSent ? 'Email sent' : 'Resend email'}
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,.75fr)]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-pitch-700">Public identity</p>
              <h2 className="mt-1 font-display text-xl font-bold text-ink">Profile details</h2>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">Other managers can see your photo, display name, username and managed club—never your email.</p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl bg-slate-50 p-4">
              <UserAvatar size="lg" user={user} />
              <div className="flex flex-wrap gap-2">
                <button className="rounded-xl bg-pitch-700 px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-50" disabled={avatarBusy} onClick={() => fileInput.current?.click()} type="button">
                  {avatarBusy ? 'Processing…' : user.avatarUrl ? 'Replace photo' : 'Upload photo'}
                </button>
                {user.avatarUrl && <button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-600 disabled:opacity-50" disabled={avatarBusy} onClick={() => void removeAvatar()} type="button">Remove</button>}
                <input accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => void uploadAvatar(event.target.files?.[0])} ref={fileInput} type="file" />
              </div>
              <p className="basis-full text-[11px] font-semibold text-slate-400">JPEG, PNG or WebP · maximum 2 MB · automatically cropped to a square.</p>
            </div>

            <form className="mt-6 space-y-5" onSubmit={saveProfile}>
              <Field label="Display name" hint="Shown around the league">
                <input className={inputClass} maxLength={40} minLength={2} onChange={(event) => setDisplayName(event.target.value)} required value={displayName} />
              </Field>
              <Field label="Username" hint="Lowercase, numbers and underscores">
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-bold text-slate-400">@</span>
                  <input className={`${inputClass} pl-8`} maxLength={24} minLength={3} onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} pattern="[a-z0-9_]+" required value={username} />
                </div>
              </Field>
              <Field label="Email" hint="Private">
                <input className={inputClass} disabled value={user.email} />
              </Field>
              {profileMessage && <Alert tone={profileMessage.tone}>{profileMessage.text}</Alert>}
              <button className="rounded-xl bg-pitch-700 px-5 py-3 text-sm font-extrabold text-white disabled:opacity-50" disabled={profileBusy} type="submit">{profileBusy ? 'Saving…' : 'Save profile'}</button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
            <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-pitch-700">Security</p>
            <h2 className="mt-1 font-display text-xl font-bold text-ink">Change password</h2>
            <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={changePassword}>
              <div className="sm:col-span-2"><Field label="Current password"><input autoComplete="current-password" className={inputClass} minLength={8} onChange={(event) => setCurrentPassword(event.target.value)} required type="password" value={currentPassword} /></Field></div>
              <Field label="New password"><input autoComplete="new-password" className={inputClass} minLength={8} onChange={(event) => setNewPassword(event.target.value)} required type="password" value={newPassword} /></Field>
              <Field label="Confirm password"><input autoComplete="new-password" className={inputClass} minLength={8} onChange={(event) => setConfirmPassword(event.target.value)} required type="password" value={confirmPassword} /></Field>
              {passwordMessage && <div className="sm:col-span-2"><Alert tone={passwordMessage.tone}>{passwordMessage.text}</Alert></div>}
              <button className="w-fit rounded-xl bg-ink px-5 py-3 text-sm font-extrabold text-white disabled:opacity-50 sm:col-span-2" disabled={passwordBusy} type="submit">{passwordBusy ? 'Updating…' : 'Update password'}</button>
            </form>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="font-display text-lg font-bold text-ink">Manager snapshot</h2>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              <Metric label="Available coins" value={formatCoins(user.coinBalance)} />
              <Metric label="Leaderboard" value={leaderboardEntry?.rank ? `#${leaderboardEntry.rank}` : 'Unranked'} />
              <Metric label="Settled bets" value={String(leaderboardEntry?.settledBets ?? 0)} />
              <Metric label="Net profit" value={leaderboardEntry ? `${leaderboardEntry.netProfit > 0 ? '+' : ''}${formatCoins(leaderboardEntry.netProfit)}` : '0'} />
            </dl>
            {user.dtAssignment?.team ? (
              <Link className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 p-3 transition hover:border-pitch-300 hover:bg-pitch-50" to={`/teams/${encodeURIComponent(user.dtAssignment.team.id)}`}>
                <TeamCrest size="sm" team={user.dtAssignment.team} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-extrabold text-ink">{user.dtAssignment.team.name}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Managed club</div>
                </div>
              </Link>
            ) : <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-400">You are not managing a club yet.</p>}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-ink">Recent coin activity</h2>
              <Icon className="h-4 w-4 text-gold" name="coins" />
            </div>
            <div className="mt-4 divide-y divide-slate-100">
              {ledger.slice(0, 6).map((entry) => (
                <div className="flex items-center justify-between gap-3 py-3" key={entry.id}>
                  <div>
                    <div className="text-xs font-extrabold text-ink">{entry.type.toLowerCase().replace('_', ' ')}</div>
                    <div className="mt-0.5 text-[10px] font-semibold text-slate-400">{formatDate(entry.createdAt)}</div>
                  </div>
                  <div className={`text-sm font-extrabold ${entry.amount >= 0 ? 'text-pitch-700' : 'text-rose-700'}`}>{entry.amount > 0 ? '+' : ''}{formatCoins(entry.amount)}</div>
                </div>
              ))}
              {ledger.length === 0 && <p className="py-4 text-xs font-semibold text-slate-400">No coin activity yet.</p>}
            </div>
          </section>

          <section className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5">
            <h2 className="font-display text-lg font-bold text-rose-900">Deactivate account</h2>
            <p className="mt-2 text-xs font-semibold leading-5 text-rose-700">Your bets and coin history will be preserved, but you will be signed out and your managed club will be released immediately.</p>
            {!showDeactivate ? (
              <button className="mt-4 text-xs font-extrabold text-rose-800 underline underline-offset-4" onClick={() => setShowDeactivate(true)} type="button">Start deactivation</button>
            ) : (
              <form className="mt-4 space-y-3" onSubmit={deactivate}>
                <input autoComplete="current-password" className={inputClass} minLength={8} onChange={(event) => setDeactivatePassword(event.target.value)} placeholder="Confirm your password" required type="password" value={deactivatePassword} />
                {deactivateError && <Alert>{deactivateError}</Alert>}
                <div className="flex flex-wrap gap-2">
                  <button className="rounded-xl bg-rose-700 px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-50" disabled={deactivateBusy} type="submit">{deactivateBusy ? 'Deactivating…' : 'Deactivate account'}</button>
                  <button className="rounded-xl px-4 py-2.5 text-xs font-extrabold text-slate-500" onClick={() => { setShowDeactivate(false); setDeactivatePassword(''); setDeactivateError(null); }} type="button">Cancel</button>
                </div>
              </form>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <dt className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="mt-1 font-display text-lg font-bold text-ink">{value}</dd>
    </div>
  );
}
