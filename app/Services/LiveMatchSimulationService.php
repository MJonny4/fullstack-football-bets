<?php

namespace App\Services;

use App\Models\FootballMatch;
use App\Models\Team;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LiveMatchSimulationService
{
    private const SIMULATION_DURATION_MINUTES = 5; // 5 real minutes = 90 match minutes
    private const MATCH_MINUTES_TOTAL = 90;
    private const EXTRA_TIME_MAX = 5;

    /**
     * Start a live match simulation (5-minute real-time simulation)
     */
    public function startLiveMatch(FootballMatch $match): bool
    {
        try {
            DB::beginTransaction();

            $now = Carbon::now('Europe/Madrid');

            $match->update([
                'status' => 'live',
                'started_at' => $now,
                'simulation_started_at' => $now,
                'current_match_minute' => 0,
                'simulation_status' => 'active',
                'home_goals' => 0,
                'away_goals' => 0,
                'match_events' => json_encode([]),
                'next_event_check' => $now->copy()->addSeconds(3), // First check in 3 seconds
            ]);

            DB::commit();

            Log::info("Live match simulation started", [
                'match_id' => $match->id,
                'teams' => $match->homeTeam->name . ' vs ' . $match->awayTeam->name,
                'started_at' => $now->toDateTimeString()
            ]);

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Failed to start live match simulation", [
                'match_id' => $match->id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Update match state - called every few seconds
     */
    public function updateMatchState(FootballMatch $match): bool
    {
        if ($match->simulation_status !== 'active') {
            return false;
        }

        $now = Carbon::now('Europe/Madrid');
        $simulationStart = Carbon::parse($match->simulation_started_at);

        // Calculate current match minute based on real time elapsed
        $realMinutesElapsed = $simulationStart->diffInSeconds($now) / 60;
        $matchMinute = $this->calculateMatchMinute($realMinutesElapsed);

        // Check if simulation should end
        if ($realMinutesElapsed >= self::SIMULATION_DURATION_MINUTES) {
            return $this->finishMatch($match);
        }

        // Update current minute
        $match->update(['current_match_minute' => $matchMinute]);

        // Check if a goal should happen
        $goalEvent = $this->shouldGoalHappen($match, $matchMinute);
        if ($goalEvent) {
            $this->addGoalEvent($match, $goalEvent);
        }

        // Set next check time (3-8 seconds randomly)
        $match->update([
            'next_event_check' => $now->copy()->addSeconds(rand(3, 8))
        ]);

        return true;
    }

    /**
     * Calculate match minute from real minutes elapsed
     */
    private function calculateMatchMinute(float $realMinutes): int
    {
        if ($realMinutes <= 2.5) {
            // First half: 0-2.5 real minutes = 0-45 match minutes
            return (int) ($realMinutes * 18); // 45 minutes / 2.5 minutes = 18x speed
        } elseif ($realMinutes <= 2.75) {
            // Half time: stay at 45
            return 45;
        } elseif ($realMinutes <= 5) {
            // Second half: 2.75-5 real minutes = 45-90 match minutes
            $secondHalfReal = $realMinutes - 2.75;
            return 45 + (int) ($secondHalfReal * 20); // 45 minutes / 2.25 minutes = 20x speed
        } else {
            // Extra time
            $extraReal = $realMinutes - 5;
            return 90 + min((int) ($extraReal * 60), self::EXTRA_TIME_MAX);
        }
    }

    /**
     * Determine if a goal should happen based on realistic probability
     */
    private function shouldGoalHappen(FootballMatch $match, int $minute): ?array
    {
        $baseChance = $this->getMinuteProbability($minute);

        $homeAdvantage = $this->calculateTeamAdvantage($match, 'home');
        $awayAdvantage = $this->calculateTeamAdvantage($match, 'away');

        $homeChance = $baseChance * $homeAdvantage;
        $awayChance = $baseChance * $awayAdvantage;

        // Check for home goal (chance out of 10,000)
        if (rand(1, 10000) <= $homeChance * 100) {
            return [
                'team' => 'home',
                'minute' => $minute,
                'player' => $this->getRandomPlayer($match->homeTeam),
                'type' => 'goal'
            ];
        }

        // Check for away goal
        if (rand(1, 10000) <= $awayChance * 100) {
            return [
                'team' => 'away',
                'minute' => $minute,
                'player' => $this->getRandomPlayer($match->awayTeam),
                'type' => 'goal'
            ];
        }

        return null;
    }

    /**
     * Get goal probability based on match minute
     */
    private function getMinuteProbability(int $minute): float
    {
        if ($minute <= 15) return 0.8; // 0.8% chance (was 0.15%)
        if ($minute <= 30) return 1.0; // 1.0% chance (was 0.20%)
        if ($minute <= 45) return 1.2; // 1.2% chance - Teams push before half
        if ($minute <= 60) return 0.8; // 0.8% chance
        if ($minute <= 75) return 1.0; // 1.0% chance
        if ($minute <= 90) return 1.5; // 1.5% chance - Desperation time
        return 2.0; // 2.0% chance - Extra time, high intensity
    }

    /**
     * Calculate team advantage based on various factors
     */
    private function calculateTeamAdvantage(FootballMatch $match, string $side): float
    {
        $team = $side === 'home' ? $match->homeTeam : $match->awayTeam;
        $opponent = $side === 'home' ? $match->awayTeam : $match->homeTeam;

        $advantage = 1.0; // Base multiplier

        // Team strength (20% influence)
        $strengthRatio = $team->strength_rating / max($opponent->strength_rating, 1);
        $advantage *= 0.8 + (0.4 * $strengthRatio); // 0.8 to 1.2 range

        // Home advantage (10% influence)
        if ($side === 'home') {
            $advantage *= 1.1;
        }

        // Current score influence (losing team gets slight boost)
        $currentGoals = $side === 'home' ? $match->home_goals : $match->away_goals;
        $opponentGoals = $side === 'home' ? $match->away_goals : $match->home_goals;

        if ($currentGoals < $opponentGoals) {
            $advantage *= 1.15; // 15% boost for losing team
        }

        // Random factor (10% influence)
        $advantage *= (0.9 + (rand(0, 20) / 100)); // 0.9 to 1.1 random

        return $advantage;
    }

    /**
     * Add goal event to match
     */
    private function addGoalEvent(FootballMatch $match, array $goalEvent): void
    {
        DB::beginTransaction();

        try {
            // Update score
            if ($goalEvent['team'] === 'home') {
                $match->increment('home_goals');
            } else {
                $match->increment('away_goals');
            }

            // Add to events
            $events = json_decode($match->match_events ?? '[]', true);
            $events[] = $goalEvent;

            $match->update(['match_events' => json_encode($events)]);

            DB::commit();

            Log::info("Goal scored in live match", [
                'match_id' => $match->id,
                'team' => $goalEvent['team'],
                'minute' => $goalEvent['minute'],
                'player' => $goalEvent['player']
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Failed to add goal event", [
                'match_id' => $match->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get random player name for goal scorer
     */
    private function getRandomPlayer(Team $team): string
    {
        $players = [
            'García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez',
            'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz',
            'Hernández', 'Díaz', 'Moreno', 'Álvarez', 'Muñoz', 'Romero',
            'Gutiérrez', 'Navarro', 'Torres', 'Domínguez', 'Ramos', 'Vázquez'
        ];

        return $players[array_rand($players)];
    }

    /**
     * Finish the match simulation
     */
    private function finishMatch(FootballMatch $match): bool
    {
        try {
            $now = Carbon::now('Europe/Madrid');

            $match->update([
                'status' => 'finished',
                'finished_at' => $now,
                'simulation_status' => 'completed',
                'current_match_minute' => 90 + rand(0, self::EXTRA_TIME_MAX),
                'match_result' => $this->determineResult($match),
            ]);

            Log::info("Live match simulation completed", [
                'match_id' => $match->id,
                'final_score' => $match->home_goals . '-' . $match->away_goals,
                'duration' => '5 minutes'
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error("Failed to finish match simulation", [
                'match_id' => $match->id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Determine match result
     */
    private function determineResult(FootballMatch $match): string
    {
        if ($match->home_goals > $match->away_goals) {
            return 'home_win';
        } elseif ($match->away_goals > $match->home_goals) {
            return 'away_win';
        } else {
            return 'draw';
        }
    }

    /**
     * Get all active live matches that need updates
     */
    public static function getActiveMatches(): \Illuminate\Database\Eloquent\Collection
    {
        return FootballMatch::where('simulation_status', 'active')
            ->where('next_event_check', '<=', Carbon::now('Europe/Madrid'))
            ->get();
    }
}