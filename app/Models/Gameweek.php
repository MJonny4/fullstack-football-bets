<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Carbon\Carbon;

class Gameweek extends Model
{
    use HasFactory;

    protected $fillable = [
        'season_id',
        'number',
        'name',
        'betting_deadline',
        'first_match_date',
        'active',
        'results_finalized',
    ];

    protected $casts = [
        'betting_deadline' => 'datetime',
        'first_match_date' => 'datetime',
        'active' => 'boolean',
        'results_finalized' => 'boolean',
        'number' => 'integer',
    ];

    /**
     * Get the season this gameweek belongs to.
     */
    public function season()
    {
        return $this->belongsTo(Season::class);
    }

    /**
     * Get all matches for this gameweek.
     */
    public function matches()
    {
        return $this->hasMany(FootballMatch::class)->orderBy('kickoff_time');
    }

    /**
     * Get upcoming matches for this gameweek.
     */
    public function upcomingMatches()
    {
        return $this->matches()
            ->where('status', 'scheduled')
            ->where('kickoff_time', '>', Carbon::now());
    }

    /**
     * Get finished matches for this gameweek.
     */
    public function finishedMatches()
    {
        return $this->matches()->where('status', 'finished');
    }

    /**
     * Get live matches for this gameweek.
     */
    public function liveMatches()
    {
        return $this->matches()->where('status', 'live');
    }

    /**
     * Check if betting is currently open for this gameweek.
     */
    public function isBettingOpen(): bool
    {
        return Carbon::now()->isBefore($this->betting_deadline) && $this->active;
    }

    /**
     * Check if this gameweek is in the past.
     */
    public function isPast(): bool
    {
        return $this->first_match_date->isPast() && $this->results_finalized;
    }

    /**
     * Check if this gameweek is currently live.
     */
    public function isLive(): bool
    {
        $now = Carbon::now();
        $lastMatchTime = $this->matches()->max('kickoff_time');

        return $now->isAfter($this->first_match_date) &&
               $now->isBefore(Carbon::parse($lastMatchTime)->addHours(2)) &&
               !$this->results_finalized;
    }

    /**
     * Get the time remaining until betting closes.
     */
    public function getTimeUntilBettingCloses(): ?string
    {
        if (!$this->isBettingOpen()) {
            return null;
        }

        return Carbon::now()->diffForHumans($this->betting_deadline, true);
    }

    /**
     * Get matches grouped by day.
     */
    public function getMatchesByDay()
    {
        return $this->matches()
            ->get()
            ->groupBy(function ($match) {
                return $match->kickoff_time->format('Y-m-d');
            });
    }

    /**
     * Scope to get active gameweeks.
     */
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    /**
     * Scope to get current gameweeks (betting open or live).
     */
    public function scopeCurrent($query)
    {
        $now = Carbon::now();
        return $query->where(function ($q) use ($now) {
            $q->where('betting_deadline', '>', $now)
              ->orWhere(function ($q2) use ($now) {
                  $q2->where('first_match_date', '<=', $now)
                     ->where('results_finalized', false);
              });
        });
    }
}
