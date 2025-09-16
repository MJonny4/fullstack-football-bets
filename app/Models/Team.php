<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Team extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'teams';

    protected $fillable = [
        'name',
        'short_name',
        'logo_url',
        'country',
        'active'
    ];
    
    protected $casts = [
        'active' => 'boolean'
    ];
    
    /**
     * Get the team's logo URL with fallback to local storage
     */
    public function getLogoUrlAttribute($value): string
    {
        if ($value) {
            return $value;
        }

        // Fallback to local team images
        $teamSlug = $this->getTeamSlugForLogo();
        return "/images/teams/{$teamSlug}.png";
    }
    
    /**
     * Get the team slug for logo filename
     */
    private function getTeamSlugForLogo(): string
    {
        // Convert team name to slug format for local images
        $name = strtolower($this->name);

        // Handle special cases for invented teams
        $replacements = [
            'thunder wolves' => 'thunder-wolves',
            'steel lions' => 'steel-lions',
            'crimson eagles' => 'crimson-eagles',
            'azure knights' => 'azure-knights',
            'golden spartans' => 'golden-spartans',
            'shadow panthers' => 'shadow-panthers',
            'fire dragons' => 'fire-dragons',
            'ice titans' => 'ice-titans',
            'emerald falcons' => 'emerald-falcons',
            'violet vipers' => 'violet-vipers',
            'silver stallions' => 'silver-stallions',
            'copper cobras' => 'copper-cobras',
            'neon nighthawks' => 'neon-nighthawks',
            'royal raptors' => 'royal-raptors',
            'plasma phoenix' => 'plasma-phoenix',
            'quantum quakes' => 'quantum-quakes',
            'mystic meteors' => 'mystic-meteors',
            'rift runners' => 'rift-runners',
            'nova nomads' => 'nova-nomads',
            'zenith zephyrs' => 'zenith-zephyrs',
        ];

        if (isset($replacements[$name])) {
            return $replacements[$name];
        }

        // Default: replace spaces with hyphens
        return str_replace(' ', '-', $name);
    }
    
    /**
     * Check if team has a custom logo URL
     */
    public function hasCustomLogo(): bool
    {
        return !empty($this->attributes['logo_url']);
    }

    public function homeMatches()
    {
        return $this->hasMany(FootballMatch::class, 'home_team_id', '_id');
    }

    public function awayMatches()
    {
        return $this->hasMany(FootballMatch::class, 'away_team_id', '_id');
    }

    public function matches()
    {
        return $this->homeMatches()->union($this->awayMatches());
    }
}