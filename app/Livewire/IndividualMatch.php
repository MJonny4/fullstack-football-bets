<?php

namespace App\Livewire;

use Livewire\Component;
use App\Models\FootballMatch;
use Carbon\Carbon;

class IndividualMatch extends Component
{
    public $matchId;
    public $match;
    public $refreshInterval = 5; // Refresh every 5 seconds

    public function mount($matchId)
    {
        $this->matchId = $matchId;
        $this->loadMatch();
    }

    public function loadMatch()
    {
        $this->match = FootballMatch::with(['homeTeam', 'awayTeam', 'gameweek'])
            ->find($this->matchId);

        if (!$this->match) {
            abort(404, 'Match not found');
        }
    }

    /**
     * Get formatted match data for display
     */
    public function getMatchData(): array
    {
        if (!$this->match) {
            return [];
        }

        return [
            'id' => $this->match->id,
            'home_team' => $this->match->homeTeam->name,
            'away_team' => $this->match->awayTeam->name,
            'home_logo' => $this->match->homeTeam->logo_url,
            'away_logo' => $this->match->awayTeam->logo_url,
            'home_goals' => $this->match->home_goals ?? 0,
            'away_goals' => $this->match->away_goals ?? 0,
            'gameweek' => $this->match->gameweek->name,
            'status' => $this->match->status,
            'progress' => $this->getMatchProgress(),
            'events' => $this->getMatchEvents(),
            'kickoff_time' => $this->match->kickoff_time?->setTimezone('Europe/Madrid'),
            'started_at' => $this->match->started_at?->setTimezone('Europe/Madrid'),
            'finished_at' => $this->match->finished_at?->setTimezone('Europe/Madrid'),
        ];
    }

    /**
     * Get match progress information
     */
    private function getMatchProgress(): array
    {
        if ($this->match->status === 'scheduled') {
            return [
                'minute' => 0,
                'period' => 'Scheduled',
                'status' => 'scheduled',
                'display' => 'Kick-off: ' . $this->match->kickoff_time->setTimezone('Europe/Madrid')->format('H:i'),
            ];
        }

        if ($this->match->status === 'finished') {
            return [
                'minute' => $this->match->current_match_minute ?? 90,
                'period' => 'Finished',
                'status' => 'finished',
                'display' => 'Full Time',
            ];
        }

        if ($this->match->status === 'live') {
            $minute = $this->match->current_match_minute ?? 0;

            if ($minute <= 45) {
                return [
                    'minute' => $minute,
                    'period' => 'First Half',
                    'status' => 'first_half',
                    'display' => $minute . "' - First Half",
                ];
            } elseif ($minute == 45) {
                return [
                    'minute' => 45,
                    'period' => 'Half Time',
                    'status' => 'half_time',
                    'display' => 'HT - Half Time',
                ];
            } elseif ($minute <= 90) {
                return [
                    'minute' => $minute,
                    'period' => 'Second Half',
                    'status' => 'second_half',
                    'display' => $minute . "' - Second Half",
                ];
            } else {
                $extraTime = $minute - 90;
                return [
                    'minute' => $minute,
                    'period' => 'Extra Time',
                    'status' => 'extra_time',
                    'display' => "90+{$extraTime}' - Extra Time",
                ];
            }
        }

        return [
            'minute' => 0,
            'period' => 'Unknown',
            'status' => 'unknown',
            'display' => 'Unknown Status',
        ];
    }

    /**
     * Get match events for display
     */
    private function getMatchEvents(): array
    {
        $events = $this->match->match_events;

        if (!$events || !is_array($events)) {
            return [];
        }

        // Sort events by minute
        usort($events, fn($a, $b) => $a['minute'] <=> $b['minute']);

        return array_map(function ($event) {
            return [
                'type' => $event['type'],
                'minute' => $event['minute'],
                'team' => $event['team'],
                'player' => $event['player'] ?? '',
                'icon' => $this->getEventIcon($event['type']),
            ];
        }, $events);
    }

    /**
     * Get icon for event type
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
     * Refresh match data
     */
    public function refresh()
    {
        $this->loadMatch();
    }

    /**
     * Check if match is live
     */
    public function isLive(): bool
    {
        return $this->match && $this->match->status === 'live';
    }

    /**
     * Get page title
     */
    public function getTitle(): string
    {
        if (!$this->match) {
            return 'Match Not Found';
        }

        return $this->match->homeTeam->name . ' vs ' . $this->match->awayTeam->name;
    }

    public function render()
    {
        return view('livewire.individual-match', [
            'matchData' => $this->getMatchData(),
        ])->layout('components.layouts.app', ['title' => $this->getTitle()]);
    }
}