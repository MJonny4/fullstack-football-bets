<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Carbon\Carbon;
use App\Services\LeagueTableService;

class FootballMatch extends Model
{
    use HasFactory;

    protected $table = 'matches';

    protected $fillable = [
        'gameweek_id',
        'home_team_id',
        'away_team_id',
        'kickoff_time',
        'status',
        'home_goals',
        'away_goals',
        'match_result',
        'match_events',
        'match_stats',
        'started_at',
        'finished_at',
        'attendance',
        'referee',
        'simulation_started_at',
        'current_match_minute',
        'simulation_status',
        'next_event_check',
    ];

    protected $casts = [
        'kickoff_time' => 'datetime',
        'home_goals' => 'integer',
        'away_goals' => 'integer',
        'match_events' => 'array',
        'match_stats' => 'array',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
        'attendance' => 'integer',
        'simulation_started_at' => 'datetime',
        'current_match_minute' => 'integer',
        'next_event_check' => 'datetime',
    ];

    /**
     * Match status constants.
     */
    public const STATUS_SCHEDULED = 'scheduled';
    public const STATUS_LIVE = 'live';
    public const STATUS_FINISHED = 'finished';
    public const STATUS_POSTPONED = 'postponed';

    /**
     * Get the gameweek this match belongs to.
     */
    public function gameweek()
    {
        return $this->belongsTo(Gameweek::class);
    }

    /**
     * Get the home team.
     */
    public function homeTeam()
    {
        return $this->belongsTo(Team::class, 'home_team_id');
    }

    /**
     * Get the away team.
     */
    public function awayTeam()
    {
        return $this->belongsTo(Team::class, 'away_team_id');
    }

    /**
     * Get all bets placed on this match.
     */
    public function bets()
    {
        return $this->hasMany(Bet::class, 'match_id');
    }

    /**
     * Check if the match is scheduled.
     */
    public function isScheduled(): bool
    {
        return $this->status === self::STATUS_SCHEDULED;
    }

    /**
     * Check if the match is currently live.
     */
    public function isLive(): bool
    {
        return $this->status === self::STATUS_LIVE;
    }

    /**
     * Check if the match is finished.
     */
    public function isFinished(): bool
    {
        return $this->status === self::STATUS_FINISHED;
    }

    /**
     * Check if the match is postponed.
     */
    public function isPostponed(): bool
    {
        return $this->status === self::STATUS_POSTPONED;
    }

    /**
     * Get the match result (H/D/A).
     */
    public function getResult(): ?string
    {
        if (!$this->isFinished() || $this->home_goals === null || $this->away_goals === null) {
            return null;
        }

        if ($this->home_goals > $this->away_goals) {
            return 'H'; // Home win
        } elseif ($this->home_goals < $this->away_goals) {
            return 'A'; // Away win
        } else {
            return 'D'; // Draw
        }
    }

    /**
     * Get the full score string (e.g., "2-1").
     */
    public function getScoreString(): ?string
    {
        if ($this->home_goals === null || $this->away_goals === null) {
            return null;
        }

        return "{$this->home_goals}-{$this->away_goals}";
    }

    /**
     * Check if betting is available for this match.
     */
    public function isBettingAvailable(): bool
    {
        return $this->isScheduled() &&
               $this->gameweek->isBettingOpen() &&
               Carbon::now()->isBefore($this->kickoff_time);
    }

    /**
     * Get time until kickoff.
     */
    public function getTimeUntilKickoff(): string
    {
        if ($this->kickoff_time->isPast()) {
            return 'Started';
        }

        return $this->kickoff_time->diffForHumans();
    }

    /**
     * Get match day (Saturday/Sunday/etc.).
     */
    public function getMatchDay(): string
    {
        return $this->kickoff_time->format('l'); // Full day name
    }

    /**
     * Get formatted kickoff time in Spanish timezone.
     */
    public function getFormattedKickoffTime(): string
    {
        return $this->kickoff_time
            ->setTimezone('Europe/Madrid')
            ->format('H:i');
    }

    /**
     * Get formatted kickoff date.
     */
    public function getFormattedKickoffDate(): string
    {
        return $this->kickoff_time
            ->setTimezone('Europe/Madrid')
            ->format('M d, Y');
    }

    /**
     * Calculate dynamic odds based on various factors.
     */
    public function calculateDynamicOdds(): array
    {
        // Base odds (simplified algorithm)
        $homeOdds = 2.0 + (rand(1, 100) / 100); // 2.01 - 3.00
        $awayOdds = 2.0 + (rand(1, 100) / 100); // 2.01 - 3.00
        $drawOdds = 3.0 + (rand(1, 50) / 100);  // 3.01 - 3.50

        // Adjust based on team names (simple example)
        $homeTeamName = $this->homeTeam->name ?? '';
        $awayTeamName = $this->awayTeam->name ?? '';

        // Favor certain "stronger" teams slightly
        $strongTeams = ['Fire Dragons', 'Thunder Wolves', 'Golden Spartans', 'Steel Lions'];

        if (in_array($homeTeamName, $strongTeams)) {
            $homeOdds *= 0.9; // Lower odds = higher chance
            $awayOdds *= 1.1;
        }

        if (in_array($awayTeamName, $strongTeams)) {
            $awayOdds *= 0.9;
            $homeOdds *= 1.1;
        }

        return [
            'home_odds' => round($homeOdds, 2),
            'draw_odds' => round($drawOdds, 2),
            'away_odds' => round($awayOdds, 2),
        ];
    }

    /**
     * Scope to get upcoming matches.
     */
    public function scopeUpcoming($query)
    {
        return $query->where('status', self::STATUS_SCHEDULED)
                    ->where('kickoff_time', '>', Carbon::now());
    }

    /**
     * Scope to get live matches.
     */
    public function scopeLive($query)
    {
        return $query->where('status', self::STATUS_LIVE);
    }

    /**
     * Scope to get finished matches.
     */
    public function scopeFinished($query)
    {
        return $query->where('status', self::STATUS_FINISHED);
    }

    /**
     * Scope to get matches for today.
     */
    public function scopeToday($query)
    {
        return $query->whereDate('kickoff_time', Carbon::today());
    }

    /**
     * Scope to get matches for this weekend.
     */
    public function scopeThisWeekend($query)
    {
        $startOfWeekend = Carbon::now()->next(Carbon::SATURDAY);
        $endOfWeekend = Carbon::now()->next(Carbon::SUNDAY)->endOfDay();

        return $query->whereBetween('kickoff_time', [$startOfWeekend, $endOfWeekend]);
    }

    /**
     * Set match result and update league table.
     */
    public function setResult(int $homeGoals, int $awayGoals): void
    {
        $this->home_goals = $homeGoals;
        $this->away_goals = $awayGoals;
        $this->status = self::STATUS_FINISHED;
        $this->save();

        // Update league table
        $leagueService = new LeagueTableService();
        $leagueService->updateTableAfterMatch($this);

        // TODO: Process bets and settle them
        // $this->settleBets();
    }

    /**
     * Simulate match result using realistic algorithm.
     */
    public function simulateResult(): void
    {
        if ($this->status !== self::STATUS_SCHEDULED) {
            return;
        }

        $this->status = self::STATUS_LIVE;
        $this->save();

        $result = $this->generateRealisticScore();

        $this->setResult($result['home_goals'], $result['away_goals']);
    }

    /**
     * Generate realistic match score based on team strength.
     */
    private function generateRealisticScore(): array
    {
        // Get team names for strength calculation
        $homeTeamName = $this->homeTeam->name ?? '';
        $awayTeamName = $this->awayTeam->name ?? '';

        // Define team strength tiers
        $strongTeams = ['Fire Dragons', 'Thunder Wolves', 'Golden Spartans', 'Steel Lions'];
        $midTeams = ['Azure Knights', 'Crimson Hawks', 'Shadow Panthers', 'Royal Eagles'];

        $homeStrength = $this->getTeamStrength($homeTeamName, $strongTeams, $midTeams);
        $awayStrength = $this->getTeamStrength($awayTeamName, $strongTeams, $midTeams);

        // Home advantage
        $homeStrength += 0.3;

        // Generate goals based on strength
        $homeGoals = $this->generateGoals($homeStrength);
        $awayGoals = $this->generateGoals($awayStrength);

        return [
            'home_goals' => $homeGoals,
            'away_goals' => $awayGoals,
        ];
    }

    /**
     * Get team strength value.
     */
    private function getTeamStrength(string $teamName, array $strongTeams, array $midTeams): float
    {
        if (in_array($teamName, $strongTeams)) {
            return 2.2; // Strong teams
        } elseif (in_array($teamName, $midTeams)) {
            return 1.8; // Mid-tier teams
        } else {
            return 1.4; // Weaker teams
        }
    }

    /**
     * Generate goals based on team strength.
     */
    private function generateGoals(float $strength): int
    {
        $baseChance = $strength;
        $goals = 0;

        // Poisson-like distribution for realistic scores
        for ($i = 0; $i < 6; $i++) {
            if (rand(0, 100) / 100 < ($baseChance * (0.7 ** $i))) {
                $goals++;
            }
        }

        return min($goals, 5); // Cap at 5 goals
    }

    /**
     * Check if match can be simulated.
     */
    public function canBeSimulated(): bool
    {
        return $this->status === self::STATUS_SCHEDULED &&
               $this->kickoff_time->isPast();
    }

    /**
     * Get match status badge class.
     */
    public function getStatusBadgeClass(): string
    {
        return match ($this->status) {
            self::STATUS_SCHEDULED => 'bg-blue-100 text-blue-800',
            self::STATUS_LIVE => 'bg-red-100 text-red-800 animate-pulse',
            self::STATUS_FINISHED => 'bg-green-100 text-green-800',
            self::STATUS_POSTPONED => 'bg-yellow-100 text-yellow-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }

    /**
     * Get human-readable status.
     */
    public function getStatusLabel(): string
    {
        return match ($this->status) {
            self::STATUS_SCHEDULED => 'Scheduled',
            self::STATUS_LIVE => 'LIVE',
            self::STATUS_FINISHED => 'Finished',
            self::STATUS_POSTPONED => 'Postponed',
            default => 'Unknown',
        };
    }
}
