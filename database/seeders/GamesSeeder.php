<?php

namespace Database\Seeders;

use App\Models\Team;
use App\Models\Gameweek;
use App\Models\FootballMatch;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class GamesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $teams = Team::all();
        $gameweeks = Gameweek::orderBy('number')->get();

        if ($teams->count() !== 20) {
            $this->command->error('❌ Need exactly 20 teams! Found: ' . $teams->count());
            return;
        }

        if ($gameweeks->count() !== 38) {
            $this->command->error('❌ Need exactly 38 gameweeks! Found: ' . $gameweeks->count());
            return;
        }

        $this->command->info('🏈 Generating 380 matches with professional scheduling...');

        // Generate round-robin fixtures
        $fixtures = $this->generateRoundRobinFixtures($teams);

        $totalMatches = 0;

        foreach ($gameweeks as $gameweek) {
            $gameweekNumber = $gameweek->number;
            $isSecondLeg = $gameweekNumber > 19;
            $fixtureIndex = $isSecondLeg ? $gameweekNumber - 20 : $gameweekNumber - 1;

            // Get 10 matches for this gameweek
            $gameweekFixtures = $fixtures[$fixtureIndex] ?? [];

            if (empty($gameweekFixtures)) {
                $this->command->warn("⚠️ No fixtures for gameweek {$gameweekNumber}");
                continue;
            }

            // Generate unique random times (11:00-21:00, no duplicates)
            $gameTimes = $this->generateUniqueGameTimes(count($gameweekFixtures));

            foreach ($gameweekFixtures as $index => $fixture) {
                $homeTeamId = $isSecondLeg ? $fixture['away_team_id'] : $fixture['home_team_id'];
                $awayTeamId = $isSecondLeg ? $fixture['home_team_id'] : $fixture['away_team_id'];

                // Create match with random time
                $matchDateTime = Carbon::parse($gameweek->start_date)->setTimeFromTimeString($gameTimes[$index]);

                FootballMatch::create([
                    'gameweek_id' => $gameweek->_id,
                    'home_team_id' => $homeTeamId,
                    'away_team_id' => $awayTeamId,
                    'kickoff_time' => $matchDateTime,
                    'status' => 'scheduled',
                    'home_score' => null,
                    'away_score' => null,
                ]);

                $totalMatches++;
            }

            $gameweekName = $gameweek->name ?? "Gameweek {$gameweekNumber}";
            $this->command->info("✅ Gameweek {$gameweekNumber}: {$gameweekName} - " . count($gameweekFixtures) . " matches");
        }

        $this->command->info("🎉 Created {$totalMatches} matches successfully!");
        $this->command->info("⚽ Each team plays every other team twice (home & away)");
        $this->command->info("🕐 Game times: Random between 11:00-21:00 (no duplicates per gameweek)");
    }

    /**
     * Generate round-robin fixtures using correct algorithm
     * For 20 teams: 19 rounds, 10 matches per round = 190 unique matches
     */
    private function generateRoundRobinFixtures($teams): array
    {
        $numTeams = count($teams);
        $fixtures = [];

        // Classic round-robin algorithm for even number of teams
        for ($round = 0; $round < $numTeams - 1; $round++) {
            $roundFixtures = [];

            for ($match = 0; $match < $numTeams / 2; $match++) {
                $home = ($round + $match) % ($numTeams - 1);
                $away = ($numTeams - 1 - $match + $round) % ($numTeams - 1);

                // Handle the fixed team (last team stays in position 19)
                if ($match == 0) {
                    $away = $numTeams - 1;
                }

                $roundFixtures[] = [
                    'home_team_id' => $teams[$home]->_id,
                    'away_team_id' => $teams[$away]->_id,
                ];
            }

            $fixtures[] = $roundFixtures;
        }

        // Verify we have exactly 19 rounds with 10 matches each
        $totalMatches = array_sum(array_map('count', $fixtures));
        $roundsCount = count($fixtures);
        $this->command->info("🔢 Generated {$roundsCount} rounds with {$totalMatches} total matches");

        return $fixtures;
    }

    /**
     * Generate unique game times between 11:00-21:00
     */
    private function generateUniqueGameTimes(int $count): array
    {
        $availableTimes = [];

        // Generate times from 11:00 to 21:00
        for ($hour = 11; $hour <= 21; $hour++) {
            $availableTimes[] = sprintf('%02d:00:00', $hour);
        }

        // Shuffle and take only what we need
        shuffle($availableTimes);
        return array_slice($availableTimes, 0, $count);
    }
}
