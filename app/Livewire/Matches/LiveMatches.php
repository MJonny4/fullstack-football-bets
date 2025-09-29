<?php

namespace App\Livewire\Matches;

use Livewire\Component;
use App\Models\FootballMatch;
use App\Models\Season;
use Carbon\Carbon;

class LiveMatches extends Component
{
    public $refreshInterval = 30; // Refresh every 30 seconds

    public function mount()
    {
        // Auto-refresh component
        $this->dispatch('refresh-component');
    }

    /**
     * Get all currently live matches.
     */
    public function getLiveMatches()
    {
        return FootballMatch::with(['homeTeam', 'awayTeam', 'gameweek'])
            ->where('status', 'live')
            ->orderBy('started_at')
            ->get()
            ->map(function ($match) {
                return $this->formatLiveMatch($match);
            });
    }

    /**
     * Get recently finished matches (last 2 hours).
     */
    public function getRecentlyFinished()
    {
        return FootballMatch::with(['homeTeam', 'awayTeam', 'gameweek'])
            ->where('status', 'finished')
            ->where('finished_at', '>=', now()->subHours(2))
            ->orderByDesc('finished_at')
            ->limit(5)
            ->get()
            ->map(function ($match) {
                return $this->formatFinishedMatch($match);
            });
    }

    /**
     * Get upcoming matches starting soon (next 30 minutes).
     */
    public function getUpcomingSoon()
    {
        return FootballMatch::with(['homeTeam', 'awayTeam', 'gameweek'])
            ->where('status', 'scheduled')
            ->where('kickoff_time', '<=', now()->addMinutes(30))
            ->where('kickoff_time', '>=', now())
            ->orderBy('kickoff_time')
            ->limit(3)
            ->get()
            ->map(function ($match) {
                return $this->formatUpcomingMatch($match);
            });
    }

    /**
     * Format live match data with current progress.
     */
    private function formatLiveMatch($match): array
    {
        $progress = $this->calculateMatchProgress($match);

        return [
            'id' => $match->id,
            'home_team' => $match->homeTeam->name,
            'away_team' => $match->awayTeam->name,
            'home_logo' => $match->homeTeam->logo_url,
            'away_logo' => $match->awayTeam->logo_url,
            'home_goals' => $match->home_goals ?? 0,
            'away_goals' => $match->away_goals ?? 0,
            'gameweek' => $match->gameweek->name,
            'started_at' => $match->started_at->setTimezone('Europe/Madrid'),
            'progress' => $progress,
            'events' => $this->formatMatchEvents($match->match_events ?? []),
            'attendance' => $match->attendance,
        ];
    }

    /**
     * Format finished match data.
     */
    private function formatFinishedMatch($match): array
    {
        return [
            'id' => $match->id,
            'home_team' => $match->homeTeam->name,
            'away_team' => $match->awayTeam->name,
            'home_logo' => $match->homeTeam->logo_url,
            'away_logo' => $match->awayTeam->logo_url,
            'home_goals' => $match->home_goals,
            'away_goals' => $match->away_goals,
            'gameweek' => $match->gameweek->name,
            'finished_at' => $match->finished_at->setTimezone('Europe/Madrid'),
            'result' => ucfirst($match->match_result),
            'events' => $this->formatMatchEvents($match->match_events ?? []),
            'attendance' => number_format($match->attendance),
        ];
    }

    /**
     * Format upcoming match data.
     */
    private function formatUpcomingMatch($match): array
    {
        return [
            'id' => $match->id,
            'home_team' => $match->homeTeam->name,
            'away_team' => $match->awayTeam->name,
            'home_logo' => $match->homeTeam->logo_url,
            'away_logo' => $match->awayTeam->logo_url,
            'gameweek' => $match->gameweek->name,
            'kickoff_time' => $match->kickoff_time->setTimezone('Europe/Madrid'),
            'minutes_until_kickoff' => $match->kickoff_time->diffInMinutes(now()),
        ];
    }

    /**
     * Calculate current match progress.
     */
    private function calculateMatchProgress($match): array
    {
        if (!$match->started_at) {
            return [
                'minute' => 0,
                'period' => 'Pre-Match',
                'status' => 'warming_up',
                'display' => 'Warming Up',
            ];
        }

        $elapsedMinutes = (int) $match->started_at->diffInMinutes(now());

        // First Half (0-45 minutes)
        if ($elapsedMinutes <= 45) {
            return [
                'minute' => $elapsedMinutes,
                'period' => 'First Half',
                'status' => 'first_half',
                'display' => "{$elapsedMinutes}' - First Half",
            ];
        }

        // Half Time (45-50 minutes)
        if ($elapsedMinutes <= 50) {
            return [
                'minute' => 45,
                'period' => 'Half Time',
                'status' => 'half_time',
                'display' => 'HT - Half Time',
            ];
        }

        // Second Half (50-90 minutes)
        if ($elapsedMinutes <= 90) {
            $secondHalfMinute = $elapsedMinutes - 5; // Account for 5-min break
            return [
                'minute' => $secondHalfMinute,
                'period' => 'Second Half',
                'status' => 'second_half',
                'display' => "{$secondHalfMinute}' - Second Half",
            ];
        }

        // Extra Time / Finishing
        return [
            'minute' => 90,
            'period' => 'Full Time',
            'status' => 'finishing',
            'display' => '90+' . ($elapsedMinutes - 90) . "' - Extra Time",
        ];
    }

    /**
     * Format match events for display.
     */
    private function formatMatchEvents($events): array
    {
        // Handle case where events might be stored as JSON string
        if (is_string($events)) {
            $events = json_decode($events, true) ?? [];
        }

        if (empty($events) || !is_array($events)) {
            return [];
        }

        // Sort by minute and limit to important events
        $importantEvents = array_filter($events, function ($event) {
            return in_array($event['type'], ['goal', 'red_card']);
        });

        usort($importantEvents, fn($a, $b) => $a['minute'] <=> $b['minute']);

        return array_map(function ($event) {
            return [
                'type' => $event['type'],
                'minute' => $event['minute'],
                'team' => $event['team'], // 'home' or 'away'
                'player' => $event['player'] ?? '',
                'icon' => $this->getEventIcon($event['type']),
            ];
        }, array_slice($importantEvents, 0, 10)); // Show max 10 events
    }

    /**
     * Get icon for event type.
     */
    private function getEventIcon(string $eventType): string
    {
        return match ($eventType) {
            'goal' => '⚽',
            'yellow_card' => '🟨',
            'red_card' => '🟥',
            'substitution' => '🔄',
            default => '📝',
        };
    }

    /**
     * Get match status counts.
     */
    public function getMatchCounts(): array
    {
        $season = Season::where('active', true)->first();

        if (!$season) {
            return ['live' => 0, 'scheduled' => 0, 'finished' => 0];
        }

        $baseQuery = FootballMatch::whereHas('gameweek', function ($q) use ($season) {
            $q->where('season_id', $season->id);
        });

        return [
            'live' => $baseQuery->clone()->where('status', 'live')->count(),
            'scheduled' => $baseQuery->clone()->where('status', 'scheduled')->count(),
            'finished' => $baseQuery->clone()->where('status', 'finished')->count(),
        ];
    }

    /**
     * Refresh the component data.
     */
    public function refreshData()
    {
        // This method can be called to refresh data
        $this->render();
    }

    public function render()
    {
        return view('livewire.matches.live-matches', [
            'liveMatches' => $this->getLiveMatches(),
            'recentlyFinished' => $this->getRecentlyFinished(),
            'upcomingSoon' => $this->getUpcomingSoon(),
            'matchCounts' => $this->getMatchCounts(),
        ])->layout('components.layouts.app', ['title' => 'Live Matches - GoalGuessers']);
    }
}