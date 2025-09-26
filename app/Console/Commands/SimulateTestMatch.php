<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\MatchSimulationService;
use App\Models\FootballMatch;

class SimulateTestMatch extends Command
{
    protected $signature = 'matches:simulate-test {count=1 : Number of matches to simulate}';
    protected $description = 'Simulate test matches for development and testing';

    public function handle()
    {
        $count = (int) $this->argument('count');
        $simulationService = new MatchSimulationService();

        // Get some scheduled matches to simulate
        $matches = FootballMatch::where('status', 'scheduled')
            ->with(['homeTeam', 'awayTeam'])
            ->limit($count)
            ->get();

        if ($matches->isEmpty()) {
            $this->error('No scheduled matches found to simulate');
            return;
        }

        $this->info("🎲 Simulating {$matches->count()} match(es):");
        $this->newLine();

        foreach ($matches as $match) {
            $this->info("⚽ {$match->homeTeam->name} vs {$match->awayTeam->name}");

            // Start the match
            $simulationService->startMatch($match);

            // Simulate the match
            $result = $simulationService->simulateMatch($match);

            // Process the result
            $success = $simulationService->processMatchResult($match, $result);

            if ($success) {
                $score = "{$result['home_goals']}-{$result['away_goals']}";
                $winner = ucfirst($result['result']);
                $this->line("   ✅ Final Score: {$score} ({$winner} Win)");
                $this->line("   🎯 Events: " . count($result['events']) . " match events");
                $this->line("   👥 Attendance: " . number_format($result['attendance']));
                $this->line("   💰 Bets settled automatically");
            } else {
                $this->error("   ❌ Failed to process match");
            }

            $this->newLine();
        }

        $this->info('🏆 Test simulation completed!');
    }
}
