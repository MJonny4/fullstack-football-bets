<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeagueTable extends Model
{
    protected $fillable = [
        'season_id',
        'team_id',
        'position',
        'played',
        'won',
        'drawn',
        'lost',
        'goals_for',
        'goals_against',
        'goal_difference',
        'points',
        'form',
        'home_played',
        'home_won',
        'home_drawn',
        'home_lost',
        'home_goals_for',
        'home_goals_against',
        'away_played',
        'away_won',
        'away_drawn',
        'away_lost',
        'away_goals_for',
        'away_goals_against',
    ];

    protected $casts = [
        'position' => 'integer',
        'played' => 'integer',
        'won' => 'integer',
        'drawn' => 'integer',
        'lost' => 'integer',
        'goals_for' => 'integer',
        'goals_against' => 'integer',
        'goal_difference' => 'integer',
        'points' => 'integer',
    ];

    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function updateGoalDifference(): void
    {
        $this->goal_difference = $this->goals_for - $this->goals_against;
        $this->save();
    }

    public function getFormDisplayAttribute(): string
    {
        if (!$this->form) {
            return '';
        }

        $formArray = str_split($this->form);
        $html = '';

        foreach ($formArray as $result) {
            $color = match ($result) {
                'W' => 'bg-green-500',
                'D' => 'bg-yellow-500',
                'L' => 'bg-red-500',
                default => 'bg-gray-400'
            };
            $html .= "<span class='inline-block w-4 h-4 rounded-full {$color} mr-1'></span>";
        }

        return $html;
    }

    public function scopeBySeasonOrdered($query, $seasonId)
    {
        return $query->where('season_id', $seasonId)
                    ->orderBy('position')
                    ->with('team');
    }

    public function getPositionColorClass(): string
    {
        return match (true) {
            $this->position <= 4 => 'text-blue-600 font-bold', // Champions League
            $this->position <= 6 => 'text-orange-600 font-semibold', // Europa League
            $this->position >= 18 => 'text-red-600 font-bold', // Relegation
            default => 'text-gray-800'
        };
    }
}
