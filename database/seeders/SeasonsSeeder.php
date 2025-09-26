<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SeasonsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $season = [
            'name' => '2025/26 The Apex League',
            'year' => 2025,
            'start_date' => '2025-10-01',
            'end_date' => '2026-05-31',
            'active' => true,
            'total_gameweeks' => 38,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        DB::table('seasons')->insert($season);

        $this->command->info('✅ Created 2025/26 season starting October 1st, 2025!');
    }
}
