<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class UserStats extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'user_stats';

    protected $fillable = [
        'user_id',
        'season_id',
        'total_points',
        'correct_predictions',
        'total_predictions',
        'accuracy_percentage',
        'rank'
    ];
    
    protected $casts = [
        'total_points' => 'integer',
        'correct_predictions' => 'integer',
        'total_predictions' => 'integer',
        'accuracy_percentage' => 'decimal:2',
        'rank' => 'integer'
    ];
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    public function season()
    {
        return $this->belongsTo(Season::class);
    }

    /**
     * Update stats based on user's bets for the season
     */
    public function updateStats(): void
    {
        $bets = Bet::where('user_id', $this->user_id)
                   ->whereHas('match.gameweek', function ($query) {
                       $query->where('season_id', $this->season_id);
                   })
                   ->get();

        $this->total_predictions = $bets->count();
        $this->correct_predictions = $bets->where('is_correct', true)->count();
        $this->total_points = $bets->sum('points_awarded');
        $this->accuracy_percentage = $this->total_predictions > 0 
            ? ($this->correct_predictions / $this->total_predictions) * 100 
            : 0;

        $this->save();
    }
}