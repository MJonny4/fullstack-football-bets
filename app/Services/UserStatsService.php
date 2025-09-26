<?php

namespace App\Services;

use App\Models\User;
use App\Models\Bet;
use App\Models\FootballMatch;
use App\Models\LeagueTable;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class UserStatsService
{
    private User $user;

    public function __construct(User $user)
    {
        $this->user = $user;
    }

    /**
     * Get comprehensive user statistics with caching for performance.
     */
    public function getCompleteStats(): array
    {
        $cacheKey = "user_stats_{$this->user->id}";

        return Cache::remember($cacheKey, now()->addMinutes(5), function () {
            return [
                'overview' => $this->getOverviewStats(),
                'betting_performance' => $this->getBettingPerformance(),
                'recent_activity' => $this->getRecentActivity(),
                'favorite_teams' => $this->getFavoriteTeams(),
                'achievements' => $this->getAchievements(),
                'balance_history' => $this->getBalanceHistory(),
            ];
        });
    }

    /**
     * Get overview statistics.
     */
    public function getOverviewStats(): array
    {
        $bets = $this->user->bets()->with('match.homeTeam', 'match.awayTeam');
        $totalBets = $bets->count();
        $settledBets = $bets->whereIn('status', ['won', 'lost', 'void']);

        $wonBets = $bets->clone()->where('status', 'won')->count();
        $lostBets = $bets->clone()->where('status', 'lost')->count();
        $pendingBets = $bets->clone()->where('status', 'pending')->count();

        $totalWagered = $bets->clone()->sum('amount');
        $totalWinnings = $bets->clone()->where('status', 'won')->sum('actual_winnings');
        $netProfit = $totalWinnings - $totalWagered;

        $winRate = $settledBets->count() > 0 ? ($wonBets / $settledBets->count()) * 100 : 0;
        $averageBet = $totalBets > 0 ? $totalWagered / $totalBets : 0;

        return [
            'total_bets' => $totalBets,
            'won_bets' => $wonBets,
            'lost_bets' => $lostBets,
            'pending_bets' => $pendingBets,
            'win_rate' => round($winRate, 1),
            'total_wagered' => $totalWagered,
            'total_winnings' => $totalWinnings,
            'net_profit' => $netProfit,
            'average_bet' => $averageBet,
            'current_balance' => $this->user->virtual_balance ?? 0,
            'roi' => $totalWagered > 0 ? round(($netProfit / $totalWagered) * 100, 1) : 0,
        ];
    }

    /**
     * Get detailed betting performance metrics.
     */
    public function getBettingPerformance(): array
    {
        $bets = $this->user->bets()->with('match');

        // Performance by bet type
        $performanceByType = $bets->clone()
            ->whereIn('status', ['won', 'lost', 'void'])
            ->select('bet_type', 'status')
            ->get()
            ->groupBy('bet_type')
            ->map(function ($typeBets) {
                $total = $typeBets->count();
                $won = $typeBets->where('status', 'won')->count();
                return [
                    'total' => $total,
                    'won' => $won,
                    'win_rate' => $total > 0 ? round(($won / $total) * 100, 1) : 0,
                ];
            });

        // Weekly performance (last 8 weeks)
        $weeklyPerformance = $this->getWeeklyPerformance();

        // Best and worst streaks
        $streaks = $this->calculateStreaks();

        // Profitability by month
        $monthlyProfits = $this->getMonthlyProfits();

        return [
            'by_bet_type' => $performanceByType,
            'weekly_performance' => $weeklyPerformance,
            'current_streak' => $streaks['current'],
            'best_winning_streak' => $streaks['best_winning'],
            'worst_losing_streak' => $streaks['worst_losing'],
            'monthly_profits' => $monthlyProfits,
            'biggest_win' => $this->getBiggestWin(),
            'biggest_loss' => $this->getBiggestLoss(),
        ];
    }

    /**
     * Get recent betting activity.
     */
    public function getRecentActivity(): array
    {
        $recentBets = $this->user->bets()
            ->with(['match.homeTeam', 'match.awayTeam', 'match.gameweek'])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(function ($bet) {
                return [
                    'id' => $bet->id,
                    'match' => $bet->match->homeTeam->name . ' vs ' . $bet->match->awayTeam->name,
                    'bet_type' => ucfirst($bet->bet_type),
                    'amount' => $bet->amount,
                    'odds' => $bet->odds,
                    'status' => $bet->status,
                    'result' => $bet->status, // Map status to result for compatibility
                    'potential_winnings' => $bet->potential_winnings,
                    'actual_winnings' => $bet->actual_winnings ?? 0,
                    'created_at' => $bet->created_at,
                    'gameweek' => $bet->match->gameweek->name ?? 'Unknown',
                ];
            });

        return $recentBets->toArray();
    }

    /**
     * Get user's favorite teams based on betting patterns.
     */
    public function getFavoriteTeams(): array
    {
        $teamBets = $this->user->bets()
            ->with('match.homeTeam', 'match.awayTeam')
            ->get()
            ->flatMap(function ($bet) {
                return [
                    ['team' => $bet->match->homeTeam, 'bet' => $bet],
                    ['team' => $bet->match->awayTeam, 'bet' => $bet],
                ];
            })
            ->groupBy('team.id')
            ->map(function ($teamBets, $teamId) {
                $team = $teamBets->first()['team'];
                $bets = $teamBets->pluck('bet');
                $won = $bets->where('status', 'won')->count();
                $total = $bets->count();

                return [
                    'team' => $team,
                    'total_bets' => $total,
                    'won_bets' => $won,
                    'win_rate' => $total > 0 ? round(($won / $total) * 100, 1) : 0,
                    'total_wagered' => $bets->sum('amount'),
                    'total_winnings' => $bets->where('status', 'won')->sum('actual_winnings'),
                ];
            })
            ->sortByDesc('total_bets')
            ->take(5)
            ->values();

        return $teamBets->toArray();
    }

    /**
     * Get user achievements and milestones.
     */
    public function getAchievements(): array
    {
        $stats = $this->getOverviewStats();
        $achievements = [];

        // Betting volume achievements
        if ($stats['total_bets'] >= 100) {
            $achievements[] = ['name' => 'Century Bettor', 'description' => 'Placed 100+ bets', 'icon' => '💯'];
        } elseif ($stats['total_bets'] >= 50) {
            $achievements[] = ['name' => 'Regular Bettor', 'description' => 'Placed 50+ bets', 'icon' => '🎯'];
        } elseif ($stats['total_bets'] >= 10) {
            $achievements[] = ['name' => 'Getting Started', 'description' => 'Placed 10+ bets', 'icon' => '🚀'];
        }

        // Win rate achievements
        if ($stats['win_rate'] >= 70 && $stats['total_bets'] >= 20) {
            $achievements[] = ['name' => 'Oracle', 'description' => '70%+ win rate with 20+ bets', 'icon' => '🔮'];
        } elseif ($stats['win_rate'] >= 60 && $stats['total_bets'] >= 10) {
            $achievements[] = ['name' => 'Sharp Bettor', 'description' => '60%+ win rate', 'icon' => '🎯'];
        }

        // Profit achievements
        if ($stats['net_profit'] >= 500) {
            $achievements[] = ['name' => 'High Roller', 'description' => '€500+ profit', 'icon' => '💰'];
        } elseif ($stats['net_profit'] >= 100) {
            $achievements[] = ['name' => 'Profitable', 'description' => '€100+ profit', 'icon' => '📈'];
        }

        return $achievements;
    }

    /**
     * Get balance history for the last 30 days.
     */
    public function getBalanceHistory(): array
    {
        // This would ideally come from a balance_history table
        // For now, we'll simulate based on betting activity
        $bets = $this->user->bets()
            ->where('created_at', '>=', now()->subDays(30))
            ->orderBy('created_at')
            ->get();

        $balance = 1000; // Starting balance
        $history = [['date' => now()->subDays(30)->toDateString(), 'balance' => $balance]];

        foreach ($bets as $bet) {
            $balance -= $bet->amount;
            if ($bet->status === 'won') {
                $balance += $bet->actual_winnings;
            }
            $history[] = [
                'date' => $bet->created_at->toDateString(),
                'balance' => $balance,
                'change' => $bet->status === 'won' ? $bet->actual_winnings - $bet->amount : -$bet->amount,
            ];
        }

        return array_slice($history, -30); // Last 30 entries
    }

    /**
     * Calculate winning/losing streaks.
     */
    private function calculateStreaks(): array
    {
        $recentBets = $this->user->bets()
            ->whereIn('status', ['won', 'lost', 'void'])
            ->orderByDesc('created_at')
            ->pluck('status')
            ->toArray();

        $currentStreak = 0;
        $bestWinning = 0;
        $worstLosing = 0;
        $tempWinning = 0;
        $tempLosing = 0;

        foreach ($recentBets as $index => $status) {
            if ($index === 0) {
                $currentStreak = $status === 'won' ? 1 : -1;
            } else {
                if ($status === 'won') {
                    if ($currentStreak > 0) {
                        $currentStreak++;
                    } else {
                        $currentStreak = 1;
                    }
                    $tempWinning++;
                    $tempLosing = 0;
                } else {
                    if ($currentStreak < 0) {
                        $currentStreak--;
                    } else {
                        $currentStreak = -1;
                    }
                    $tempLosing++;
                    $tempWinning = 0;
                }
            }

            $bestWinning = max($bestWinning, $tempWinning);
            $worstLosing = max($worstLosing, $tempLosing);
        }

        return [
            'current' => $currentStreak,
            'best_winning' => $bestWinning,
            'worst_losing' => $worstLosing,
        ];
    }

    /**
     * Get weekly performance data.
     */
    private function getWeeklyPerformance(): array
    {
        return $this->user->bets()
            ->where('created_at', '>=', now()->subWeeks(8))
            ->whereIn('status', ['won', 'lost', 'void'])
            ->selectRaw('
                WEEK(created_at) as week,
                YEAR(created_at) as year,
                COUNT(*) as total_bets,
                SUM(CASE WHEN status = "won" THEN 1 ELSE 0 END) as won_bets,
                SUM(amount) as wagered,
                SUM(CASE WHEN status = "won" THEN actual_winnings ELSE 0 END) as winnings
            ')
            ->groupByRaw('YEAR(created_at), WEEK(created_at)')
            ->orderByRaw('year DESC, week DESC')
            ->limit(8)
            ->get()
            ->map(function ($week) {
                return [
                    'week' => "W{$week->week}/{$week->year}",
                    'total_bets' => $week->total_bets,
                    'won_bets' => $week->won_bets,
                    'win_rate' => $week->total_bets > 0 ? round(($week->won_bets / $week->total_bets) * 100, 1) : 0,
                    'profit' => $week->winnings - $week->wagered,
                ];
            })
            ->reverse()
            ->values()
            ->toArray();
    }

    /**
     * Get monthly profit data.
     */
    private function getMonthlyProfits(): array
    {
        return $this->user->bets()
            ->where('created_at', '>=', now()->subMonths(6))
            ->whereIn('status', ['won', 'lost', 'void'])
            ->selectRaw('
                MONTH(created_at) as month,
                YEAR(created_at) as year,
                SUM(amount) as wagered,
                SUM(CASE WHEN status = "won" THEN actual_winnings ELSE 0 END) as winnings
            ')
            ->groupByRaw('YEAR(created_at), MONTH(created_at)')
            ->orderByRaw('year DESC, month DESC')
            ->limit(6)
            ->get()
            ->map(function ($month) {
                $profit = $month->winnings - $month->wagered;
                return [
                    'month' => Carbon::create($month->year, $month->month, 1)->format('M Y'),
                    'profit' => $profit,
                    'wagered' => $month->wagered,
                    'winnings' => $month->winnings,
                    'roi' => $month->wagered > 0 ? round(($profit / $month->wagered) * 100, 1) : 0,
                ];
            })
            ->reverse()
            ->values()
            ->toArray();
    }

    /**
     * Get biggest win.
     */
    private function getBiggestWin(): ?array
    {
        $biggestWin = $this->user->bets()
            ->where('status', 'won')
            ->orderByDesc('actual_winnings')
            ->with('match.homeTeam', 'match.awayTeam')
            ->first();

        if (!$biggestWin) return null;

        return [
            'amount' => $biggestWin->actual_winnings,
            'match' => $biggestWin->match->homeTeam->name . ' vs ' . $biggestWin->match->awayTeam->name,
            'bet_type' => $biggestWin->bet_type,
            'odds' => $biggestWin->odds,
            'date' => $biggestWin->created_at,
        ];
    }

    /**
     * Get biggest loss.
     */
    private function getBiggestLoss(): ?array
    {
        $biggestLoss = $this->user->bets()
            ->where('status', 'lost')
            ->orderByDesc('amount')
            ->with('match.homeTeam', 'match.awayTeam')
            ->first();

        if (!$biggestLoss) return null;

        return [
            'amount' => $biggestLoss->amount,
            'match' => $biggestLoss->match->homeTeam->name . ' vs ' . $biggestLoss->match->awayTeam->name,
            'bet_type' => $biggestLoss->bet_type,
            'odds' => $biggestLoss->odds,
            'date' => $biggestLoss->created_at,
        ];
    }

    /**
     * Clear user stats cache.
     */
    public function clearCache(): void
    {
        Cache::forget("user_stats_{$this->user->id}");
    }

    /**
     * Get quick stats for navigation display.
     */
    public function getQuickStats(): array
    {
        return Cache::remember("user_quick_stats_{$this->user->id}", now()->addMinutes(2), function () {
            $overview = $this->getOverviewStats();
            return [
                'balance' => $overview['current_balance'],
                'total_bets' => $overview['total_bets'],
                'win_rate' => $overview['win_rate'],
                'net_profit' => $overview['net_profit'],
                'pending_bets' => $overview['pending_bets'],
            ];
        });
    }
}