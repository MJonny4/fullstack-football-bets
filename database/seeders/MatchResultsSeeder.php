<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\FootballMatch;
use App\Models\Season;
use App\Services\LeagueTableService;

class MatchResultsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get active season
        $season = Season::where('active', true)->first();

        if (!$season) {
            $this->command->error('No active season found!');
            return;
        }

        // Initialize league table service
        $leagueService = new LeagueTableService();
        $leagueService->initializeSeasonTable($season);

        // Define team strength tiers for realistic results
        $teamStrengths = [
            // Strong teams (higher chance to win)
            'Fire Dragons' => 2.3,
            'Thunder Wolves' => 2.2,
            'Golden Spartans' => 2.1,
            'Steel Lions' => 2.0,

            // Mid-tier teams
            'Azure Knights' => 1.8,
            'Crimson Hawks' => 1.8,
            'Shadow Panthers' => 1.7,
            'Royal Eagles' => 1.7,
            'Storm Falcons' => 1.7,
            'Jade Warriors' => 1.6,
            'Silver Phoenixes' => 1.6,
            'Emerald Tigers' => 1.6,

            // Weaker teams
            'Violet Leopards' => 1.4,
            'Bronze Sharks' => 1.4,
            'Crystal Bears' => 1.3,
            'Scarlet Cobras' => 1.3,
            'Sapphire Rams' => 1.2,
            'Ruby Stallions' => 1.2,
            'Amber Foxes' => 1.1,
            'Diamond Wolves' => 1.0,
        ];

        // Get first 5 gameweeks worth of matches for testing (50 matches total)
        $matches = FootballMatch::with(['homeTeam', 'awayTeam'])
            ->whereHas('gameweek', function ($query) use ($season) {
                $query->where('season_id', $season->id)
                      ->where('number', '<=', 5);
            })
            ->where('status', 'scheduled')
            ->get();

        $this->command->info("Processing {$matches->count()} matches for realistic results...");

        foreach ($matches as $match) {
            // Get team strengths
            $homeStrength = $teamStrengths[$match->homeTeam->name] ?? 1.5;
            $awayStrength = $teamStrengths[$match->awayTeam->name] ?? 1.5;

            // Apply home advantage
            $homeStrength += 0.3;

            // Generate realistic result
            $result = $this->generateRealisticResult($homeStrength, $awayStrength);

            // Set the match result
            $match->setResult($result['home_goals'], $result['away_goals']);

            $this->command->line("⚽ {$match->homeTeam->name} {$result['home_goals']}-{$result['away_goals']} {$match->awayTeam->name}");
        }

        $this->command->info("✅ Successfully generated results for {$matches->count()} matches!");
        $this->command->info("🏆 League table has been automatically updated!");

        // Show current top 5
        $topTeams = \App\Models\LeagueTable::where('season_id', $season->id)
            ->orderBy('position')
            ->with('team')
            ->take(5)
            ->get();

        $this->command->info("\n📊 Current Top 5:");
        foreach ($topTeams as $team) {
            $this->command->line("{$team->position}. {$team->team->name} - {$team->points} pts ({$team->played} played)");
        }
    }

    /**
     * Generate realistic match result based on team strengths.
     */
    private function generateRealisticResult(float $homeStrength, float $awayStrength): array
    {
        $homeGoals = $this->generateGoals($homeStrength);
        $awayGoals = $this->generateGoals($awayStrength);

        return [
            'home_goals' => $homeGoals,
            'away_goals' => $awayGoals,
        ];
    }

    /**
     * Generate goals using Poisson-like distribution.
     */
    private function generateGoals(float $strength): int
    {
        $goals = 0;
        $maxGoals = 5;

        // Higher strength = higher chance of scoring
        for ($i = 0; $i < $maxGoals; $i++) {
            $probability = $strength * (0.6 ** $i); // Decreasing probability for each goal

            if ((rand(0, 100) / 100) < $probability) {
                $goals++;
            }
        }

        return min($goals, $maxGoals);
    }
}
