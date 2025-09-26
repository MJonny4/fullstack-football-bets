<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Team extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'short_name',
        'logo_url',
        'active',
        'strength_rating',
    ];

    protected $casts = [
        'active' => 'boolean',
        'strength_rating' => 'decimal:2',
    ];

    /**
     * Get all home matches for this team.
     */
    public function homeMatches()
    {
        return $this->hasMany(FootballMatch::class, 'home_team_id');
    }

    /**
     * Get all away matches for this team.
     */
    public function awayMatches()
    {
        return $this->hasMany(FootballMatch::class, 'away_team_id');
    }

    /**
     * Get all matches (home and away) for this team.
     */
    public function matches()
    {
        return FootballMatch::where('home_team_id', $this->id)
            ->orWhere('away_team_id', $this->id);
    }

    /**
     * Get users who have this as their favorite team.
     */
    public function favoritedByUsers()
    {
        return $this->hasMany(User::class, 'favorite_team_id');
    }

    /**
     * Get the team's logo URL with fallback.
     */
    public function getLogoAttribute()
    {
        return $this->logo_url ?: '/images/teams/default.png';
    }

    /**
     * Scope to get only active teams.
     */
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }
}
