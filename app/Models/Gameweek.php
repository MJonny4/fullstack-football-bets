<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Gameweek extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'gameweeks';

    protected $fillable = [
        'season_id',
        'number',
        'name',
        'start_date',
        'end_date',
        'deadline_time',
        'active'
    ];
    
    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'deadline_time' => 'datetime',
        'active' => 'boolean'
    ];
    
    public function season()
    {
        return $this->belongsTo(Season::class);
    }
    
    public function matches()
    {
        return $this->hasMany(FootballMatch::class);
    }
    
    public function bets()
    {
        return $this->hasManyThrough(Bet::class, FootballMatch::class);
    }
}