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
     * Main navigation structure (always visible).
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
                'name' => 'Matches',
                'icon' => '⚽',
                'dropdown' => true,
                'active_routes' => ['fixtures-and-results', 'fixtures', 'results', 'live-matches', 'individual-match'],
                'items' => [
                    [
                        'name' => 'Fixtures & Results',
                        'route' => 'fixtures-and-results',
                        'icon' => '📅',
                        'active_routes' => ['fixtures-and-results', 'fixtures', 'results'],
                    ],
                    [
                        'name' => 'Live Matches',
                        'route' => 'live-matches',
                        'icon' => '🔴',
                        'active_routes' => ['live-matches'],
                        'show_when_live' => true,
                    ],
                ],
            ],
            [
                'name' => 'League',
                'icon' => '🏆',
                'dropdown' => true,
                'active_routes' => ['league-table', 'leaderboards'],
                'items' => [
                    [
                        'name' => 'League Table',
                        'route' => 'league-table',
                        'icon' => '📊',
                        'active_routes' => ['league-table'],
                    ],
                    [
                        'name' => 'Leaderboards',
                        'route' => 'leaderboards',
                        'icon' => '🏅',
                        'active_routes' => ['leaderboards'],
                        'auth_required' => true,
                    ],
                ],
            ],
            [
                'name' => 'About',
                'route' => 'about',
                'icon' => 'ℹ️',
                'active_routes' => ['about'],
            ],
        ];
    }

    /**
     * User account dropdown items.
     */
    private static function getAuthenticatedNavigation(Carbon $currentTime, ?Gameweek $currentGameweek): array
    {
        return [
            [
                'name' => 'My Account',
                'icon' => '👤',
                'dropdown' => true,
                'user_dropdown' => true,
                'active_routes' => ['dashboard', 'transaction-history', 'betting-history', 'profile'],
                'items' => [
                    [
                        'name' => 'Dashboard',
                        'route' => 'dashboard',
                        'icon' => '📈',
                        'active_routes' => ['dashboard'],
                    ],
                    [
                        'name' => 'Betting & Transactions',
                        'route' => 'transaction-history',
                        'icon' => '💰',
                        'active_routes' => ['my-bets', 'betting-history', 'transaction-history', 'transactions'],
                    ],
                    [
                        'name' => 'Profile Settings',
                        'route' => 'profile',
                        'icon' => '⚙️',
                        'active_routes' => ['profile', 'settings'],
                    ],
                    'separator',
                    [
                        'name' => 'Logout',
                        'route' => 'logout',
                        'icon' => '🚪',
                        'is_logout' => true,
                        'method' => 'POST',
                    ],
                ],
            ],
        ];
    }

    /**
     * Conditional navigation based on time and context.
     */
    private static function getConditionalNavigation(bool $isAuthenticated, Carbon $currentTime, ?Gameweek $currentGameweek): array
    {
        // Live match status is now handled within the Matches dropdown
        // Social features planned for future implementation - see TODO.md Section 6
        return [];
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