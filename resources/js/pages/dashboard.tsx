import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface Match {
    _id: string;
    home_team: { name: string; short_name: string };
    away_team: { name: string; short_name: string };
    kickoff_time: string;
    status: string;
    home_score?: number;
    away_score?: number;
    gameweek: { name: string; number: number };
}

interface UserStats {
    total_points: number;
    correct_predictions: number;
    total_predictions: number;
    accuracy_percentage: number;
    rank: number;
}

interface LeaderboardEntry {
    user: { name: string };
    total_points: number;
    accuracy_percentage: number;
}

interface Props {
    upcomingMatches: Match[];
    liveMatches: Match[];
    userStats: UserStats | null;
    recentBets: any[];
    pendingBets: number;
    topLeaderboard: LeaderboardEntry[];
    currentGameweek: { name: string; number: number } | null;
}

export default function Dashboard({
    upcomingMatches = [],
    liveMatches = [],
    userStats,
    recentBets = [],
    pendingBets = 0,
    topLeaderboard = [],
    currentGameweek
}: Props) {
    const formatTime = (datetime: string) => {
        return new Date(datetime).toLocaleString('en-GB', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="space-y-8">
                {/* Welcome Header */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {/* auth().user().name */}!</h1>
                            <p className="text-gray-600 mt-1">Ready to make some predictions?</p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">⚽</div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-xl">🎯</span>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-gray-900">Total Predictions</h3>
                                <p className="text-2xl font-bold text-blue-600">{userStats?.total_predictions || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <span className="text-xl">🏆</span>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-gray-900">Accuracy</h3>
                                <p className="text-2xl font-bold text-green-600">
                                    {userStats?.accuracy_percentage ? `${Number(userStats.accuracy_percentage).toFixed(1)}%` : '0%'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-xl">📊</span>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-gray-900">Ranking</h3>
                                <p className="text-2xl font-bold text-purple-600">#{userStats?.rank || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <Link href="/betting" className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                <span className="text-xl mr-3">⚽</span>
                                <div>
                                    <div className="font-medium text-gray-900">Make Predictions</div>
                                    <div className="text-sm text-gray-600">Predict upcoming matches</div>
                                </div>
                            </Link>
                            <Link href="/leaderboard" className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                <span className="text-xl mr-3">🏆</span>
                                <div>
                                    <div className="font-medium text-gray-900">View Leaderboard</div>
                                    <div className="text-sm text-gray-600">See how you rank</div>
                                </div>
                            </Link>
                            <Link href="/teams" className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                <span className="text-xl mr-3">👕</span>
                                <div>
                                    <div className="font-medium text-gray-900">Browse Teams</div>
                                    <div className="text-sm text-gray-600">Explore team information</div>
                                </div>
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                        {recentBets.length > 0 ? (
                            <div className="space-y-3">
                                {recentBets.slice(0, 3).map((bet: any) => (
                                    <div key={bet.id} className="flex items-center justify-between p-2 border rounded-lg">
                                        <div className="flex-1">
                                            <div className="text-sm font-medium">
                                                {bet.match?.home_team?.name} vs {bet.match?.away_team?.name}
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                Predicted: {bet.prediction === 'H' ? 'Home Win' : bet.prediction === 'D' ? 'Draw' : 'Away Win'}
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {bet.points_awarded > 0 ? `+${bet.points_awarded} pts` : 'Pending'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <span className="text-3xl">📭</span>
                                <p className="mt-2">No recent activity</p>
                                <p className="text-sm">Start making predictions to see your activity here</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
