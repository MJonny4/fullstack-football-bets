<?php

namespace App\Livewire;

use App\Models\Season;
use App\Models\Gameweek;
use App\Models\FootballMatch;
use App\Models\Team;
use App\Models\Bet;
use App\Models\User;
use App\Services\UserStatsService;
use Livewire\Component;
use Carbon\Carbon;

class Home extends Component
{
    public $virtualMoney = 0;
    public $currentGameweek = null;
    public $currentSeason = null;

    public function mount()
    {
        // Set virtual money based on auth status
        $this->virtualMoney = auth()->check() ? auth()->user()->virtual_balance : 0;

        // Get current season and gameweek
        $this->currentSeason = Season::active()->first();
        $this->currentGameweek = $this->currentSeason?->currentGameweek;
    }

    public function getUpcomingMatches()
    {
        if (!$this->currentGameweek) {
            return collect();
        }

        return FootballMatch::with(['homeTeam', 'awayTeam', 'gameweek'])
            ->where('gameweek_id', $this->currentGameweek->id)
            ->upcoming()
            ->orderBy('kickoff_time')
            ->limit(10) // Show all 10 matches per gameweek
            ->get()
            ->map(function ($match) {
                $odds = $match->calculateDynamicOdds();

                return [
                    'id' => $match->id,
                    'home_team' => $match->homeTeam->name,
                    'away_team' => $match->awayTeam->name,
                    'home_logo' => $match->homeTeam->logo_url,
                    'away_logo' => $match->awayTeam->logo_url,
                    'match_time' => $match->getFormattedKickoffDate() . ' - ' . $match->getFormattedKickoffTime(),
                    'home_odds' => $odds['home_odds'],
                    'draw_odds' => $odds['draw_odds'],
                    'away_odds' => $odds['away_odds'],
                    'betting_available' => $match->isBettingAvailable(),
                    'time_until_kickoff' => $match->getTimeUntilKickoff(),
                    'match_day' => $match->getMatchDay(),
                ];
            });
    }

    public function getCurrentGameweekInfo()
    {
        if (!$this->currentGameweek) {
            return [
                'number' => 'N/A',
                'name' => 'No active gameweek',
                'betting_deadline' => null,
                'betting_open' => false,
                'time_until_deadline' => null,
            ];
        }

        return [
            'number' => $this->currentGameweek->number,
            'name' => $this->currentGameweek->name,
            'betting_deadline' => $this->currentGameweek->betting_deadline->setTimezone('Europe/Madrid')->format('M d, Y - H:i'),
            'betting_open' => $this->currentGameweek->isBettingOpen(),
            'time_until_deadline' => $this->currentGameweek->getTimeUntilBettingCloses(),
        ];
    }

    public function getLeagueStats()
    {
        $activeTeams = Team::active()->count();
        $totalMatches = FootballMatch::count();
        $upcomingMatches = FootballMatch::upcoming()->count();
        $liveMatches = FootballMatch::where('status', 'live')->count();

        return [
            'active_teams' => $activeTeams,
            'total_matches' => $totalMatches,
            'upcoming_matches' => $upcomingMatches,
            'live_matches' => $liveMatches,
            'current_season' => $this->currentSeason?->name ?? 'No active season',
        ];
    }

    public function getLiveMatches()
    {
        return FootballMatch::with(['homeTeam', 'awayTeam', 'gameweek'])
            ->where('status', 'live')
            ->orderBy('started_at')
            ->limit(3)
            ->get()
            ->map(function ($match) {
                $elapsedMinutes = $match->started_at ? $match->started_at->diffInMinutes(now()) : 0;

                return [
                    'id' => $match->id,
                    'home_team' => $match->homeTeam->name,
                    'away_team' => $match->awayTeam->name,
                    'home_logo' => $match->homeTeam->logo_url,
                    'away_logo' => $match->awayTeam->logo_url,
                    'home_goals' => $match->home_goals ?? 0,
                    'away_goals' => $match->away_goals ?? 0,
                    'gameweek' => $match->gameweek->name,
                    'minute' => $elapsedMinutes,
                    'period' => $this->getMatchPeriod($elapsedMinutes),
                ];
            });
    }

    private function getMatchPeriod($minutes)
    {
        if ($minutes <= 45) return "{$minutes}' - 1st Half";
        if ($minutes <= 50) return "HT - Half Time";
        if ($minutes <= 90) return ($minutes - 5) . "' - 2nd Half";
        return "90+' - Extra Time";
    }

    private function getTeamLogo(string $shortName): string
    {
        // Map team short names to emojis for now
        $logoMap = [
            'AZK' => '⚔️', 'CPC' => '🐍', 'CRE' => '🦅', 'EMF' => '🦅', 'FDR' => '🐲',
            'GSP' => '🏛️', 'ICT' => '🧊', 'MYM' => '☄️', 'NNH' => '🦅', 'NON' => '🌟',
            'PPH' => '🔥', 'QQU' => '⚡', 'RFR' => '🏃', 'RRP' => '👑', 'SHP' => '🐾',
            'SST' => '🐴', 'STL' => '🦁', 'TWV' => '⚡', 'VVP' => '🐍', 'ZZE' => '💨'
        ];

        return $logoMap[$shortName] ?? '⚽';
    }

    public function getUserStats()
    {
        if (!auth()->check()) {
            return [
                'total_bets' => 0,
                'win_rate' => 0,
                'net_profit' => 0,
                'recent_activity' => [],
            ];
        }

        $statsService = new UserStatsService(auth()->user());
        $stats = $statsService->getOverviewStats();
        $recentActivity = $statsService->getRecentActivity();

        return [
            'total_bets' => $stats['total_bets'],
            'win_rate' => $stats['win_rate'],
            'net_profit' => $stats['net_profit'],
            'recent_activity' => array_slice($recentActivity, 0, 3), // Show only 3 recent activities
        ];
    }

    public function formatCurrency($amount)
    {
        return '€' . number_format($amount, 2);
    }

    public function openBetModal($matchId, $betType, $odds)
    {
        // Check if user is authenticated
        if (!auth()->check()) {
            session()->flash('error', 'Please login or register to place bets.');
            return;
        }

        // Dispatch event to open the bet modal
        $this->dispatch('openBetModal', [
            'matchId' => $matchId,
            'betType' => $betType,
            'odds' => $odds
        ]);
    }

    /**
     * Handle bet placement completion from modal
     */
    public function handleBetPlaced($data)
    {
        // Update the virtual money display with new balance
        $this->virtualMoney = $data['newBalance'];
    }

    public function render()
    {
        return view('livewire.home', [
            'upcomingMatches' => $this->getUpcomingMatches(),
            'gameweekInfo' => $this->getCurrentGameweekInfo(),
            'leagueStats' => $this->getLeagueStats(),
            'userStats' => $this->getUserStats(),
            'liveMatches' => $this->getLiveMatches(),
        ])->layout('components.layouts.app', ['title' => 'GoalGuessers - Virtual Football Betting']);
    }
}
