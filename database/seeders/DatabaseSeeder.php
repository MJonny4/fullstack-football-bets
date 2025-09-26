<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            TeamsSeeder::class,
            SeasonsSeeder::class,
            GameweeksSeeder::class,
            MatchesSeeder::class,
        ]);

        $this->command->info('🎉 GoalGuessers database seeding completed successfully!');
        $this->command->info('📊 Seeded: 20 teams, 1 season, 38 gameweeks, 380 matches');
        $this->command->info('🕐 Spanish timezone configured (Europe/Madrid)');
        $this->command->info('🚀 Ready for users and bets to be added manually!');
    }
}
