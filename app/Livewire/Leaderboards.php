<?php

namespace App\Livewire;

use App\Models\User;
use App\Models\Bet;
use App\Services\AchievementService;
use Livewire\Component;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class Leaderboards extends Component
{
    public $selectedBoard = 'profit';
    public $selectedPeriod = 'all_time';
    public $currentUser;

    public function mount()
    {
        $this->currentUser = auth()->user();
    }

    public function updatingSelectedBoard()
    {
        // Reset when changing board type
    }

    public function updatingSelectedPeriod()
    {
        // Reset when changing time period
    }

    /**
     * Get profit leaders
     */
    public function getProfitLeadersProperty()
    {
        return $this->getUsersWithStats()
            ->selectRaw('users.*,
                COALESCE(SUM(CASE WHEN bets.status = "won" THEN bets.actual_winnings ELSE 0 END), 0) -
                COALESCE(SUM(bets.amount), 0) as net_profit')
            ->groupBy('users.id')
            ->orderByDesc('net_profit')
            ->limit(50)
            ->get()
            ->map(function ($user, $index) {
                return [
                    'rank' => $index + 1,
                    'user' => $user,
                    'value' => $user->net_profit,
                    'formatted_value' => '€' . number_format($user->net_profit, 2),
                    'badge' => $this->getProfitBadge($user->net_profit),
                ];
            });
    }

    /**
     * Get win rate leaders
     */
    public function getWinRateLeadersProperty()
    {
        return $this->getUsersWithStats()
            ->selectRaw('users.*,
                COUNT(bets.id) as total_bets,
                COALESCE(SUM(CASE WHEN bets.status = "won" THEN 1 ELSE 0 END), 0) as won_bets,
                CASE
                    WHEN COUNT(bets.id) = 0 THEN 0
                    ELSE ROUND((SUM(CASE WHEN bets.status = "won" THEN 1 ELSE 0 END) * 100.0) / COUNT(bets.id), 2)
                END as win_rate')
            ->whereIn('bets.status', ['won', 'lost'])
            ->groupBy('users.id')
            ->having('total_bets', '>=', 10) // Minimum 10 bets for ranking
            ->orderByDesc('win_rate')
            ->limit(50)
            ->get()
            ->map(function ($user, $index) {
                return [
                    'rank' => $index + 1,
                    'user' => $user,
                    'value' => $user->win_rate,
                    'formatted_value' => $user->win_rate . '%',
                    'badge' => $this->getWinRateBadge($user->win_rate),
                    'total_bets' => $user->total_bets,
                ];
            });
    }

    /**
     * Get volume leaders (most bets)
     */
    public function getVolumeLeadersProperty()
    {
        return $this->getUsersWithStats()
            ->selectRaw('users.*, COUNT(bets.id) as total_bets')
            ->groupBy('users.id')
            ->orderByDesc('total_bets')
            ->limit(50)
            ->get()
            ->map(function ($user, $index) {
                return [
                    'rank' => $index + 1,
                    'user' => $user,
                    'value' => $user->total_bets,
                    'formatted_value' => number_format($user->total_bets) . ' bets',
                    'badge' => $this->getVolumeBadge($user->total_bets),
                ];
            });
    }

    /**
     * Get achievement leaders (most achievement points)
     */
    public function getAchievementLeadersProperty()
    {
        return User::withCount(['completedAchievements'])
            ->with(['completedAchievements' => function ($query) {
                $query->select('achievements.points');
            }])
            ->get()
            ->map(function ($user) {
                $totalPoints = $user->completedAchievements->sum('points');
                return [
                    'user' => $user,
                    'total_points' => $totalPoints,
                    'achievements_count' => $user->completed_achievements_count,
                ];
            })
            ->sortByDesc('total_points')
            ->take(50)
            ->values()
            ->map(function ($data, $index) {
                return [
                    'rank' => $index + 1,
                    'user' => $data['user'],
                    'value' => $data['total_points'],
                    'formatted_value' => number_format($data['total_points']) . ' points',
                    'badge' => $this->getAchievementBadge($data['total_points']),
                    'achievements_count' => $data['achievements_count'],
                ];
            });
    }

    /**
     * Get current streak leaders
     */
    public function getStreakLeadersProperty()
    {
        $users = User::whereHas('bets')->get();

        return $users->map(function ($user) {
            $streak = $this->getCurrentStreak($user);
            return [
                'user' => $user,
                'streak' => $streak,
            ];
        })
        ->filter(function ($data) {
            return $data['streak']['count'] > 0;
        })
        ->sortByDesc('streak.count')
        ->take(50)
        ->values()
        ->map(function ($data, $index) {
            return [
                'rank' => $index + 1,
                'user' => $data['user'],
                'value' => $data['streak']['count'],
                'formatted_value' => $data['streak']['count'] . ' ' . $data['streak']['type'],
                'badge' => $this->getStreakBadge($data['streak']['count'], $data['streak']['type']),
                'streak_type' => $data['streak']['type'],
            ];
        });
    }

    /**
     * Get base query for users with betting stats
     */
    private function getUsersWithStats()
    {
        $query = User::leftJoin('bets', 'users.id', '=', 'bets.user_id');

        // Apply time period filter
        if ($this->selectedPeriod !== 'all_time') {
            $query->where('bets.created_at', '>=', $this->getPeriodStartDate());
        }

        return $query;
    }

    /**
     * Get start date for selected period
     */
    private function getPeriodStartDate(): Carbon
    {
        return match($this->selectedPeriod) {
            'today' => now()->startOfDay(),
            'week' => now()->startOfWeek(),
            'month' => now()->startOfMonth(),
            '3months' => now()->subMonths(3),
            'year' => now()->startOfYear(),
            default => now()->subYear(10), // Default to very old date
        };
    }

    /**
     * Calculate current streak for user
     */
    private function getCurrentStreak(User $user): array
    {
        $recentBets = $user->bets()
            ->whereIn('status', ['won', 'lost'])
            ->orderBy('created_at', 'desc')
            ->get();

        if ($recentBets->isEmpty()) {
            return ['count' => 0, 'type' => 'none'];
        }

        $streak = 0;
        $streakType = $recentBets->first()->status;

        foreach ($recentBets as $bet) {
            if ($bet->status === $streakType) {
                $streak++;
            } else {
                break;
            }
        }

        return [
            'count' => $streak,
            'type' => $streakType === 'won' ? 'wins' : 'losses',
        ];
    }

    /**
     * Get current user's rank in selected leaderboard
     */
    public function getCurrentUserRankProperty()
    {
        if (!$this->currentUser) return null;

        $leaderboard = match($this->selectedBoard) {
            'profit' => $this->profitLeaders,
            'win_rate' => $this->winRateLeaders,
            'volume' => $this->volumeLeaders,
            'achievements' => $this->achievementLeaders,
            'streaks' => $this->streakLeaders,
            default => collect([]),
        };

        $userRank = $leaderboard->firstWhere('user.id', $this->currentUser->id);
        return $userRank ? $userRank['rank'] : null;
    }

    /**
     * Badge helpers
     */
    private function getProfitBadge(float $profit): array
    {
        if ($profit >= 1000) return ['text' => 'Millionaire', 'class' => 'bg-yellow-100 text-yellow-800'];
        if ($profit >= 500) return ['text' => 'Big Winner', 'class' => 'bg-purple-100 text-purple-800'];
        if ($profit >= 100) return ['text' => 'Profit Maker', 'class' => 'bg-green-100 text-green-800'];
        if ($profit > 0) return ['text' => 'In Profit', 'class' => 'bg-blue-100 text-blue-800'];
        return ['text' => 'Learning', 'class' => 'bg-gray-100 text-gray-800'];
    }

    private function getWinRateBadge(float $winRate): array
    {
        if ($winRate >= 80) return ['text' => 'Oracle', 'class' => 'bg-yellow-100 text-yellow-800'];
        if ($winRate >= 70) return ['text' => 'Expert', 'class' => 'bg-purple-100 text-purple-800'];
        if ($winRate >= 60) return ['text' => 'Skilled', 'class' => 'bg-green-100 text-green-800'];
        if ($winRate >= 50) return ['text' => 'Balanced', 'class' => 'bg-blue-100 text-blue-800'];
        return ['text' => 'Developing', 'class' => 'bg-gray-100 text-gray-800'];
    }

    private function getVolumeBadge(int $volume): array
    {
        if ($volume >= 1000) return ['text' => 'Legend', 'class' => 'bg-yellow-100 text-yellow-800'];
        if ($volume >= 500) return ['text' => 'Veteran', 'class' => 'bg-purple-100 text-purple-800'];
        if ($volume >= 100) return ['text' => 'Active', 'class' => 'bg-green-100 text-green-800'];
        if ($volume >= 10) return ['text' => 'Regular', 'class' => 'bg-blue-100 text-blue-800'];
        return ['text' => 'Starter', 'class' => 'bg-gray-100 text-gray-800'];
    }

    private function getAchievementBadge(int $points): array
    {
        if ($points >= 1000) return ['text' => 'Champion', 'class' => 'bg-yellow-100 text-yellow-800'];
        if ($points >= 500) return ['text' => 'Hero', 'class' => 'bg-purple-100 text-purple-800'];
        if ($points >= 200) return ['text' => 'Achiever', 'class' => 'bg-green-100 text-green-800'];
        if ($points >= 50) return ['text' => 'Collector', 'class' => 'bg-blue-100 text-blue-800'];
        return ['text' => 'Beginner', 'class' => 'bg-gray-100 text-gray-800'];
    }

    private function getStreakBadge(int $count, string $type): array
    {
        if ($type === 'wins') {
            if ($count >= 10) return ['text' => 'Unstoppable', 'class' => 'bg-yellow-100 text-yellow-800'];
            if ($count >= 5) return ['text' => 'On Fire', 'class' => 'bg-green-100 text-green-800'];
            if ($count >= 3) return ['text' => 'Hot Streak', 'class' => 'bg-blue-100 text-blue-800'];
            return ['text' => 'Winner', 'class' => 'bg-green-100 text-green-800'];
        } else {
            if ($count >= 5) return ['text' => 'Tough Times', 'class' => 'bg-red-100 text-red-800'];
            return ['text' => 'Unlucky', 'class' => 'bg-orange-100 text-orange-800'];
        }
    }

    public function render()
    {
        $leaderboardData = match($this->selectedBoard) {
            'profit' => $this->profitLeaders,
            'win_rate' => $this->winRateLeaders,
            'volume' => $this->volumeLeaders,
            'achievements' => $this->achievementLeaders,
            'streaks' => $this->streakLeaders,
            default => collect([]),
        };

        return view('livewire.leaderboards', [
            'leaderboardData' => $leaderboardData,
            'currentUserRank' => $this->currentUserRank,
        ])->layout('components.layouts.app', ['title' => 'Leaderboards - GoalGuessers']);
    }
}