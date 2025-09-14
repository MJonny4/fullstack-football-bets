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
    id: string;
    name: string;
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
    const getInitials = (name: string): string => {
        return name.split(' ')
                  .take(2)
                  .map(word => word.substring(0, 1))
                  .join('');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leaderboard" />
            
            {/* Header Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
                <div className="text-center">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">
                        🏆 Leaderboard
                    </h1>
                    <p className="text-gray-600">
                        See how you rank against the best predictors in the world
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-8">
                    {leaderboard.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Position
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Player
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Points
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Bets
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Accuracy
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {leaderboard.map((user, index) => {
                                        const position = user.position || index + 1;
                                        const isCurrentUser = userStats && user.id === userStats.user_id;
                                        
                                        return (
                                            <tr key={user.id} className={isCurrentUser ? 'bg-blue-50' : ''}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {position <= 3 ? (
                                                            <span className="text-2xl">
                                                                {position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉'}
                                                            </span>
                                                        ) : (
                                                            <span className="text-lg font-semibold text-gray-600">
                                                                {position}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-8 w-8">
                                                            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                                                                {getInitials(user.name)}
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {user.name}
                                                                {isCurrentUser && (
                                                                    <span className="text-blue-500 ml-2">(You)</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-gray-900">
                                                        {user.total_points ?? 0}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        <span className="font-medium text-green-600">
                                                            {user.correct_bets ?? 0}
                                                        </span>
                                                        /
                                                        <span className="text-gray-600">
                                                            {user.total_bets ?? 0}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {user.accuracy ?? 0}%
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                                        <div 
                                                            className="bg-blue-600 h-2 rounded-full" 
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
                            <div className="text-gray-400 text-6xl mb-4">🏆</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Rankings Yet</h3>
                            <p className="text-sm text-gray-600">
                                {message || 'Start placing bets to see the leaderboard!'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}