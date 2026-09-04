import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { api, readableError } from '../lib/api';
import { Alert, Brand, Icon } from './ui';

type AuthView = 'login' | 'signup' | 'forgot' | 'reset' | 'verify';

function authView(pathname: string): AuthView {
  if (pathname === '/login') return 'login';
  if (pathname === '/forgot-password') return 'forgot';
  if (pathname === '/reset-password') return 'reset';
  if (pathname === '/verify-email') return 'verify';
  return 'signup';
}

const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-ink outline-none transition placeholder:text-slate-400 focus:border-pitch-500 focus:ring-4 focus:ring-pitch-100';

export function AuthScreen() {
  const { authenticate, refreshUser, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const view = authView(location.pathname);
  const signedIn = Boolean(user);
  const token = useMemo(() => new URLSearchParams(location.search).get('token') ?? '', [location.search]);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verificationState, setVerificationState] = useState<'working' | 'success' | 'error'>('working');

  useEffect(() => {
    setError(null);
    setMessage(null);
    setPassword('');
    setConfirmPassword('');
  }, [view]);

  useEffect(() => {
    if (view !== 'verify') return;
    if (!token) {
      setVerificationState('error');
      setError('This verification link is incomplete. Request a new one from your profile.');
      return;
    }
    setVerificationState('working');
    void api.verifyEmail(token)
      .then(async () => {
        if (signedIn) await refreshUser();
        setVerificationState('success');
      })
      .catch((cause) => {
        setVerificationState('error');
        setError(readableError(cause));
      });
  }, [refreshUser, signedIn, token, view]);

  async function submitCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (view === 'signup' && password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await authenticate(
        view === 'login' ? 'login' : 'signup',
        email.trim(),
        password,
        view === 'signup' ? { displayName: displayName.trim(), username: username.trim() } : undefined,
      );
      navigate('/matches', { replace: true });
    } catch (cause) {
      setError(readableError(cause));
    } finally {
      setSubmitting(false);
    }
  }

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.forgotPassword(email.trim());
      setMessage('If that address belongs to an active account, a reset link is on its way.');
    } catch (cause) {
      setError(readableError(cause));
    } finally {
      setSubmitting(false);
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!token) {
      setError('This reset link is incomplete. Request a new one.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await api.resetPassword(token, password);
      await refreshUser();
      navigate('/matches', { replace: true });
    } catch (cause) {
      setError(readableError(cause));
    } finally {
      setSubmitting(false);
    }
  }

  const copy = view === 'login'
    ? ['Welcome back', 'Back to the touchline.', 'Sign in to see this week’s odds and your open bets.']
    : view === 'signup'
      ? ['Join the league', 'Create your manager identity.', 'Pick a public username, start with virtual coins, and make your first call.']
      : view === 'forgot'
        ? ['Account recovery', 'Reset your password.', 'We’ll send a secure, one-hour reset link to your account email.']
        : view === 'reset'
          ? ['Account recovery', 'Choose a new password.', 'Your other signed-in devices will be disconnected automatically.']
          : ['Email protection', 'Verify your address.', 'We are confirming that this email belongs to you.'];

  return (
    <main className="min-h-screen bg-cream p-3 sm:p-5 lg:p-7">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1440px] overflow-hidden rounded-[2rem] bg-white shadow-card sm:min-h-[calc(100vh-2.5rem)] lg:grid-cols-[1.08fr_.92fr]">
        <AuthStory />

        <section className="flex items-center justify-center px-5 py-10 sm:px-12 lg:px-16 xl:px-24">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden"><Brand /></div>
            <p className="text-sm font-extrabold uppercase tracking-[.18em] text-pitch-600">{copy[0]}</p>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink">{copy[1]}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">{copy[2]}</p>

            {(view === 'login' || view === 'signup') && (
              <div className="mt-8 grid grid-cols-2 rounded-2xl bg-slate-100 p-1" aria-label="Authentication mode">
                <AuthTab active={view === 'signup'} onClick={() => navigate('/register')}>Create account</AuthTab>
                <AuthTab active={view === 'login'} onClick={() => navigate('/login')}>Sign in</AuthTab>
              </div>
            )}

            {view === 'verify' ? (
              <div className="mt-8">
                {verificationState === 'working' && <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-5 py-5 text-sm font-bold text-slate-500"><span className="h-5 w-5 animate-spin rounded-full border-2 border-pitch-100 border-t-pitch-600" />Verifying your email…</div>}
                {verificationState === 'success' && <Alert tone="success">Your email is verified. Your account recovery is now protected.</Alert>}
                {error && <Alert>{error}</Alert>}
                <button className="mt-5 text-sm font-extrabold text-pitch-700 hover:underline" onClick={() => navigate(user ? '/profile' : '/login')} type="button">{user ? 'Return to profile' : 'Continue to sign in'}</button>
              </div>
            ) : view === 'forgot' ? (
              <form className="mt-8 space-y-5" onSubmit={requestReset}>
                <AuthField label="Email address"><input autoComplete="email" autoFocus className={inputClass} onChange={(event) => setEmail(event.target.value)} placeholder="coach@example.com" required type="email" value={email} /></AuthField>
                {message && <Alert tone="success">{message}</Alert>}
                {error && <Alert>{error}</Alert>}
                <PrimaryButton busy={submitting}>Send reset link</PrimaryButton>
                <BackToLogin onClick={() => navigate('/login')} />
              </form>
            ) : view === 'reset' ? (
              <form className="mt-8 space-y-5" onSubmit={resetPassword}>
                <PasswordField label="New password" onChange={setPassword} show={showPassword} value={password} />
                <PasswordField label="Confirm new password" onChange={setConfirmPassword} show={showPassword} value={confirmPassword} />
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500"><input checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} type="checkbox" />Show passwords</label>
                {error && <Alert>{error}</Alert>}
                <PrimaryButton busy={submitting}>Save new password</PrimaryButton>
                <BackToLogin onClick={() => navigate('/forgot-password')} label="Request another link" />
              </form>
            ) : (
              <form className="mt-7 space-y-5" onSubmit={submitCredentials}>
                {view === 'signup' && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <AuthField label="Display name"><input autoFocus className={inputClass} maxLength={40} minLength={2} onChange={(event) => setDisplayName(event.target.value)} placeholder="Jordan Díaz" required value={displayName} /></AuthField>
                    <AuthField label="Username"><div className="relative"><span className="pointer-events-none absolute inset-y-0 left-4 flex items-center font-bold text-slate-400">@</span><input className={`${inputClass} pl-8`} maxLength={24} minLength={3} onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} pattern="[a-z0-9_]+" placeholder="jordan_d" required value={username} /></div></AuthField>
                  </div>
                )}
                <AuthField label="Email address"><input autoComplete="email" autoFocus={view === 'login'} className={inputClass} onChange={(event) => setEmail(event.target.value)} placeholder="coach@example.com" required type="email" value={email} /></AuthField>
                <AuthField label="Password">
                  <div className="relative">
                    <input autoComplete={view === 'signup' ? 'new-password' : 'current-password'} className={`${inputClass} pr-16`} minLength={8} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" required type={showPassword ? 'text' : 'password'} value={password} />
                    <button className="absolute inset-y-0 right-0 px-4 text-xs font-bold text-pitch-700" onClick={() => setShowPassword((current) => !current)} type="button">{showPassword ? 'Hide' : 'Show'}</button>
                  </div>
                </AuthField>
                {view === 'signup' && <PasswordField label="Confirm password" onChange={setConfirmPassword} show={showPassword} value={confirmPassword} />}
                {view === 'login' && <button className="-mt-2 block text-xs font-extrabold text-pitch-700 hover:underline" onClick={() => navigate('/forgot-password')} type="button">Forgot password?</button>}
                {error && <Alert>{error}</Alert>}
                <PrimaryButton busy={submitting}>{view === 'signup' ? 'Create my account' : 'Sign in'}</PrimaryButton>
              </form>
            )}

            <p className="mt-7 text-center text-xs leading-5 text-slate-400">Virtual coins only. No purchases and no real-money wagering.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function AuthStory() {
  return (
    <section className="relative hidden overflow-hidden bg-pitch-950 px-12 py-10 text-white lg:flex lg:flex-col">
      <div className="absolute inset-0 bg-stadium-grid bg-[size:42px_42px] opacity-70" />
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-pitch-400/20 blur-3xl" />
      <div className="absolute -bottom-40 -left-28 h-[28rem] w-[28rem] rounded-full bg-gold/15 blur-3xl" />
      <div className="relative z-10"><Brand light /></div>
      <div className="relative z-10 my-auto max-w-xl py-14">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold uppercase tracking-[.18em] text-pitch-200"><span className="h-2 w-2 animate-pulse rounded-full bg-pitch-300" />Your manager identity</div>
        <h2 className="font-display text-5xl font-bold leading-[1.02] tracking-[-.045em] xl:text-7xl">Read the game.<br />Own your record.</h2>
        <p className="mt-7 max-w-lg text-lg leading-8 text-white/65">A private account, a public manager identity, and a full betting record built around virtual coins.</p>
        <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">{[['Private', 'account data'], ['Public', 'manager profile'], ['Secure', 'session access']].map(([value, label]) => <div className="rounded-2xl border border-white/10 bg-white/[.06] p-4 backdrop-blur" key={label}><div className="font-display text-xl font-bold text-white">{value}</div><div className="mt-1 text-xs font-semibold text-white/45">{label}</div></div>)}</div>
      </div>
      <p className="relative z-10 text-xs text-white/35">Your email and account settings are never shown on public profiles.</p>
    </section>
  );
}

function AuthField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-ink">{label}</span>{children}</label>;
}

function PasswordField({ label, value, show, onChange }: { label: string; value: string; show: boolean; onChange: (value: string) => void }) {
  return <AuthField label={label}><input autoComplete="new-password" className={inputClass} minLength={8} onChange={(event) => onChange(event.target.value)} placeholder="At least 8 characters" required type={show ? 'text' : 'password'} value={value} /></AuthField>;
}

function AuthTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return <button className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${active ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-ink'}`} onClick={onClick} type="button">{children}</button>;
}

function PrimaryButton({ busy, children }: { busy: boolean; children: ReactNode }) {
  return <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-pitch-700 px-5 py-4 text-sm font-extrabold text-white shadow-glow transition hover:bg-pitch-800 disabled:cursor-not-allowed disabled:opacity-60" disabled={busy} type="submit">{busy ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/35 border-t-white" /> : <Icon className="h-5 w-5" name="ball" />}{busy ? 'One moment…' : children}</button>;
}

function BackToLogin({ onClick, label = 'Back to sign in' }: { onClick: () => void; label?: string }) {
  return <button className="mx-auto block text-xs font-extrabold text-slate-500 hover:text-pitch-700" onClick={onClick} type="button">{label}</button>;
}
