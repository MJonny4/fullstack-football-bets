<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Team;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class TestUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🧪 Creating test user for GoalGuessers...');

        // Get a random favorite team
        $randomTeam = Team::inRandomOrder()->first();

        // Create the test user
        $user = User::updateOrCreate(
            ['email' => 'test@test.com'],
            [
                'name' => 'Test User',
                'email' => 'test@test.com',
                'password' => Hash::make('password'),
                'date_of_birth' => Carbon::create(1990, 5, 15), // Age 34, well above 18
                'email_verified_at' => now(),
                'virtual_balance' => 1000.00, // Starting balance
                'country' => 'ES',
                'timezone' => 'Europe/Madrid',
                'favorite_team_id' => $randomTeam?->id,
                'total_bets_placed' => 0,
                'total_winnings' => 0.00,
                'last_login_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        $this->command->info("✅ Test user created successfully!");
        $this->command->line("📧 Email: test@test.com");
        $this->command->line("🔑 Password: password");
        $this->command->line("💰 Starting Balance: €1,000.00");
        $this->command->line("⚽ Favorite Team: " . ($randomTeam?->name ?? 'None'));
        $this->command->line("🌍 Country: Spain (ES)");
        $this->command->line("🕐 Timezone: Europe/Madrid");

        // Optional: Create some test bets for demonstration
        if ($this->command->confirm('Would you like to create some sample bets for testing?', false)) {
            $this->createSampleBets($user);
        }
    }

    /**
     * Create some sample bets for testing the dashboard.
     */
    private function createSampleBets(User $user): void
    {
        $this->command->info('🎲 Creating sample betting data...');

        // Get some finished matches for creating historical bets
        $finishedMatches = \App\Models\FootballMatch::where('status', 'finished')
            ->with(['homeTeam', 'awayTeam'])
            ->limit(10)
            ->get();

        if ($finishedMatches->isEmpty()) {
            $this->command->warn('No finished matches found. Skipping sample bet creation.');
            return;
        }

        $betTypes = ['home', 'draw', 'away'];
        $sampleBets = [];

        foreach ($finishedMatches->take(8) as $match) {
            $betType = $betTypes[array_rand($betTypes)];
            $amount = rand(10, 100);
            $odds = round(rand(150, 400) / 100, 2); // 1.50 to 4.00

            // Determine if bet won based on match result
            $matchResult = $match->getResult(); // H, D, A
            $betWon = match ([$betType, $matchResult]) {
                ['home', 'H'] => true,
                ['draw', 'D'] => true,
                ['away', 'A'] => true,
                default => false,
            };

            $bet = [
                'user_id' => $user->id,
                'match_id' => $match->id,
                'bet_type' => $betType,
                'amount' => $amount,
                'odds' => $odds,
                'potential_winnings' => round($amount * $odds, 2),
                'status' => $betWon ? 'won' : 'lost',
                'actual_winnings' => $betWon ? round($amount * $odds, 2) : 0,
                'placed_at' => $match->kickoff_time->subHours(rand(1, 24)),
                'settled_at' => $match->kickoff_time->addHours(2),
                'created_at' => $match->kickoff_time->subHours(rand(1, 24)),
                'updated_at' => $match->kickoff_time->addHours(2),
            ];

            $sampleBets[] = $bet;
        }

        // Insert all bets
        \App\Models\Bet::insert($sampleBets);

        // Update user's balance and stats
        $totalWon = collect($sampleBets)->where('status', 'won')->sum('actual_winnings');
        $totalWagered = collect($sampleBets)->sum('amount');
        $netProfit = $totalWon - $totalWagered;

        $user->update([
            'virtual_balance' => 1000 + $netProfit,
            'total_bets_placed' => count($sampleBets),
            'total_winnings' => $totalWon,
        ]);

        $wonBets = collect($sampleBets)->where('status', 'won')->count();
        $winRate = count($sampleBets) > 0 ? round(($wonBets / count($sampleBets)) * 100, 1) : 0;

        $this->command->info("🎯 Created " . count($sampleBets) . " sample bets");
        $this->command->line("📊 Win Rate: {$winRate}%");
        $this->command->line("💰 Net Profit: €" . number_format($netProfit, 2));
        $this->command->line("💳 New Balance: €" . number_format(1000 + $netProfit, 2));
    }
}
