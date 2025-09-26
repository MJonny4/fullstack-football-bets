<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\LiveMatchSimulationService;
use Carbon\Carbon;

class UpdateLiveMatchSimulations extends Command
{
    protected $signature = 'simulation:update';
    protected $description = 'Update all active live match simulations';

    public function handle()
    {
        $simulationService = new LiveMatchSimulationService();

        // Get matches that need updates
        $activeMatches = LiveMatchSimulationService::getActiveMatches();

        if ($activeMatches->isEmpty()) {
            $this->line("⏳ No active simulations to update");
            return;
        }

        $this->line("🔄 Updating {$activeMatches->count()} active simulation(s):");

        foreach ($activeMatches as $match) {
            $updated = $simulationService->updateMatchState($match);

            $match->refresh(); // Refresh to get latest data

            if ($updated) {
                $status = $match->simulation_status === 'completed' ? '🏁 FINISHED' : '⚽ LIVE';
                $this->line("   {$status} {$match->homeTeam->name} {$match->home_goals}-{$match->away_goals} {$match->awayTeam->name} ({$match->current_match_minute}')");
            } else {
                $this->error("   ❌ Failed to update match {$match->id}");
            }
        }

        $this->line("✅ Simulation updates completed");
    }
}
