import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import type { User } from '../types';
import { Icon } from './ui';
import { UserAvatar } from './UserAvatar';

export function AccountMenu({ user, onLogout }: { user: User; onLogout: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  async function logout() {
    await onLogout();
    navigate('/login', { replace: true });
  }

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    function closeOnPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', closeOnPointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnPointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  function moveFocus(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const items = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    if (!items.length) return;
    event.preventDefault();
    const current = items.indexOf(document.activeElement as HTMLElement);
    const next = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? items.length - 1
        : event.key === 'ArrowDown'
          ? (current + 1) % items.length
          : (current - 1 + items.length) % items.length;
    items[next]?.focus();
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open account menu"
        className="flex items-center gap-1.5 rounded-2xl border border-white/15 bg-white/10 p-1 text-pitch-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_5px_12px_-7px_rgba(0,0,0,0.9)] transition hover:border-white/25 hover:bg-white/15 focus-visible:outline-white"
        onClick={() => setOpen((current) => !current)}
        ref={triggerRef}
        type="button"
      >
        <UserAvatar size="sm" user={user} />
        <Icon className={`mr-1 h-3.5 w-3.5 transition-transform ${open ? '-rotate-90' : 'rotate-90'}`} name="chevron" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 text-ink shadow-[0_24px_70px_-24px_rgba(4,43,31,0.65)]"
          onKeyDown={moveFocus}
          ref={menuRef}
          role="menu"
        >
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
            <UserAvatar user={user} />
            <div className="min-w-0">
              <div className="truncate text-sm font-extrabold">{user.displayName}</div>
              <div className="truncate text-[11px] font-semibold text-slate-400">@{user.username} · {user.email}</div>
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <Link className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold hover:bg-pitch-50 hover:text-pitch-800" role="menuitem" to="/profile">
              <Icon className="h-4 w-4" name="user" />
              Profile & account
            </Link>
          </div>
          <div className="my-2 h-px bg-slate-100" />
          <button
            className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-rose-700 hover:bg-rose-50"
            onClick={() => void logout()}
            role="menuitem"
            type="button"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
