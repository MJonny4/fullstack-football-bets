<?php

namespace App\Services;

use App\Models\FootballMatch;
use App\Models\Team;
use App\Models\Bet;
use App\Services\LeagueTableService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class MatchSimulationService
{
    private LeagueTableService $leagueService;

    public function __construct()
    {
        $this->leagueService = new LeagueTableService();
    }

    /**
     * Simulate a single match and generate realistic result.
     */
    public function simulateMatch(FootballMatch $match): array
    {
        Log::info("Starting match simulation", ['match_id' => $match->id]);

        // Get team strengths and form
        $homeStrength = $this->calculateTeamStrength($match->homeTeam, true);
        $awayStrength = $this->calculateTeamStrength($match->awayTeam, false);

        // Generate match events and final score
        $simulation = $this->generateMatchEvents($homeStrength, $awayStrength);

        // Determine match result
        $result = $this->determineMatchResult($simulation['home_goals'], $simulation['away_goals']);

        return [
            'home_goals' => $simulation['home_goals'],
            'away_goals' => $simulation['away_goals'],
            'result' => $result,
            'events' => $simulation['events'],
            'match_stats' => $simulation['stats'],
            'attendance' => $this->generateAttendance(),
            'duration' => 90 + $simulation['added_time'],
        ];
    }

    /**
     * Process match result and update all related systems.
     */
    public function processMatchResult(FootballMatch $match, array $simulationData): bool
    {
        try {
            DB::transaction(function () use ($match, $simulationData) {
                // Update match with results
                $match->update([
                    'status' => 'finished',
                    'home_goals' => $simulationData['home_goals'],
                    'away_goals' => $simulationData['away_goals'],
                    'match_result' => $simulationData['result'],
                    'match_events' => json_encode($simulationData['events']),
                    'match_stats' => json_encode($simulationData['match_stats']),
                    'attendance' => $simulationData['attendance'],
                    'finished_at' => now(),
                ]);

                // Update league table
                $this->leagueService->updateTableAfterMatch($match);

                // Settle all bets for this match
                $this->settleBetsForMatch($match);
            });

            Log::info("Match processing completed", [
                'match_id' => $match->id,
                'result' => "{$simulationData['home_goals']}-{$simulationData['away_goals']}"
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error("Error processing match result", [
                'match_id' => $match->id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Calculate team strength based on current form and historical performance.
     */
    private function calculateTeamStrength(Team $team, bool $isHome = false): float
    {
        // Base strength from team rating (0.3-1.0)
        $baseStrength = $team->strength_rating ?? 0.65;

        // Home advantage boost (5-15%)
        if ($isHome) {
            $baseStrength *= rand(105, 115) / 100;
        }

        // Form factor from recent matches (±20%)
        $formModifier = $this->getTeamFormModifier($team);
        $baseStrength *= (1 + $formModifier);

        // Random factor (±10%)
        $randomFactor = (rand(90, 110) / 100);
        $baseStrength *= $randomFactor;

        return max(0.2, min(1.2, $baseStrength));
    }

    /**
     * Generate realistic match events and scoring.
     */
    private function generateMatchEvents(float $homeStrength, float $awayStrength): array
    {
        $events = [];
        $homeGoals = 0;
        $awayGoals = 0;
        $addedTime = rand(1, 6);

        // Calculate attack probability based on strength difference
        $totalStrength = $homeStrength + $awayStrength;
        $homeProbability = $homeStrength / $totalStrength;

        // Generate goals based on combined team strength
        $expectedGoals = ($homeStrength + $awayStrength) * 1.4; // Average ~2.5 goals per match
        $actualGoals = $this->poissonDistribution($expectedGoals);

        // Distribute goals between teams
        for ($i = 0; $i < $actualGoals; $i++) {
            $minute = rand(1, 90);
            $isHome = (rand(1, 100) / 100) < $homeProbability;

            if ($isHome) {
                $homeGoals++;
                $events[] = [
                    'type' => 'goal',
                    'team' => 'home',
                    'minute' => $minute,
                    'player' => $this->generatePlayerName(),
                ];
            } else {
                $awayGoals++;
                $events[] = [
                    'type' => 'goal',
                    'team' => 'away',
                    'minute' => $minute,
                    'player' => $this->generatePlayerName(),
                ];
            }
        }

        // Add other events (cards, substitutions)
        $this->addRandomEvents($events, $homeStrength, $awayStrength);

        // Sort events by minute
        usort($events, fn($a, $b) => $a['minute'] <=> $b['minute']);

        return [
            'home_goals' => $homeGoals,
            'away_goals' => $awayGoals,
            'events' => $events,
            'added_time' => $addedTime,
            'stats' => $this->generateMatchStats($homeStrength, $awayStrength, $homeGoals, $awayGoals),
        ];
    }

    /**
     * Determine match result (home win, draw, away win).
     */
    private function determineMatchResult(int $homeGoals, int $awayGoals): string
    {
        if ($homeGoals > $awayGoals) {
            return 'home';
        } elseif ($awayGoals > $homeGoals) {
            return 'away';
        } else {
            return 'draw';
        }
    }

    /**
     * Generate random events like cards and substitutions.
     */
    private function addRandomEvents(array &$events, float $homeStrength, float $awayStrength): void
    {
        // Yellow cards (2-6 per match)
        $yellowCards = rand(2, 6);
        for ($i = 0; $i < $yellowCards; $i++) {
            $events[] = [
                'type' => 'yellow_card',
                'team' => rand(0, 1) ? 'home' : 'away',
                'minute' => rand(5, 85),
                'player' => $this->generatePlayerName(),
            ];
        }

        // Red cards (0-1 per match, rare)
        if (rand(1, 20) === 1) {
            $events[] = [
                'type' => 'red_card',
                'team' => rand(0, 1) ? 'home' : 'away',
                'minute' => rand(15, 80),
                'player' => $this->generatePlayerName(),
            ];
        }

        // Substitutions (4-6 per match)
        $substitutions = rand(4, 6);
        for ($i = 0; $i < $substitutions; $i++) {
            $events[] = [
                'type' => 'substitution',
                'team' => rand(0, 1) ? 'home' : 'away',
                'minute' => rand(45, 90),
                'player_out' => $this->generatePlayerName(),
                'player_in' => $this->generatePlayerName(),
            ];
        }
    }

    /**
     * Generate realistic match statistics.
     */
    private function generateMatchStats(float $homeStrength, float $awayStrength, int $homeGoals, int $awayGoals): array
    {
        // Possession based on team strength
        $strengthDiff = $homeStrength - $awayStrength;
        $basePossession = 50 + ($strengthDiff * 20);
        $homePossession = max(25, min(75, $basePossession + rand(-10, 10)));

        return [
            'possession' => [
                'home' => round($homePossession),
                'away' => round(100 - $homePossession),
            ],
            'shots' => [
                'home' => $homeGoals * rand(3, 6) + rand(2, 8),
                'away' => $awayGoals * rand(3, 6) + rand(2, 8),
            ],
            'shots_on_target' => [
                'home' => $homeGoals + rand(1, 4),
                'away' => $awayGoals + rand(1, 4),
            ],
            'corners' => [
                'home' => rand(2, 12),
                'away' => rand(2, 12),
            ],
            'fouls' => [
                'home' => rand(8, 20),
                'away' => rand(8, 20),
            ],
        ];
    }

    /**
     * Get team form modifier based on recent results.
     */
    private function getTeamFormModifier(Team $team): float
    {
        // Get last 5 matches for this team
        $recentMatches = FootballMatch::where(function ($query) use ($team) {
            $query->where('home_team_id', $team->id)
                  ->orWhere('away_team_id', $team->id);
        })
        ->where('status', 'finished')
        ->orderByDesc('kickoff_time')
        ->limit(5)
        ->get();

        if ($recentMatches->isEmpty()) {
            return 0; // No form data available
        }

        $formPoints = 0;
        $totalMatches = $recentMatches->count();

        foreach ($recentMatches as $match) {
            $isHome = $match->home_team_id === $team->id;
            $teamGoals = $isHome ? $match->home_goals : $match->away_goals;
            $opponentGoals = $isHome ? $match->away_goals : $match->home_goals;

            if ($teamGoals > $opponentGoals) {
                $formPoints += 3; // Win
            } elseif ($teamGoals === $opponentGoals) {
                $formPoints += 1; // Draw
            }
            // Loss = 0 points
        }

        // Convert to modifier (-0.2 to +0.2)
        $averagePoints = $formPoints / ($totalMatches * 3);
        return ($averagePoints - 0.5) * 0.4;
    }

    /**
     * Poisson distribution for realistic goal generation.
     */
    private function poissonDistribution(float $lambda): int
    {
        $L = exp(-$lambda);
        $k = 0;
        $p = 1;

        do {
            $k++;
            $p *= (rand(1, 10000) / 10000);
        } while ($p > $L);

        return max(0, min(8, $k - 1)); // Cap goals at reasonable number
    }

    /**
     * Generate realistic attendance figure.
     */
    private function generateAttendance(): int
    {
        return rand(15000, 75000);
    }

    /**
     * Generate random player name.
     */
    private function generatePlayerName(): string
    {
        $firstNames = [
            'Carlos', 'Miguel', 'Antonio', 'José', 'Francisco', 'David', 'Juan', 'Alejandro',
            'Daniel', 'Adrian', 'Pablo', 'Álvaro', 'Manuel', 'Sergio', 'Rafael', 'Pedro',
            'Fernando', 'Óscar', 'Roberto', 'Mario', 'Eduardo', 'Rubén', 'Jorge', 'Diego'
        ];

        $lastNames = [
            'González', 'Rodríguez', 'García', 'Fernández', 'López', 'Martínez', 'Sánchez',
            'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno',
            'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez', 'Navarro', 'Torres', 'Domínguez'
        ];

        return $firstNames[array_rand($firstNames)] . ' ' . $lastNames[array_rand($lastNames)];
    }

    /**
     * Settle all bets related to a finished match.
     */
    private function settleBetsForMatch(FootballMatch $match): void
    {
        $bets = Bet::where('match_id', $match->id)
                   ->where('status', 'pending')
                   ->get();

        foreach ($bets as $bet) {
            $this->settleBet($bet, $match);
        }

        Log::info("Settled bets for match", [
            'match_id' => $match->id,
            'bets_count' => $bets->count()
        ]);
    }

    /**
     * Settle individual bet based on match result.
     */
    private function settleBet(Bet $bet, FootballMatch $match): void
    {
        $isWinning = false;

        // Determine if bet won based on match result
        switch ($bet->bet_type) {
            case 'home':
                $isWinning = $match->home_goals > $match->away_goals;
                break;
            case 'away':
                $isWinning = $match->away_goals > $match->home_goals;
                break;
            case 'draw':
                $isWinning = $match->home_goals === $match->away_goals;
                break;
        }

        if ($isWinning) {
            // Bet won - calculate winnings
            $winnings = $bet->amount * $bet->odds;

            $bet->update([
                'status' => 'won',
                'actual_winnings' => $winnings,
                'settled_at' => now(),
            ]);

            // Add winnings to user balance
            $bet->user->increment('virtual_balance', $winnings);

            Log::info("Bet won", [
                'bet_id' => $bet->id,
                'user_id' => $bet->user_id,
                'winnings' => $winnings
            ]);
        } else {
            // Bet lost
            $bet->update([
                'status' => 'lost',
                'actual_winnings' => 0,
                'settled_at' => now(),
            ]);

            Log::info("Bet lost", [
                'bet_id' => $bet->id,
                'user_id' => $bet->user_id,
                'amount' => $bet->amount
            ]);
        }
    }

    /**
     * Start live simulation for a match (sets status to 'live').
     */
    public function startMatch(FootballMatch $match): bool
    {
        if ($match->status !== 'scheduled') {
            return false;
        }

        $match->update([
            'status' => 'live',
            'started_at' => now(),
        ]);

        Log::info("Match started", ['match_id' => $match->id]);
        return true;
    }

    /**
     * Get matches that should be starting now.
     */
    public function getMatchesToStart(): \Illuminate\Database\Eloquent\Collection
    {
        $now = Carbon::now('Europe/Madrid');

        return FootballMatch::where('status', 'scheduled')
            ->where('kickoff_time', '<=', $now)
            ->where('kickoff_time', '>=', $now->copy()->subMinutes(5))
            ->get();
    }

    /**
     * Get live matches that should be finished.
     */
    public function getLiveMatchesToFinish(): \Illuminate\Database\Eloquent\Collection
    {
        $cutoffTime = Carbon::now('Europe/Madrid')->subMinutes(95); // 90 min + 5 min buffer

        return FootballMatch::where('status', 'live')
            ->where('started_at', '<=', $cutoffTime)
            ->get();
    }
}