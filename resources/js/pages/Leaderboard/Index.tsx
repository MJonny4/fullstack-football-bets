import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Leaderboard',
        href: '/leaderboard',
    },
];

interface LeaderboardUser {
    _id: string;
    name?: string;
    total_points?: number;
    correct_bets?: number;
    total_bets?: number;
    accuracy?: number;
    position?: number;
}

interface Props {
    leaderboard: LeaderboardUser[];
    currentSeason?: { name: string } | null;
    userStats?: any;
    message?: string;
}

export default function LeaderboardIndex({ 
    leaderboard = [], 
    currentSeason,
    userStats,
    message 
}: Props) {
    const getInitials = (name: string | undefined): string => {
        if (!name) return '?';
        return name.split(' ')
                  .slice(0, 2)
                  .map(word => word.substring(0, 1))
                  .join('');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leaderboard" />
            
            {/* Header Card */}
            <div className="bg-card rounded-xl border border-border p-8 mb-6">
                <div className="text-center">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">
                        🏆 Leaderboard
                    </h1>
                    <p className="text-muted-foreground">
                        See how you rank against the best predictors in the world
                    </p>
                </div>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-8">
                    {leaderboard.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Position
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Player
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Points
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Bets
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Accuracy
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-card divide-y divide-border">
                                    {leaderboard.map((user, index) => {
                                        const position = user.position || index + 1;
                                        const isCurrentUser = userStats && user._id === userStats.user_id;
                                        
                                        return (
                                            <tr key={user._id} className={isCurrentUser ? 'bg-tommy-red/5 dark:bg-tommy-red-dark/10' : ''}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {position <= 3 ? (
                                                            <span className="text-2xl">
                                                                {position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉'}
                                                            </span>
                                                        ) : (
                                                            <span className="text-lg font-semibold text-muted-foreground">
                                                                {position}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-8 w-8">
                                                            <div className="h-8 w-8 rounded-full bg-tommy-red dark:bg-tommy-red-dark flex items-center justify-center text-white text-sm font-medium">
                                                                {getInitials(user.name)}
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-card-foreground">
                                                                {user.name || 'Unknown User'}
                                                                {isCurrentUser && (
                                                                    <span className="text-tommy-red dark:text-tommy-red-dark ml-2">(You)</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-card-foreground">
                                                        {user.total_points ?? 0}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-card-foreground">
                                                        <span className="font-medium text-tommy-navy dark:text-tommy-navy-dark">
                                                            {user.correct_bets ?? 0}
                                                        </span>
                                                        /
                                                        <span className="text-muted-foreground">
                                                            {user.total_bets ?? 0}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-card-foreground">
                                                        {user.accuracy ?? 0}%
                                                    </div>
                                                    <div className="w-full bg-muted rounded-full h-2 mt-1">
                                                        <div 
                                                            className="bg-tommy-red dark:bg-tommy-red-dark h-2 rounded-full" 
                                                            style={{ width: `${user.accuracy ?? 0}%` }}
                                                        ></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="text-muted-foreground text-6xl mb-4">🏆</div>
                            <h3 className="text-lg font-medium text-card-foreground mb-2">No Rankings Yet</h3>
                            <p className="text-sm text-muted-foreground">
                                {message || 'Start placing bets to see the leaderboard!'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}