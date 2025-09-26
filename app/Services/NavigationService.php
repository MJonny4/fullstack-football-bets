<?php

namespace App\Services;

use Carbon\Carbon;
use App\Models\Gameweek;
use App\Models\Season;

class NavigationService
{
    /**
     * Get complete navigation structure based on user state.
     */
    public static function getNavigationItems(?object $user = null): array
    {
        $isAuthenticated = !is_null($user);
        $currentTime = Carbon::now('Europe/Madrid');

        // Get current gameweek for time-based logic
        $currentGameweek = self::getCurrentGameweek();

        return [
            'public' => self::getPublicNavigation(),
            'authenticated' => $isAuthenticated ? self::getAuthenticatedNavigation($currentTime, $currentGameweek) : [],
            'conditional' => self::getConditionalNavigation($isAuthenticated, $currentTime, $currentGameweek),
            'user_info' => $isAuthenticated ? self::getUserInfo($user) : null,
        ];
    }

    /**
     * Public navigation items (always visible).
     */
    private static function getPublicNavigation(): array
    {
        return [
            [
                'name' => 'Home',
                'route' => 'home',
                'icon' => '🏠',
                'active_routes' => ['home'],
            ],
            [
                'name' => 'League Table',
                'route' => 'league-table',
                'icon' => '📊',
                'active_routes' => ['league-table'],
            ],
            [
                'name' => 'Fixtures & Results',
                'route' => 'fixtures-and-results',
                'icon' => '⚽',
                'active_routes' => ['fixtures-and-results', 'fixtures', 'results'],
            ],
            [
                'name' => 'About',
                'route' => 'about',
                'icon' => 'ℹ️',
                'active_routes' => ['about', 'rules'],
                'placeholder' => true,
            ],
        ];
    }

    /**
     * Authenticated user navigation items.
     */
    private static function getAuthenticatedNavigation(Carbon $currentTime, ?Gameweek $currentGameweek): array
    {
        $nav = [
            [
                'name' => 'My Dashboard',
                'route' => 'dashboard',
                'icon' => '📈',
                'active_routes' => ['dashboard'],
            ],
            [
                'name' => 'My Bets',
                'route' => 'betting-history',
                'icon' => '🎯',
                'active_routes' => ['my-bets', 'betting-history'],
            ],
            [
                'name' => 'Leaderboards',
                'route' => 'leaderboards',
                'icon' => '🏆',
                'active_routes' => ['leaderboards'],
                'placeholder' => true,
            ],
            [
                'name' => 'Profile',
                'route' => 'profile',
                'icon' => '👤',
                'active_routes' => ['profile', 'settings'],
                'placeholder' => true,
            ],
        ];

        // Add Place Bets if betting is open
        if (self::isBettingOpen($currentGameweek)) {
            array_splice($nav, 1, 0, [[
                'name' => 'Place Bets',
                'route' => 'place-bets',
                'icon' => '💰',
                'active_routes' => ['place-bets'],
                'placeholder' => true,
                'highlight' => true, // Special highlight for betting
            ]]);
        }

        return $nav;
    }

    /**
     * Conditional navigation based on time and context.
     */
    private static function getConditionalNavigation(bool $isAuthenticated, Carbon $currentTime, ?Gameweek $currentGameweek): array
    {
        $conditional = [];

        // Live Matches (only during match hours 13:00-23:00 Spanish time)
        if (self::isLiveMatchTime($currentTime)) {
            $conditional[] = [
                'name' => 'Live Matches',
                'route' => 'live-matches',
                'icon' => '🔴',
                'active_routes' => ['live-matches'],
                'badge' => 'LIVE',
                'badge_class' => 'bg-red-500 text-white animate-pulse',
            ];
        }

        // Social features (placeholder for future)
        if ($isAuthenticated) {
            $conditional[] = [
                'name' => 'Social',
                'route' => 'social',
                'icon' => '👥',
                'active_routes' => ['social', 'friends'],
                'placeholder' => true,
                'coming_soon' => true,
            ];
        }

        return $conditional;
    }

    /**
     * Get user information for display.
     */
    private static function getUserInfo(object $user): array
    {
        return [
            'name' => $user->name,
            'balance' => $user->virtual_balance ?? 0,
            'avatar' => null, // Placeholder for future avatar system
        ];
    }

    /**
     * Check if betting is currently open.
     */
    private static function isBettingOpen(?Gameweek $gameweek): bool
    {
        if (!$gameweek) {
            return false;
        }

        return $gameweek->isBettingOpen();
    }

    /**
     * Check if it's live match time (13:00-23:00 Spanish time).
     */
    private static function isLiveMatchTime(Carbon $time): bool
    {
        $hour = $time->hour;
        return $hour >= 13 && $hour <= 23;
    }

    /**
     * Get current active gameweek.
     */
    private static function getCurrentGameweek(): ?Gameweek
    {
        $season = Season::where('active', true)->first();
        return $season?->gameweeks()->where('active', true)->first();
    }

    /**
     * Get navigation state for current route.
     */
    public static function getNavigationState(string $currentRoute): array
    {
        $navigation = self::getNavigationItems(auth()->user());

        return [
            'current_route' => $currentRoute,
            'navigation' => $navigation,
            'betting_status' => self::getBettingStatus(),
            'time_info' => self::getTimeInfo(),
        ];
    }

    /**
     * Get betting status information.
     */
    private static function getBettingStatus(): array
    {
        $gameweek = self::getCurrentGameweek();

        return [
            'is_open' => self::isBettingOpen($gameweek),
            'deadline' => $gameweek?->betting_deadline?->setTimezone('Europe/Madrid'),
            'message' => self::getBettingStatusMessage($gameweek),
        ];
    }

    /**
     * Get betting status message.
     */
    private static function getBettingStatusMessage(?Gameweek $gameweek): string
    {
        if (!$gameweek) {
            return 'No active gameweek';
        }

        if ($gameweek->isBettingOpen()) {
            $timeLeft = $gameweek->getTimeUntilBettingCloses();
            return "Betting closes {$timeLeft}";
        }

        return 'Betting closed for this gameweek';
    }

    /**
     * Get current time information.
     */
    private static function getTimeInfo(): array
    {
        $now = Carbon::now('Europe/Madrid');

        return [
            'current_time' => $now,
            'is_match_time' => self::isLiveMatchTime($now),
            'next_match_time' => self::getNextMatchTime($now),
        ];
    }

    /**
     * Get next match time.
     */
    private static function getNextMatchTime(Carbon $currentTime): ?Carbon
    {
        if (self::isLiveMatchTime($currentTime)) {
            return null; // Already in match time
        }

        // If before 13:00, next match time is today at 13:00
        if ($currentTime->hour < 13) {
            return $currentTime->copy()->setTime(13, 0, 0);
        }

        // If after 23:00, next match time is tomorrow at 13:00
        return $currentTime->copy()->addDay()->setTime(13, 0, 0);
    }
}