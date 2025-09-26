<?php

namespace App\Services;

use App\Models\LeagueTable;
use App\Models\Season;
use App\Models\Team;
use App\Models\FootballMatch;
use Illuminate\Support\Facades\DB;

class LeagueTableService
{
    public function initializeSeasonTable(Season $season): void
    {
        $teams = Team::all();

        foreach ($teams as $team) {
            LeagueTable::updateOrCreate(
                [
                    'season_id' => $season->id,
                    'team_id' => $team->id,
                ],
                [
                    'position' => 1,
                    'played' => 0,
                    'won' => 0,
                    'drawn' => 0,
                    'lost' => 0,
                    'goals_for' => 0,
                    'goals_against' => 0,
                    'goal_difference' => 0,
                    'points' => 0,
                    'form' => '',
                    'home_played' => 0,
                    'home_won' => 0,
                    'home_drawn' => 0,
                    'home_lost' => 0,
                    'home_goals_for' => 0,
                    'home_goals_against' => 0,
                    'away_played' => 0,
                    'away_won' => 0,
                    'away_drawn' => 0,
                    'away_lost' => 0,
                    'away_goals_for' => 0,
                    'away_goals_against' => 0,
                ]
            );
        }
    }

    public function updateTableAfterMatch(FootballMatch $match): void
    {
        if ($match->status !== 'finished' || is_null($match->home_goals) || is_null($match->away_goals)) {
            return;
        }

        $season = $match->gameweek->season;
        $homeTable = LeagueTable::where('season_id', $season->id)
            ->where('team_id', $match->home_team_id)
            ->first();

        $awayTable = LeagueTable::where('season_id', $season->id)
            ->where('team_id', $match->away_team_id)
            ->first();

        if (!$homeTable || !$awayTable) {
            return;
        }

        DB::transaction(function () use ($match, $homeTable, $awayTable) {
            $this->updateTeamStats($homeTable, $match, true);
            $this->updateTeamStats($awayTable, $match, false);
            $this->updatePositions($match->gameweek->season);
        });
    }

    private function updateTeamStats(LeagueTable $table, FootballMatch $match, bool $isHome): void
    {
        $isHome ? $this->updateHomeStats($table, $match) : $this->updateAwayStats($table, $match);

        $table->played++;
        $table->goals_for += $isHome ? $match->home_goals : $match->away_goals;
        $table->goals_against += $isHome ? $match->away_goals : $match->home_goals;
        $table->goal_difference = $table->goals_for - $table->goals_against;

        $result = $this->getMatchResult($match, $isHome);
        match ($result) {
            'W' => $table->won++,
            'D' => $table->drawn++,
            'L' => $table->lost++,
        };

        $table->points = ($table->won * 3) + ($table->drawn * 1);
        $table->form = $this->updateForm($table->form, $result);
        $table->save();
    }

    private function updateHomeStats(LeagueTable $table, FootballMatch $match): void
    {
        $table->home_played++;
        $table->home_goals_for += $match->home_goals;
        $table->home_goals_against += $match->away_goals;

        $result = $this->getMatchResult($match, true);
        match ($result) {
            'W' => $table->home_won++,
            'D' => $table->home_drawn++,
            'L' => $table->home_lost++,
        };
    }

    private function updateAwayStats(LeagueTable $table, FootballMatch $match): void
    {
        $table->away_played++;
        $table->away_goals_for += $match->away_goals;
        $table->away_goals_against += $match->home_goals;

        $result = $this->getMatchResult($match, false);
        match ($result) {
            'W' => $table->away_won++,
            'D' => $table->away_drawn++,
            'L' => $table->away_lost++,
        };
    }

    private function getMatchResult(FootballMatch $match, bool $isHome): string
    {
        $teamGoals = $isHome ? $match->home_goals : $match->away_goals;
        $opponentGoals = $isHome ? $match->away_goals : $match->home_goals;

        if ($teamGoals > $opponentGoals) {
            return 'W';
        } elseif ($teamGoals < $opponentGoals) {
            return 'L';
        } else {
            return 'D';
        }
    }

    private function updateForm(?string $currentForm, string $result): string
    {
        $form = $currentForm ?? '';
        $form .= $result;

        return substr($form, -5);
    }

    private function updatePositions(Season $season): void
    {
        $tables = LeagueTable::where('season_id', $season->id)
            ->orderByDesc('points')
            ->orderByDesc('goal_difference')
            ->orderByDesc('goals_for')
            ->orderBy('team_id')
            ->get();

        foreach ($tables as $index => $table) {
            $table->position = $index + 1;
            $table->save();
        }
    }

    public function getLeagueTable(Season $season)
    {
        return LeagueTable::bySeasonOrdered($season->id)->get();
    }

    public function getTopScorers(Season $season, int $limit = 10)
    {
        return LeagueTable::where('season_id', $season->id)
            ->orderByDesc('goals_for')
            ->with('team')
            ->limit($limit)
            ->get();
    }

    public function getFormTable(Season $season)
    {
        return LeagueTable::where('season_id', $season->id)
            ->whereNotNull('form')
            ->where('form', '!=', '')
            ->orderByRaw('
                (LENGTH(form) - LENGTH(REPLACE(form, "W", ""))) * 3 +
                (LENGTH(form) - LENGTH(REPLACE(form, "D", ""))) * 1
            ', 'DESC')
            ->with('team')
            ->get();
    }
}