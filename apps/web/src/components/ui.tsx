import { useState, type ReactNode, type SVGProps } from 'react';
import { formatCoins, initials } from '../lib/format';
import type { Numeric, Team } from '../types';

export type IconName =
  | 'ball'
  | 'ticket'
  | 'trophy'
  | 'table'
  | 'ranking'
  | 'shirt'
  | 'coins'
  | 'clock'
  | 'check'
  | 'wifi'
  | 'refresh'
  | 'user'
  | 'chevron';

export function Icon({ name, className = 'h-5 w-5', ...props }: { name: IconName; className?: string } & SVGProps<SVGSVGElement>) {
  const common = {
    className,
    fill: 'none',
    viewBox: '0 0 24 24',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...props,
  };

  switch (name) {
    case 'ball':
      return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="m8.7 4.8 3.3 2.4 3.3-2.4M7.3 9l1.2 3.8L12 15l3.5-2.2L16.7 9M8.5 12.8 5 15.2m10.5-2.4 3.5 2.4M12 15v4.5"/></svg>;
    case 'ticket':
      return <svg {...common}><path d="M4 7.5A2.5 2.5 0 0 0 6.5 10a2.5 2.5 0 0 0 0 5A2.5 2.5 0 0 0 4 17.5V20h16v-2.5a2.5 2.5 0 0 0 0-5 2.5 2.5 0 0 0 0-5V5H4v2.5Z"/><path d="M13 8v1m0 3v1m0 3v1"/></svg>;
    case 'trophy':
      return <svg {...common}><path d="M8 4h8v4a4 4 0 0 1-8 0V4Z"/><path d="M8 6H5v1a4 4 0 0 0 4 4m7-5h3v1a4 4 0 0 1-4 4m-3 1v4m-3 4h6m-5-4h4"/></svg>;
    case 'table':
      return <svg {...common}><path d="M4 5h16v14H4zM4 10h16M9 5v14"/><path d="M12 14h5m-5 2.5h3"/></svg>;
    case 'ranking':
      return <svg {...common}><path d="M4 20v-6h5v6m6 0V9h5v11M9 20V4h6v16"/><path d="M10.5 7h3M5.5 17h2M16.5 12h2"/></svg>;
    case 'shirt':
      return <svg {...common}><path d="m8 4-5 3 2 4 2-1v10h10V10l2 1 2-4-5-3a4.5 4.5 0 0 1-8 0Z"/></svg>;
    case 'coins':
      return <svg {...common}><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v4c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 10v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4M5 14v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4"/></svg>;
    case 'clock':
      return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'check':
      return <svg {...common}><path d="m5 12 4 4L19 6"/></svg>;
    case 'wifi':
      return <svg {...common}><path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 20h.01M2 9a14.5 14.5 0 0 1 20 0"/></svg>;
    case 'refresh':
      return <svg {...common}><path d="M20 7v5h-5M4 17v-5h5"/><path d="M18.2 10A7 7 0 0 0 6 7.5L4 12m16 0-2 4.5A7 7 0 0 1 5.8 14"/></svg>;
    case 'user':
      return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>;
    case 'chevron':
      return <svg {...common}><path d="m9 18 6-6-6-6"/></svg>;
  }
}

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`grid h-10 w-10 place-items-center rounded-2xl ${light ? 'bg-white/10 text-pitch-300' : 'bg-pitch-950 text-pitch-300'}`}>
        <Icon name="ball" className="h-6 w-6" />
      </span>
      <span className={`font-display text-lg font-bold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>
        Touchline<span className="text-pitch-400">.</span>
      </span>
    </div>
  );
}

export function CoinBalance({ value, compact = false, inverted = false }: { value: Numeric; compact?: boolean; inverted?: boolean }) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 font-bold ${inverted ? 'text-white' : 'text-ink'} ${compact ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'}`}>
      <span className="grid h-6 w-6 place-items-center rounded-full bg-gold text-amber-950">
        <Icon name="coins" className="h-3.5 w-3.5" />
      </span>
      <span>{formatCoins(value)}</span>
      {!compact && (
        <span className={`text-xs font-semibold uppercase tracking-wider ${inverted ? 'text-white' : 'text-ink/50'}`}>
          coins
        </span>
      )}
    </div>
  );
}

export function TeamCrest({ team, size = 'md' }: { team: Pick<Team, 'name' | 'crestImageUrl'>; size?: 'sm' | 'md' | 'lg' }) {
  const [failed, setFailed] = useState(false);
  const classes = size === 'lg' ? 'h-20 w-20 text-xl' : size === 'sm' ? 'h-9 w-9 text-xs' : 'h-12 w-12 text-sm';

  if (!team.crestImageUrl || failed) {
    return (
      <span className={`${classes} grid shrink-0 place-items-center rounded-2xl border border-pitch-200 bg-pitch-50 font-display font-bold text-pitch-800`}>
        {initials(team.name)}
      </span>
    );
  }

  return (
    <span className={`${classes} grid shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5`}>
      <img
        alt={`${team.name} crest`}
        className="h-full w-full object-contain"
        onError={() => setFailed(true)}
        src={team.crestImageUrl}
      />
    </span>
  );
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-sm font-semibold text-slate-500" role="status">
      <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-pitch-100 border-t-pitch-600" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ icon, title, detail, action }: { icon: IconName; title: string; detail: string; action?: ReactNode }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/65 px-6 py-14 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-pitch-50 text-pitch-700">
        <Icon name={icon} className="h-7 w-7" />
      </span>
      <h3 className="mt-4 font-display text-xl font-bold text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{detail}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Alert({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'success' | 'info' }) {
  const styles = tone === 'success'
    ? 'border-pitch-200 bg-pitch-50 text-pitch-900'
    : tone === 'info'
      ? 'border-sky-200 bg-sky-50 text-sky-900'
      : 'border-rose-200 bg-rose-50 text-rose-800';
  return <div className={`rounded-2xl border px-4 py-3 text-sm font-medium leading-5 ${styles}`} role={tone === 'error' ? 'alert' : 'status'}>{children}</div>;
}

export function StatusPill({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const styles = normalized === 'WON' || normalized === 'OPEN' || normalized === 'RESOLVED'
    ? 'bg-pitch-100 text-pitch-800'
    : normalized === 'LOST' || normalized === 'CLOSED'
      ? 'bg-rose-100 text-rose-800'
      : 'bg-amber-100 text-amber-800';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider ${styles}`}>{status}</span>;
}
