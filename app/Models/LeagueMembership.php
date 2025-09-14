<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class LeagueMembership extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'league_memberships';

    protected $fillable = [
        'user_id',
        'league_id',
        'role',
        'joined_at'
    ];
    
    protected $casts = [
        'joined_at' => 'datetime'
    ];
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    public function league()
    {
        return $this->belongsTo(League::class);
    }
}