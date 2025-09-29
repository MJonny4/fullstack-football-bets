<?php

namespace App\Livewire\Account;

use Livewire\Component;
use App\Services\UserStatsService;
use App\Models\FootballMatch;
use App\Models\Season;
use App\Models\Gameweek;
use Carbon\Carbon;

class Dashboard extends Component
{
    public $user;
    public $stats;
    public $upcomingMatches;
    public $selectedPeriod = 'all'; // all, month, week

    public function mount()
    {
        $this->user = auth()->user();
        $this->loadDashboardData();
    }

    public function loadDashboardData()
    {
        // Get comprehensive user stats
        $statsService = new UserStatsService($this->user);
        $this->stats = $statsService->getCompleteStats();

        // Get upcoming matches for betting opportunities
        $this->upcomingMatches = $this->getUpcomingBettingOpportunities();
    }

    public function refreshStats()
    {
        // Clear cache and reload
        $statsService = new UserStatsService($this->user);
        $statsService->clearCache();
        $this->loadDashboardData();

        $this->dispatch('notify', [
            'type' => 'success',
            'message' => 'Dashboard refreshed successfully!'
        ]);
    }

    public function changePeriod($period)
    {
        $this->selectedPeriod = $period;
        // In a full implementation, this would filter stats by period
        // For now, we'll just update the UI state
    }

    private function getUpcomingBettingOpportunities()
    {
        $currentSeason = Season::where('active', true)->first();
        if (!$currentSeason) return collect();

        return FootballMatch::with(['homeTeam', 'awayTeam', 'gameweek'])
            ->whereHas('gameweek', function ($query) use ($currentSeason) {
                $query->where('season_id', $currentSeason->id);
            })
            ->where('status', 'scheduled')
            ->where('kickoff_time', '>', now())
            ->orderBy('kickoff_time')
            ->limit(6)
            ->get()
            ->map(function ($match) {
                $odds = $match->calculateDynamicOdds();
                return [
                    'id' => $match->id,
                    'home_team' => $match->homeTeam->name,
                    'away_team' => $match->awayTeam->name,
                    'home_logo' => asset('images/teams/' . \Illuminate\Support\Str::slug($match->homeTeam->name) . '.png'),
                    'away_logo' => asset('images/teams/' . \Illuminate\Support\Str::slug($match->awayTeam->name) . '.png'),
                    'kickoff_time' => $match->kickoff_time,
                    'formatted_time' => $match->getFormattedKickoffDate() . ' - ' . $match->getFormattedKickoffTime(),
                    'odds' => $odds,
                    'betting_available' => $match->isBettingAvailable(),
                    'gameweek' => $match->gameweek->name ?? 'Unknown',
                ];
            });
    }

    public function getKPICards()
    {
        $overview = $this->stats['overview'];

        return [
            [
                'title' => 'Current Balance',
                'value' => '€' . number_format($overview['current_balance'], 2),
                'change' => $overview['net_profit'],
                'change_label' => $overview['net_profit'] >= 0 ? 'Profit' : 'Loss',
                'icon' => '💰',
                'color' => $overview['net_profit'] >= 0 ? 'green' : 'red',
            ],
            [
                'title' => 'Win Rate',
                'value' => $overview['win_rate'] . '%',
                'change' => null,
                'change_label' => $overview['total_bets'] . ' total bets',
                'icon' => '🎯',
                'color' => $overview['win_rate'] >= 50 ? 'green' : 'orange',
            ],
            [
                'title' => 'Total Wagered',
                'value' => '€' . number_format($overview['total_wagered'], 2),
                'change' => $overview['average_bet'],
                'change_label' => 'Avg: €' . number_format($overview['average_bet'], 2),
                'icon' => '📊',
                'color' => 'blue',
            ],
            [
                'title' => 'ROI',
                'value' => $overview['roi'] . '%',
                'change' => null,
                'change_label' => 'Return on Investment',
                'icon' => '📈',
                'color' => $overview['roi'] >= 0 ? 'green' : 'red',
            ],
        ];
    }

    public function getRecentBetsForDisplay()
    {
        return collect($this->stats['recent_activity'])->take(5);
    }

    public function getTopTeamsForDisplay()
    {
        return collect($this->stats['favorite_teams'])->take(3);
    }

    public function getCurrentStreak()
    {
        $streak = $this->stats['betting_performance']['current_streak'] ?? 0;

        return [
            'value' => abs($streak),
            'type' => $streak > 0 ? 'winning' : ($streak < 0 ? 'losing' : 'none'),
            'display' => $streak > 0 ? $streak . ' win streak' : ($streak < 0 ? abs($streak) . ' loss streak' : 'No streak'),
            'color' => $streak > 0 ? 'green' : ($streak < 0 ? 'red' : 'gray'),
        ];
    }

    public function getBalanceChartData()
    {
        $history = $this->stats['balance_history'] ?? [];

        return [
            'labels' => array_column($history, 'date'),
            'data' => array_column($history, 'balance'),
            'changes' => array_column($history, 'change'),
        ];
    }

    public function getPeriodStats()
    {
        // This would filter stats by selected period
        // For now, return the overview stats
        return $this->stats['overview'];
    }

    public function render()
    {
        return view('livewire.account.dashboard', [
            'kpiCards' => $this->getKPICards(),
            'recentBets' => $this->getRecentBetsForDisplay(),
            'topTeams' => $this->getTopTeamsForDisplay(),
            'currentStreak' => $this->getCurrentStreak(),
            'balanceChart' => $this->getBalanceChartData(),
            'achievements' => $this->stats['achievements'] ?? [],
            'periodStats' => $this->getPeriodStats(),
        ])->layout('components.layouts.app', ['title' => 'Dashboard - GoalGuessers']);
    }
}
