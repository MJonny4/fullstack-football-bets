import { Link } from 'react-router';
import type { TeamSummary } from '@fb/shared';
import { TeamCrest } from './ui';

interface TeamLinkProps {
  team: Pick<TeamSummary, 'id' | 'name' | 'crestImageUrl'>;
  compact?: boolean;
  className?: string;
}

export function TeamLink({ team, compact = false, className = '' }: TeamLinkProps) {
  return (
    <Link
      aria-label={`Open ${team.name} club profile`}
      className={`group inline-flex min-w-0 items-center rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pitch-600 ${compact ? 'gap-2' : 'flex-col gap-3 text-center'} ${className}`}
      to={`/teams/${encodeURIComponent(team.id)}`}
    >
      <span className="transition-transform group-hover:-translate-y-0.5" aria-hidden="true">
        <TeamCrest size={compact ? 'sm' : 'md'} team={team} />
      </span>
      <span className={`${compact ? 'truncate' : 'line-clamp-2'} text-sm font-extrabold leading-5 text-ink underline-offset-4 group-hover:text-pitch-700 group-hover:underline`}>
        {team.name}
      </span>
    </Link>
  );
}
