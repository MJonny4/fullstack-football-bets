<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class FootballMatch extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'matches';
    
    protected $fillable = [
        'gameweek_id',
        'home_team_id',
        'away_team_id',
        'kickoff_time',
        'home_score',
        'away_score',
        'status',
        'result'
    ];
    
    protected $casts = [
        'kickoff_time' => 'datetime',
        'home_score' => 'integer',
        'away_score' => 'integer'
    ];
    
    public function gameweek()
    {
        return $this->belongsTo(Gameweek::class);
    }
    
    public function homeTeam()
    {
        return $this->belongsTo(Team::class, 'home_team_id');
    }
    
    public function awayTeam()
    {
        return $this->belongsTo(Team::class, 'away_team_id');
    }
    
    public function bets()
    {
        return $this->hasMany(Bet::class, 'match_id');
    }

    /**
     * Get the match result (1/X/2 for Home/Draw/Away)
     */
    public function getResultAttribute(): ?string
    {
        if (is_null($this->home_score) || is_null($this->away_score)) {
            return null;
        }

        if ($this->home_score > $this->away_score) {
            return '1';
        } elseif ($this->home_score < $this->away_score) {
            return '2';
        } else {
            return 'X';
        }
    }

    /**
     * Check if the match has started
     */
    public function hasStarted(): bool
    {
        return $this->kickoff_time < now();
    }

    /**
     * Check if the match is finished
     */
    public function isFinished(): bool
    {
        return $this->status === 'finished';
    }
}