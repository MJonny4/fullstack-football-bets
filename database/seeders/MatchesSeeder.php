<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MatchesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Set timezone to Europe/Madrid (Spanish timezone)
        $timezone = 'Europe/Madrid';

        // Get all teams and gameweeks
        $teams = DB::table('teams')->where('active', true)->get();
        $gameweeks = DB::table('gameweeks')->orderBy('number')->get();

        if ($teams->count() !== 20) {
            $this->command->error('❌ Expected 20 teams, found ' . $teams->count());
            return;
        }

        if ($gameweeks->count() !== 38) {
            $this->command->error('❌ Expected 38 gameweeks, found ' . $gameweeks->count());
            return;
        }

        // Spanish match times (13:00, 15:00, 17:00, 19:00, 21:00)
        $matchTimes = ['13:00', '15:00', '17:00', '19:00', '21:00'];

        $matches = [];
        $matchCounter = 0;

        // Generate double round-robin (38 gameweeks, 10 matches per gameweek)
        for ($round = 1; $round <= 38; $round++) {
            $gameweek = $gameweeks[$round - 1];
            $gameweekStartDate = Carbon::parse($gameweek->first_match_date)->setTimezone($timezone);

            // Get fixtures for this round using round-robin algorithm
            $roundFixtures = $this->generateRoundFixtures($teams->toArray(), $round);

            foreach ($roundFixtures as $index => $fixture) {
                // Distribute matches across Saturday (13:00, 15:00, 17:00, 19:00, 21:00)
                // and Sunday (13:00, 15:00, 17:00, 19:00, 21:00)
                $dayOffset = $index < 5 ? 0 : 1; // First 5 matches on Saturday, rest on Sunday
                $timeIndex = $index % 5; // Cycle through the 5 time slots

                // Create time in UTC, adding 2 hours to match Spanish display times
                $kickoffTime = $gameweekStartDate->copy()
                    ->addDays($dayOffset)
                    ->setTimeFromTimeString($matchTimes[$timeIndex])
                    ->addHours(2) // Add 2 hours to shift from 11:00 UTC base to 13:00 UTC
                    ->setTimezone('UTC');

                $matches[] = [
                    'gameweek_id' => $gameweek->id,
                    'home_team_id' => $fixture['home'],
                    'away_team_id' => $fixture['away'],
                    'kickoff_time' => $kickoffTime, // Store as UTC directly (13:00 UTC = 13:00 Spanish display)
                    'status' => 'scheduled',
                    'home_goals' => null,
                    'away_goals' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                $matchCounter++;
            }
        }

        // Insert all matches in batches for better performance
        $chunks = array_chunk($matches, 100);
        foreach ($chunks as $chunk) {
            DB::table('matches')->insert($chunk);
        }

        $this->command->info("✅ Created {$matchCounter} matches for the complete season!");
        $this->command->info("⚽ Double round-robin: Each team plays every other team twice");
        $this->command->info("📅 38 gameweeks × 10 matches = 380 total matches");
        $this->command->info("🕐 Spanish times: Saturdays & Sundays 13:00-21:00 (Europe/Madrid)");
    }

    /**
     * Generate fixtures for a specific round using round-robin algorithm
     */
    private function generateRoundFixtures(array $teams, int $round): array
    {
        $fixtures = [];
        $numTeams = count($teams);

        // For 20 teams, we need 19 rounds for single round-robin
        // Double round-robin = 38 rounds total

        // Determine if this is first half (rounds 1-19) or second half (rounds 20-38)
        $isSecondHalf = $round > 19;
        $actualRound = $isSecondHalf ? $round - 19 : $round;

        // Standard round-robin algorithm for even number of teams
        for ($i = 0; $i < $numTeams / 2; $i++) {
            $home = ($actualRound - 1 + $i) % ($numTeams - 1);
            $away = ($numTeams - 1 - $i + $actualRound - 1) % ($numTeams - 1);

            // The last team (index 19) is fixed in position
            if ($i == 0) {
                $away = $numTeams - 1;
            }

            // In second half of season, swap home/away
            if ($isSecondHalf) {
                $fixtures[] = [
                    'home' => $teams[$away]->id,
                    'away' => $teams[$home]->id,
                ];
            } else {
                $fixtures[] = [
                    'home' => $teams[$home]->id,
                    'away' => $teams[$away]->id,
                ];
            }
        }

        return $fixtures;
    }
}
