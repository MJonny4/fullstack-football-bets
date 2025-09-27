<?php

namespace App\Services;

use App\Models\Achievement;
use App\Models\User;
use App\Models\UserAchievement;
use App\Models\Bet;
use Illuminate\Support\Collection;
use Carbon\Carbon;

class AchievementService
{
    /**
     * Check and update all achievements for a user after a betting event
     */
    public function checkAchievementsAfterBet(User $user, Bet $bet): array
    {
        $newAchievements = [];

        // Get all active achievements
        $achievements = Achievement::active()->get();

        foreach ($achievements as $achievement) {
            $currentProgress = $this->getUserAchievementProgress($user, $achievement);

            if ($currentProgress && $currentProgress->is_completed) {
                continue; // Already completed
            }

            $newProgress = $this->calculateProgressForAchievement($user, $achievement);
            $isCompleted = $this->isAchievementCompleted($achievement, $newProgress);

            // Update or create user achievement record
            $userAchievement = UserAchievement::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'achievement_id' => $achievement->id,
                ],
                [
                    'progress_value' => $newProgress,
                    'is_completed' => $isCompleted,
                    'completed_at' => $isCompleted ? now() : null,
                ]
            );

            // If newly completed, add to new achievements array
            if ($isCompleted && (!$currentProgress || !$currentProgress->is_completed)) {
                $newAchievements[] = $achievement;
            }
        }

        return $newAchievements;
    }

    /**
     * Calculate current progress for a specific achievement
     */
    private function calculateProgressForAchievement(User $user, Achievement $achievement): float
    {
        return match ($achievement->key) {
            // Betting Activity Achievements
            'first_bet' => $user->bets()->count() >= 1 ? 1 : 0,
            'betting_starter' => $user->bets()->count(),
            'betting_veteran' => $user->bets()->count(),
            'betting_legend' => $user->bets()->count(),

            // Profit Achievements
            'first_win' => $user->bets()->where('status', 'won')->count() >= 1 ? 1 : 0,
            'profit_maker' => max(0, $user->bets()->where('status', 'won')->sum('actual_winnings') - $user->bets()->sum('amount')),
            'big_winner' => max(0, $user->bets()->where('status', 'won')->sum('actual_winnings') - $user->bets()->sum('amount')),
            'millionaire' => max(0, $user->bets()->where('status', 'won')->sum('actual_winnings') - $user->bets()->sum('amount')),

            // Streak Achievements
            'winning_streak_3' => $this->getCurrentWinningStreak($user),
            'winning_streak_5' => $this->getCurrentWinningStreak($user),
            'winning_streak_10' => $this->getCurrentWinningStreak($user),

            // Win Rate Achievements
            'good_predictor' => $this->getWinRate($user),
            'prediction_master' => $this->getWinRate($user),
            'crystal_ball' => $this->getWinRate($user),

            // Volume Achievements
            'daily_better' => $user->bets()->whereDate('created_at', today())->count(),
            'weekly_warrior' => $user->bets()->where('created_at', '>=', now()->startOfWeek())->count(),
            'monthly_master' => $user->bets()->whereMonth('created_at', now()->month)->count(),

            default => 0,
        };
    }

    /**
     * Check if achievement is completed based on progress and target
     */
    private function isAchievementCompleted(Achievement $achievement, float $progress): bool
    {
        if (!$achievement->target_value) {
            return $progress > 0; // For achievements without specific targets
        }

        return $progress >= $achievement->target_value;
    }

    /**
     * Get user's current achievement progress
     */
    private function getUserAchievementProgress(User $user, Achievement $achievement): ?UserAchievement
    {
        return UserAchievement::where('user_id', $user->id)
            ->where('achievement_id', $achievement->id)
            ->first();
    }

    /**
     * Get current winning streak for user
     */
    private function getCurrentWinningStreak(User $user): int
    {
        $recentBets = $user->bets()
            ->whereIn('status', ['won', 'lost'])
            ->orderBy('created_at', 'desc')
            ->get();

        $streak = 0;
        foreach ($recentBets as $bet) {
            if ($bet->status === 'won') {
                $streak++;
            } else {
                break;
            }
        }

        return $streak;
    }

    /**
     * Get user's win rate percentage
     */
    private function getWinRate(User $user): float
    {
        $totalBets = $user->bets()->whereIn('status', ['won', 'lost'])->count();
        if ($totalBets === 0) return 0;

        $wonBets = $user->bets()->where('status', 'won')->count();
        return round(($wonBets / $totalBets) * 100, 2);
    }

    /**
     * Get user's completed achievements with details
     */
    public function getUserCompletedAchievements(User $user): Collection
    {
        return $user->completedAchievements()
            ->orderBy('pivot_completed_at', 'desc')
            ->get();
    }

    /**
     * Get user's achievements in progress
     */
    public function getUserInProgressAchievements(User $user): Collection
    {
        return $user->userAchievements()
            ->with('achievement')
            ->inProgress()
            ->get()
            ->map(function ($userAchievement) {
                return [
                    'achievement' => $userAchievement->achievement,
                    'progress' => $userAchievement->progress_value,
                    'target' => $userAchievement->achievement->target_value,
                    'percentage' => $userAchievement->completion_percentage,
                ];
            });
    }

    /**
     * Get recent achievements for user (last 7 days)
     */
    public function getRecentAchievements(User $user): Collection
    {
        return UserAchievement::where('user_id', $user->id)
            ->completed()
            ->where('completed_at', '>=', now()->subDays(7))
            ->with('achievement')
            ->orderBy('completed_at', 'desc')
            ->get();
    }

    /**
     * Get achievement statistics for user
     */
    public function getUserAchievementStats(User $user): array
    {
        $totalAchievements = Achievement::active()->count();
        $completedCount = $user->completedAchievements()->count();
        $inProgressCount = $user->userAchievements()->inProgress()->count();
        $totalPoints = $user->total_achievement_points;

        return [
            'total_achievements' => $totalAchievements,
            'completed_count' => $completedCount,
            'in_progress_count' => $inProgressCount,
            'completion_percentage' => $totalAchievements > 0 ? round(($completedCount / $totalAchievements) * 100, 1) : 0,
            'total_points' => $totalPoints,
            'recent_count' => $this->getRecentAchievements($user)->count(),
        ];
    }

    /**
     * Seed initial achievements into the database
     */
    public static function seedAchievements(): void
    {
        $achievements = [
            // Betting Activity
            [
                'key' => 'first_bet',
                'name' => 'First Steps',
                'description' => 'Place your first bet',
                'icon' => '🎯',
                'category' => 'betting',
                'type' => 'milestone',
                'target_value' => 1,
                'rarity' => 'common',
                'points' => 10,
            ],
            [
                'key' => 'betting_starter',
                'name' => 'Getting Started',
                'description' => 'Place 10 bets',
                'icon' => '🏁',
                'category' => 'betting',
                'type' => 'count',
                'target_value' => 10,
                'rarity' => 'common',
                'points' => 25,
            ],
            [
                'key' => 'betting_veteran',
                'name' => 'Veteran Bettor',
                'description' => 'Place 100 bets',
                'icon' => '🎖️',
                'category' => 'betting',
                'type' => 'count',
                'target_value' => 100,
                'rarity' => 'rare',
                'points' => 100,
            ],
            [
                'key' => 'betting_legend',
                'name' => 'Betting Legend',
                'description' => 'Place 1000 bets',
                'icon' => '👑',
                'category' => 'betting',
                'type' => 'count',
                'target_value' => 1000,
                'rarity' => 'legendary',
                'points' => 500,
            ],

            // Profit Achievements
            [
                'key' => 'first_win',
                'name' => 'First Victory',
                'description' => 'Win your first bet',
                'icon' => '🥇',
                'category' => 'profit',
                'type' => 'milestone',
                'target_value' => 1,
                'rarity' => 'common',
                'points' => 15,
            ],
            [
                'key' => 'profit_maker',
                'name' => 'Profit Maker',
                'description' => 'Earn €100 in net profit',
                'icon' => '💰',
                'category' => 'profit',
                'type' => 'amount',
                'target_value' => 100,
                'rarity' => 'rare',
                'points' => 75,
            ],
            [
                'key' => 'big_winner',
                'name' => 'Big Winner',
                'description' => 'Earn €500 in net profit',
                'icon' => '💎',
                'category' => 'profit',
                'type' => 'amount',
                'target_value' => 500,
                'rarity' => 'epic',
                'points' => 200,
            ],

            // Streak Achievements
            [
                'key' => 'winning_streak_3',
                'name' => 'Hot Streak',
                'description' => 'Win 3 bets in a row',
                'icon' => '🔥',
                'category' => 'streak',
                'type' => 'streak',
                'target_value' => 3,
                'rarity' => 'common',
                'points' => 30,
            ],
            [
                'key' => 'winning_streak_5',
                'name' => 'On Fire',
                'description' => 'Win 5 bets in a row',
                'icon' => '🌟',
                'category' => 'streak',
                'type' => 'streak',
                'target_value' => 5,
                'rarity' => 'rare',
                'points' => 75,
            ],
            [
                'key' => 'winning_streak_10',
                'name' => 'Unstoppable',
                'description' => 'Win 10 bets in a row',
                'icon' => '⚡',
                'category' => 'streak',
                'type' => 'streak',
                'target_value' => 10,
                'rarity' => 'legendary',
                'points' => 300,
            ],

            // Win Rate Achievements
            [
                'key' => 'good_predictor',
                'name' => 'Good Predictor',
                'description' => 'Achieve 60% win rate (minimum 20 bets)',
                'icon' => '🎲',
                'category' => 'milestone',
                'type' => 'percentage',
                'target_value' => 60,
                'rarity' => 'rare',
                'points' => 100,
            ],
            [
                'key' => 'prediction_master',
                'name' => 'Prediction Master',
                'description' => 'Achieve 75% win rate (minimum 50 bets)',
                'icon' => '🔮',
                'category' => 'milestone',
                'type' => 'percentage',
                'target_value' => 75,
                'rarity' => 'epic',
                'points' => 250,
            ],
        ];

        foreach ($achievements as $achievementData) {
            Achievement::updateOrCreate(
                ['key' => $achievementData['key']],
                $achievementData
            );
        }
    }
}