<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\MatchSimulationService;
use App\Models\FootballMatch;

class StartLiveTest extends Command
{
    protected $signature = 'matches:start-live-test {count=2 : Number of matches to start as live}';
    protected $description = 'Start some matches as live for testing the live matches system';

    public function handle()
    {
        $count = (int) $this->argument('count');
        $simulationService = new MatchSimulationService();

        // Get some scheduled matches
        $matches = FootballMatch::where('status', 'scheduled')
            ->with(['homeTeam', 'awayTeam'])
            ->limit($count)
            ->get();

        if ($matches->isEmpty()) {
            $this->error('No scheduled matches found to start as live');
            return;
        }

        $this->info("🔴 Starting {$matches->count()} match(es) as LIVE:");
        $this->newLine();

        foreach ($matches as $match) {
            // Start the match (sets status to live)
            $success = $simulationService->startMatch($match);

            if ($success) {
                // Add some fake current goals for testing
                $homeGoals = rand(0, 3);
                $awayGoals = rand(0, 3);

                $match->update([
                    'home_goals' => $homeGoals,
                    'away_goals' => $awayGoals,
                ]);

                $this->line("   ⚽ {$match->homeTeam->name} {$homeGoals}-{$awayGoals} {$match->awayTeam->name}");
                $this->line("   ✅ Started as LIVE match");
            } else {
                $this->error("   ❌ Failed to start {$match->homeTeam->name} vs {$match->awayTeam->name}");
            }

            $this->newLine();
        }

        $this->info('🏆 Live test matches started!');
        $this->line('🌐 Visit /live-matches or the home page to see them in action');
    }
}