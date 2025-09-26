<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TeamsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $teams = [
            [
                'name' => 'Azure Knights',
                'short_name' => 'AZK',
                'logo_url' => '/images/teams/azure-knights.png',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Copper Cobras',
                'short_name' => 'CPC',
                'logo_url' => '/images/teams/copper-cobras.png',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Crimson Eagles',
                'short_name' => 'CRE',
                'logo_url' => '/images/teams/crimson-eagles.png',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Emerald Falcons',
                'short_name' => 'EMF',
                'logo_url' => '/images/teams/emerald-falcons.png',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Fire Dragons',
                'short_name' => 'FDR',
                'logo_url' => '/images/teams/fire-dragons.png',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Golden Spartans',
                'short_name' => 'GSP',
                'logo_url' => '/images/teams/golden-spartans.png',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Ice Titans',
                'short_name' => 'ICT',
                'logo_url' => '/images/teams/ice-titans.png',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Mystic Meteors',
                'short_name' => 'MYM',
                'logo_url' => '/images/teams/mystic-meteors.png',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Neon Nighthawks',
                'short_name' => 'NNH',
                'logo_url' => '/images/teams/neon-nighthawks.png',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Nova Nomads',
                'short_name' => 'NON',
                'logo_url' => '/images/teams/nova-nomads.png',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Plasma Phoenix',
                'short_name' => 'PPH',
                'logo_url' => '/images/teams/plasma-phoenix.png',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Quantum Quakes',
                'short_name' => 'QQU',
                'logo_url' => '/images/teams/quantum-quakes.png',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Rift Runners',
                'short_name' => 'RFR',
                'logo_url' => '/images/teams/rift-runners.png',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Royal Raptors',
                'short_name' => 'RRP',
                'logo_url' => '/images/teams/royal-raptors.png',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Shadow Panthers',
                'short_name' => 'SHP',
                'logo_url' => '/images/teams/shadow-panthers.png',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Silver Stallions',
                'short_name' => 'SST',
                'logo_url' => '/images/teams/silver-stallions.png',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Steel Lions',
                'short_name' => 'STL',
                'logo_url' => '/images/teams/steel-lions.png',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Thunder Wolves',
                'short_name' => 'TWV',
                'logo_url' => '/images/teams/thunder-wolves.png',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Violet Vipers',
                'short_name' => 'VVP',
                'logo_url' => '/images/teams/violet-vipers.png',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Zenith Zephyrs',
                'short_name' => 'ZZE',
                'logo_url' => '/images/teams/zenith-zephyrs.png',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('teams')->insert($teams);

        $this->command->info('✅ Created 20 teams with logos for The Apex League!');
    }
}
