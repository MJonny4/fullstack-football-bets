import { useEffect, useState } from 'react';
import { initials } from '../lib/format';

interface AvatarIdentity {
  displayName: string;
  avatarUrl: string | null;
}

const sizes = {
  sm: 'h-9 w-9 rounded-xl text-xs',
  md: 'h-11 w-11 rounded-2xl text-sm',
  lg: 'h-24 w-24 rounded-[1.75rem] text-2xl',
} as const;

export function UserAvatar({
  user,
  size = 'md',
  className = '',
}: {
  user: AvatarIdentity;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [user.avatarUrl]);

  if (!user.avatarUrl || failed) {
    return (
      <span
        aria-hidden="true"
        className={`${sizes[size]} grid shrink-0 place-items-center bg-gradient-to-br from-pitch-200 to-pitch-400 font-display font-extrabold text-pitch-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ${className}`}
      >
        {initials(user.displayName) || 'M'}
      </span>
    );
  }

  return (
    <span aria-hidden="true" className={`${sizes[size]} block shrink-0 overflow-hidden bg-pitch-100 ${className}`}>
      <img
        alt=""
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
        src={user.avatarUrl}
      />
    </span>
  );
}
