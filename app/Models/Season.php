<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Carbon\Carbon;

class Season extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'year',
        'start_date',
        'end_date',
        'active',
        'total_gameweeks',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'active' => 'boolean',
        'year' => 'integer',
        'total_gameweeks' => 'integer',
    ];

    /**
     * Get all gameweeks for this season.
     */
    public function gameweeks()
    {
        return $this->hasMany(Gameweek::class)->orderBy('number');
    }

    /**
     * Get the current active gameweek for this season.
     */
    public function currentGameweek()
    {
        return $this->hasOne(Gameweek::class)->where('active', true);
    }

    /**
     * Get all matches for this season through gameweeks.
     */
    public function matches()
    {
        return $this->hasManyThrough(FootballMatch::class, Gameweek::class);
    }

    /**
     * Scope to get only the active season.
     */
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    /**
     * Check if the season is currently in progress.
     */
    public function isInProgress(): bool
    {
        $now = Carbon::now();
        return $now->between($this->start_date, $this->end_date) && $this->active;
    }

    /**
     * Get the season progress percentage.
     */
    public function getProgressPercentage(): float
    {
        if (!$this->isInProgress()) {
            return $this->start_date->isFuture() ? 0.0 : 100.0;
        }

        $totalDays = $this->start_date->diffInDays($this->end_date);
        $elapsedDays = $this->start_date->diffInDays(Carbon::now());

        return round(($elapsedDays / $totalDays) * 100, 2);
    }

    /**
     * Get the next gameweek.
     */
    public function nextGameweek()
    {
        return $this->gameweeks()
            ->where('first_match_date', '>', Carbon::now())
            ->orderBy('number')
            ->first();
    }

    /**
     * Get completed gameweeks.
     */
    public function completedGameweeks()
    {
        return $this->gameweeks()->where('results_finalized', true);
    }
}
