<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Bet extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'bets';

    protected $fillable = [
        'user_id',
        'match_id',
        'prediction',
        'points_awarded',
        'is_correct'
    ];
    
    protected $casts = [
        'is_correct' => 'boolean',
        'points_awarded' => 'integer'
    ];
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    public function match()
    {
        return $this->belongsTo(FootballMatch::class, 'match_id');
    }

    /**
     * Calculate points based on prediction and match result
     */
    public function calculatePoints(): int
    {
        $match = $this->match;
        
        if (!$match->isFinished()) {
            return 0;
        }

        $actualResult = $match->result;
        
        if ($this->prediction === $actualResult) {
            $this->is_correct = true;
            $this->points_awarded = 3; // 3 points for correct prediction
            $this->save();
            return 3;
        }

        $this->is_correct = false;
        $this->points_awarded = 0;
        $this->save();
        return 0;
    }
}