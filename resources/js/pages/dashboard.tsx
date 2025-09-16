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
                <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-card-foreground">Welcome back, {/* auth().user().name */}!</h1>
                            <p className="text-muted-foreground mt-1">Ready to make some predictions?</p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-tommy-red dark:text-tommy-red-dark">⚽</div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-card rounded-xl border border-border p-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-tommy-red/10 dark:bg-tommy-red-dark/20 rounded-lg flex items-center justify-center">
                                <span className="text-xl">🎯</span>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-card-foreground">Total Predictions</h3>
                                <p className="text-2xl font-bold text-tommy-red dark:text-tommy-red-dark">{userStats?.total_predictions || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-xl border border-border p-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-tommy-navy/10 dark:bg-tommy-navy-dark/20 rounded-lg flex items-center justify-center">
                                <span className="text-xl">🏆</span>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-card-foreground">Accuracy</h3>
                                <p className="text-2xl font-bold text-tommy-navy dark:text-tommy-navy-dark">
                                    {userStats?.accuracy_percentage ? `${Number(userStats.accuracy_percentage).toFixed(1)}%` : '0%'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-xl border border-border p-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                                <span className="text-xl">📊</span>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-card-foreground">Ranking</h3>
                                <p className="text-2xl font-bold text-accent">#{userStats?.rank || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-card rounded-xl border border-border p-6">
                        <h3 className="text-lg font-semibold text-card-foreground mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <Link href="/betting" className="flex items-center p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                <span className="text-xl mr-3">⚽</span>
                                <div>
                                    <div className="font-medium text-card-foreground">Make Predictions</div>
                                    <div className="text-sm text-muted-foreground">Predict upcoming matches</div>
                                </div>
                            </Link>
                            <Link href="/leaderboard" className="flex items-center p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                <span className="text-xl mr-3">🏆</span>
                                <div>
                                    <div className="font-medium text-card-foreground">View Leaderboard</div>
                                    <div className="text-sm text-muted-foreground">See how you rank</div>
                                </div>
                            </Link>
                            <Link href="/teams" className="flex items-center p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                <span className="text-xl mr-3">👕</span>
                                <div>
                                    <div className="font-medium text-card-foreground">Browse Teams</div>
                                    <div className="text-sm text-muted-foreground">Explore team information</div>
                                </div>
                            </Link>
                        </div>
                    </div>

                    <div className="bg-card rounded-xl border border-border p-6">
                        <h3 className="text-lg font-semibold text-card-foreground mb-4">Recent Activity</h3>
                        {recentBets.length > 0 ? (
                            <div className="space-y-3">
                                {recentBets.slice(0, 3).map((bet: any) => (
                                    <div key={bet.id} className="flex items-center justify-between p-2 border border-border rounded-lg">
                                        <div className="flex-1">
                                            <div className="text-sm font-medium">
                                                {bet.match?.home_team?.name} vs {bet.match?.away_team?.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Predicted: {bet.prediction === 'H' ? 'Home Win' : bet.prediction === 'D' ? 'Draw' : 'Away Win'}
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground/70">
                                            {bet.points_awarded > 0 ? `+${bet.points_awarded} pts` : 'Pending'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground/70">
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
