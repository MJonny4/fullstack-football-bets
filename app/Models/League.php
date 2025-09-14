<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class League extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'leagues';

    protected $fillable = [
        'name',
        'description',
        'private',
        'created_by',
        'max_members',
        'active'
    ];
    
    protected $casts = [
        'private' => 'boolean',
        'active' => 'boolean',
        'max_members' => 'integer'
    ];
    
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    
    public function memberships()
    {
        return $this->hasMany(LeagueMembership::class);
    }
    
    public function members()
    {
        return $this->belongsToMany(User::class, 'league_memberships')
                    ->withPivot(['joined_at', 'role']);
    }
}