<?php

namespace Database\Seeders;

use App\Models\Season;
use App\Models\Gameweek;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class SeasonsAndGameweeksSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create 2025/26 Legendary League Season
        // Season duration: 38 gameweeks × 4 days max = 152 days
        $startDate = Carbon::create(2025, 10, 1); // October 1, 2025
        $endDate = $startDate->copy()->addDays(38 * 4); // 152 days later = March 2, 2026

        $season = Season::create([
            'name' => '2025/26 Legendary League',
            'year' => '2025/26',
            'start_date' => $startDate,
            'end_date' => $endDate,
            'active' => true,
        ]);

        $this->command->info('✅ Created season: ' . $season->name);

        // Create 38 gameweeks (double round-robin: 19 + 19)
        $gameweekStartDate = Carbon::create(2025, 10, 4); // First gameweek starts October 4 (Saturday)

        for ($i = 1; $i <= 38; $i++) {
            // Calculate gameweek dates (every 7 days, with some 3-4 day gaps for midweek games)
            $isFirstHalf = $i <= 19;
            $weekNumber = $isFirstHalf ? $i : $i - 19;

            $startDate = $gameweekStartDate->copy()->addWeeks($i - 1);

            // Some gameweeks have 3-4 day gaps (midweek matches)
            if ($i % 3 == 0) {
                $startDate = $startDate->addDays(3); // Midweek games every 3rd gameweek
            }

            $endDate = $startDate->copy()->addDays(3); // Gameweek lasts 3-4 days
            $deadlineTime = $startDate->copy()->subDay(); // Deadline 1 day before gameweek starts

            $gameweekName = $isFirstHalf
                ? "Gameweek {$weekNumber}"
                : "Gameweek {$weekNumber} (Return Leg)";

            Gameweek::create([
                'season_id' => $season->_id,
                'number' => $i,
                'name' => $gameweekName,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'deadline_time' => $deadlineTime,
                'active' => $i == 1, // Only first gameweek active initially
            ]);
        }

        $this->command->info('✅ Created 38 gameweeks with 3-4 day scheduling!');
        $this->command->info('📅 Season runs from October 1, 2025 to March 2, 2026 (152 days)');
        $this->command->info('🏆 Ready for double round-robin fixtures!');
    }
}
