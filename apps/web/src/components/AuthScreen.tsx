import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { readableError } from '../lib/api';
import { Brand, Icon } from './ui';

type AuthMode = 'login' | 'signup';

export function AuthScreen() {
  const { authenticate } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authenticate(mode, email.trim(), password);
    } catch (cause) {
      setError(readableError(cause));
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
  }

  return (
    <main className="min-h-screen bg-cream p-3 sm:p-5 lg:p-7">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1440px] overflow-hidden rounded-[2rem] bg-white shadow-card sm:min-h-[calc(100vh-2.5rem)] lg:grid-cols-[1.08fr_.92fr]">
        <section className="relative hidden overflow-hidden bg-pitch-950 px-12 py-10 text-white lg:flex lg:flex-col">
          <div className="absolute inset-0 bg-stadium-grid bg-[size:42px_42px] opacity-70" />
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-pitch-400/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-28 h-[28rem] w-[28rem] rounded-full bg-gold/15 blur-3xl" />
          <div className="relative z-10"><Brand light /></div>

          <div className="relative z-10 my-auto max-w-xl py-14">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold uppercase tracking-[.18em] text-pitch-200">
              <span className="h-2 w-2 animate-pulse rounded-full bg-pitch-300" />
              The weekly football market
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-[-.045em] xl:text-7xl">
              Read the game.<br />Back your call.
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-8 text-white/65">
              A fictional league, a fresh round every week, and 1,000 coins to prove you know football better than the table does.
            </p>

            <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">
              {[
                ['20', 'league teams'],
                ['10', 'matches weekly'],
                ['Live', 'coin table'],
              ].map(([value, label]) => (
                <div className="rounded-2xl border border-white/10 bg-white/[.06] p-4 backdrop-blur" key={label}>
                  <div className="font-display text-2xl font-bold text-white">{value}</div>
                  <div className="mt-1 text-xs font-semibold text-white/45">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-xs text-white/35">Virtual coins only. No purchases, no real-money wagering.</p>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-12 lg:px-16 xl:px-24">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden"><Brand /></div>
            <p className="text-sm font-extrabold uppercase tracking-[.18em] text-pitch-600">
              {mode === 'signup' ? 'Join the league' : 'Welcome back'}
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink">
              {mode === 'signup' ? 'Your first pick starts here.' : 'Back to the touchline.'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {mode === 'signup' ? 'Create an account and start with 1,000 virtual coins.' : 'Sign in to see this week’s odds and your open bets.'}
            </p>

            <div className="mt-8 grid grid-cols-2 rounded-2xl bg-slate-100 p-1" aria-label="Authentication mode">
              {(['signup', 'login'] as const).map((item) => (
                <button
                  className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${mode === item ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-ink'}`}
                  key={item}
                  onClick={() => switchMode(item)}
                  type="button"
                >
                  {item === 'signup' ? 'Create account' : 'Sign in'}
                </button>
              ))}
            </div>

            <form className="mt-7 space-y-5" onSubmit={submit}>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-ink">Email address</span>
                <input
                  autoComplete="email"
                  autoFocus
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-ink outline-none transition placeholder:text-slate-400 focus:border-pitch-500 focus:ring-4 focus:ring-pitch-100"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="coach@example.com"
                  required
                  type="email"
                  value={email}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-ink">Password</span>
                <span className="relative block">
                  <input
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 pr-16 text-ink outline-none transition placeholder:text-slate-400 focus:border-pitch-500 focus:ring-4 focus:ring-pitch-100"
                    minLength={8}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                  />
                  <button
                    className="absolute inset-y-0 right-0 px-4 text-xs font-bold text-pitch-700 hover:text-pitch-900"
                    onClick={() => setShowPassword((current) => !current)}
                    type="button"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </span>
              </label>

              {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800" role="alert">{error}</div>}

              <button
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-pitch-700 px-5 py-4 text-sm font-extrabold text-white shadow-glow transition hover:bg-pitch-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
                type="submit"
              >
                {submitting ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/35 border-t-white" /> : <Icon name="ball" className="h-5 w-5" />}
                {submitting ? 'One moment…' : mode === 'signup' ? 'Create my account' : 'Sign in'}
              </button>
            </form>

            <p className="mt-7 text-center text-xs leading-5 text-slate-400">
              This game uses virtual coins with no cash value. By continuing, you agree to play fair.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
