<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Season extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'seasons';

    protected $fillable = [
        'name',
        'year', 
        'start_date',
        'end_date',
        'active'
    ];
    
    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'active' => 'boolean'
    ];
    
    public function gameweeks()
    {
        return $this->hasMany(Gameweek::class);
    }
    
    public function userStats()
    {
        return $this->hasMany(UserStats::class);
    }
}