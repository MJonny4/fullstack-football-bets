<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class GameweeksSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Set timezone to Europe/Madrid (Spanish timezone)
        $timezone = 'Europe/Madrid';

        // Get the season ID (assuming it was just created)
        $seasonId = DB::table('seasons')->where('active', true)->first()->id;

        $gameweeks = [];

        // Generate all 38 gameweeks starting October 1st, 2025
        for ($i = 1; $i <= 38; $i++) {
            // Each gameweek starts 7 days after the previous one
            $gameweekStartDate = Carbon::create(2025, 10, 1, 13, 0, 0, $timezone)->addWeeks($i - 1);

            // Betting deadline is 23:59 the day before first match
            $bettingDeadline = $gameweekStartDate->copy()->subDay()->setTime(23, 59, 59);

            $gameweeks[] = [
                'season_id' => $seasonId,
                'number' => $i,
                'name' => "Gameweek {$i}",
                'betting_deadline' => $bettingDeadline->utc(), // Store in UTC
                'first_match_date' => $gameweekStartDate->utc(), // Store in UTC
                'active' => $i === 1, // Only first gameweek is active initially
                'results_finalized' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('gameweeks')->insert($gameweeks);

        $this->command->info('✅ Created 38 gameweeks with Spanish timezone (Europe/Madrid)!');
        $this->command->info("📅 Season starts: October 1st, 2025 at 13:00 (1 PM Spanish time)");
        $this->command->info("⏰ Betting deadline: 23:59 day before each gameweek");
    }
}
