<?php

namespace App\Livewire\League;

use Livewire\Component;
use App\Models\Season;
use App\Models\LeagueTable as LeagueTableModel;
use App\Services\LeagueTableService;

class LeagueTable extends Component
{
    public $season;
    public $selectedView = 'full'; // full, home, away, form

    public function mount()
    {
        $this->season = Season::where('active', true)->first();

        // Initialize league table if it doesn't exist
        if ($this->season) {
            $leagueService = new LeagueTableService();
            $existingEntries = LeagueTableModel::where('season_id', $this->season->id)->count();

            if ($existingEntries === 0) {
                $leagueService->initializeSeasonTable($this->season);
            }
        }
    }

    public function setView($view)
    {
        $this->selectedView = $view;
    }

    public function getTableData()
    {
        if (!$this->season) {
            return collect();
        }

        $data = match ($this->selectedView) {
            'home' => $this->getHomeTable(),
            'away' => $this->getAwayTable(),
            'form' => $this->getFormTable(),
            default => $this->getFullTable(),
        };

        // Add consistent position numbers based on overall points
        return $this->addConsistentPositions($data);
    }

    private function addConsistentPositions($teams)
    {
        // Get the full table ordered by points for consistent positioning
        $fullTable = $this->getFullTable();
        $positionMap = [];

        foreach ($fullTable as $index => $team) {
            $positionMap[$team->team_id] = $index + 1;
        }

        // Add the consistent position to each team
        return $teams->map(function ($team) use ($positionMap) {
            $team->consistent_position = $positionMap[$team->team_id] ?? 1;
            return $team;
        });
    }

    private function getFullTable()
    {
        return LeagueTableModel::where('season_id', $this->season->id)
            ->orderBy('position')
            ->with('team')
            ->get();
    }

    private function getHomeTable()
    {
        return LeagueTableModel::where('season_id', $this->season->id)
            ->orderByRaw('(home_won * 3 + home_drawn * 1) DESC')
            ->orderByRaw('(home_goals_for - home_goals_against) DESC')
            ->orderByDesc('home_goals_for')
            ->with('team')
            ->get()
            ->map(function ($team, $index) {
                $team->temp_position = $index + 1;
                $team->temp_points = ($team->home_won * 3) + ($team->home_drawn * 1);
                $team->temp_goal_difference = $team->home_goals_for - $team->home_goals_against;
                return $team;
            });
    }

    private function getAwayTable()
    {
        return LeagueTableModel::where('season_id', $this->season->id)
            ->orderByRaw('(away_won * 3 + away_drawn * 1) DESC')
            ->orderByRaw('(away_goals_for - away_goals_against) DESC')
            ->orderByDesc('away_goals_for')
            ->with('team')
            ->get()
            ->map(function ($team, $index) {
                $team->temp_position = $index + 1;
                $team->temp_points = ($team->away_won * 3) + ($team->away_drawn * 1);
                $team->temp_goal_difference = $team->away_goals_for - $team->away_goals_against;
                return $team;
            });
    }

    private function getFormTable()
    {
        $leagueService = new LeagueTableService();
        return $leagueService->getFormTable($this->season)
            ->map(function ($team, $index) {
                $team->temp_position = $index + 1;
                return $team;
            });
    }

    public function getTopScorers()
    {
        if (!$this->season) {
            return collect();
        }

        $leagueService = new LeagueTableService();
        return $leagueService->getTopScorers($this->season, 5);
    }

    // Helper methods for different view types
    public function getPlayed($team)
    {
        return match ($this->selectedView) {
            'home' => $team->home_played,
            'away' => $team->away_played,
            default => $team->played,
        };
    }

    public function getWon($team)
    {
        return match ($this->selectedView) {
            'home' => $team->home_won,
            'away' => $team->away_won,
            default => $team->won,
        };
    }

    public function getDrawn($team)
    {
        return match ($this->selectedView) {
            'home' => $team->home_drawn,
            'away' => $team->away_drawn,
            default => $team->drawn,
        };
    }

    public function getLost($team)
    {
        return match ($this->selectedView) {
            'home' => $team->home_lost,
            'away' => $team->away_lost,
            default => $team->lost,
        };
    }

    public function getGoalsFor($team)
    {
        return match ($this->selectedView) {
            'home' => $team->home_goals_for,
            'away' => $team->away_goals_for,
            default => $team->goals_for,
        };
    }

    public function getGoalsAgainst($team)
    {
        return match ($this->selectedView) {
            'home' => $team->home_goals_against,
            'away' => $team->away_goals_against,
            default => $team->goals_against,
        };
    }

    public function getGoalDifference($team)
    {
        return match ($this->selectedView) {
            'home' => $team->temp_goal_difference ?? ($team->home_goals_for - $team->home_goals_against),
            'away' => $team->temp_goal_difference ?? ($team->away_goals_for - $team->away_goals_against),
            default => $team->goal_difference,
        };
    }

    public function getPoints($team)
    {
        return match ($this->selectedView) {
            'home' => $team->temp_points ?? (($team->home_won * 3) + ($team->home_drawn * 1)),
            'away' => $team->temp_points ?? (($team->away_won * 3) + ($team->away_drawn * 1)),
            default => $team->points,
        };
    }

    public function getPositionIndicatorClass($position)
    {
        return match (true) {
            $position <= 4 => 'bg-blue-400', // Champions League
            $position <= 6 => 'bg-orange-400', // Europa League
            $position >= 18 => 'bg-red-400', // Relegation
            default => 'bg-gray-300',
        };
    }

    public function getGoalDifferenceClass($goalDifference)
    {
        if ($goalDifference > 0) {
            return 'text-green-600';
        } elseif ($goalDifference < 0) {
            return 'text-red-600';
        } else {
            return 'text-gray-600';
        }
    }

    public function getFormDisplay(?string $form)
    {
        if (!$form) {
            return '<span class="text-gray-400 text-xs">-</span>';
        }

        $formArray = str_split($form);
        $html = '';

        foreach ($formArray as $result) {
            $color = match ($result) {
                'W' => 'bg-green-500',
                'D' => 'bg-yellow-500',
                'L' => 'bg-red-500',
                default => 'bg-gray-400'
            };
            $html .= "<span class='inline-block w-2 h-2 rounded-full {$color}'></span>";
        }

        return $html;
    }

    public function getSeasonProgress()
    {
        if (!$this->season) {
            return [
                'current_gameweek' => 1,
                'total_gameweeks' => 38,
                'progress_percentage' => 0
            ];
        }

        $currentGameweek = $this->season->gameweeks()
            ->where('active', true)
            ->first();

        $totalGameweeks = $this->season->gameweeks()->count();
        $currentNumber = $currentGameweek?->number ?? 1;

        return [
            'current_gameweek' => $currentNumber,
            'total_gameweeks' => $totalGameweeks,
            'progress_percentage' => round(($currentNumber / $totalGameweeks) * 100, 1)
        ];
    }

    public function render()
    {
        return view('livewire.league.league-table', [
            'standings' => $this->getTableData(),
            'topScorers' => $this->getTopScorers(),
            'seasonName' => $this->season?->name ?? 'No Active Season',
            'seasonProgress' => $this->getSeasonProgress(),
        ])->layout('components.layouts.app', ['title' => 'League Table - GoalGuessers']);
    }
}
