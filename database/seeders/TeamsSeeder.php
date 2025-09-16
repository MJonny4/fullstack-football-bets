<?php

namespace Database\Seeders;

use App\Models\Team;
use Illuminate\Database\Seeder;

class TeamsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $teams = [
            [
                'name' => 'Thunder Wolves',
                'short_name' => 'TWV',
                'logo_url' => null, // Will use automatic fallback to /images/teams/thunder-wolves.png
                'country' => 'Legendary League',
                'active' => true,
            ],
            [
                'name' => 'Steel Lions',
                'short_name' => 'STL',
                'logo_url' => null,
                'country' => 'Legendary League',
                'active' => true,
            ],
            [
                'name' => 'Crimson Eagles',
                'short_name' => 'CRE',
                'logo_url' => null,
                'country' => 'Legendary League',
                'active' => true,
            ],
            [
                'name' => 'Azure Knights',
                'short_name' => 'AZK',
                'logo_url' => null,
                'country' => 'Legendary League',
                'active' => true,
            ],
            [
                'name' => 'Golden Spartans',
                'short_name' => 'GSP',
                'logo_url' => null,
                'country' => 'Legendary League',
                'active' => true,
            ],
            [
                'name' => 'Shadow Panthers',
                'short_name' => 'SHP',
                'logo_url' => null,
                'country' => 'Legendary League',
                'active' => true,
            ],
            [
                'name' => 'Fire Dragons',
                'short_name' => 'FDR',
                'logo_url' => null,
                'country' => 'Legendary League',
                'active' => true,
            ],
            [
                'name' => 'Ice Titans',
                'short_name' => 'ICT',
                'logo_url' => null,
                'country' => 'Legendary League',
                'active' => true,
            ],
            [
                'name' => 'Emerald Falcons',
                'short_name' => 'EMF',
                'logo_url' => null,
                'country' => 'Legendary League',
                'active' => true,
            ],
            [
                'name' => 'Violet Vipers',
                'short_name' => 'VVP',
                'logo_url' => null,
                'country' => 'Legendary League',
                'active' => true,
            ],
            [
                'name' => 'Silver Stallions',
                'short_name' => 'SST',
                'logo_url' => null,
                'country' => 'Legendary League',
                'active' => true,
            ],
            [
                'name' => 'Copper Cobras',
                'short_name' => 'CPC',
                'logo_url' => null,
                'country' => 'Legendary League',
                'active' => true,
            ],
            [
                'name' => 'Neon Nighthawks',
                'short_name' => 'NNH',
                'logo_url' => null,
                'country' => 'Legendary League',
                'active' => true,
            ],
            [
                'name' => 'Royal Raptors',
                'short_name' => 'RRP',
                'logo_url' => null,
                'country' => 'Legendary League',
                'active' => true,
            ],
            [
                'name' => 'Plasma Phoenix',
                'short_name' => 'PPH',
                'logo_url' => null,
                'country' => 'Legendary League',
                'active' => true,
            ],
            [
                'name' => 'Quantum Quakes',
                'short_name' => 'QQU',
                'logo_url' => null,
                'country' => 'Legendary League',
                'active' => true,
            ],
            [
                'name' => 'Mystic Meteors',
                'short_name' => 'MYM',
                'logo_url' => null,
                'country' => 'Legendary League',
                'active' => true,
            ],
            [
                'name' => 'Rift Runners',
                'short_name' => 'RFR',
                'logo_url' => null,
                'country' => 'Legendary League',
                'active' => true,
            ],
            [
                'name' => 'Nova Nomads',
                'short_name' => 'NON',
                'logo_url' => null,
                'country' => 'Legendary League',
                'active' => true,
            ],
            [
                'name' => 'Zenith Zephyrs',
                'short_name' => 'ZZE',
                'logo_url' => null,
                'country' => 'Legendary League',
                'active' => true,
            ],
        ];

        foreach ($teams as $teamData) {
            Team::create($teamData);
        }

        $this->command->info('✅ Created 20 teams for the Legendary League!');
    }
}
