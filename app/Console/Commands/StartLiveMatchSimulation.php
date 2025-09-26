<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\FootballMatch;
use App\Services\LiveMatchSimulationService;
use Carbon\Carbon;

class StartLiveMatchSimulation extends Command
{
    protected $signature = 'simulation:start {match_id? : The ID of the match to start}';
    protected $description = 'Start live match simulation for a specific match or matches due to start';

    public function handle()
    {
        $simulationService = new LiveMatchSimulationService();
        $matchId = $this->argument('match_id');

        if ($matchId) {
            // Start specific match
            $match = FootballMatch::with(['homeTeam', 'awayTeam'])->find($matchId);

            if (!$match) {
                $this->error("Match with ID {$matchId} not found!");
                return;
            }

            $this->info("🚀 Starting live simulation for match ID {$matchId}:");
            $this->line("   {$match->homeTeam->name} vs {$match->awayTeam->name}");

            if ($simulationService->startLiveMatch($match)) {
                $this->info("✅ Live simulation started successfully!");
                $this->line("   Duration: 5 real minutes (90 match minutes)");
                $this->line("   🌐 Visit /live-matches to watch the simulation");
            } else {
                $this->error("❌ Failed to start live simulation");
            }
        } else {
            // Start matches that are due to start
            $now = Carbon::now('Europe/Madrid');
            $matchesToStart = FootballMatch::with(['homeTeam', 'awayTeam'])
                ->where('status', 'scheduled')
                ->where('kickoff_time', '<=', $now)
                ->get();

            if ($matchesToStart->isEmpty()) {
                $this->info("⏳ No matches due to start right now");
                return;
            }

            $this->info("🚀 Starting {$matchesToStart->count()} match(es):");
            $this->newLine();

            foreach ($matchesToStart as $match) {
                $this->line("   ⚽ {$match->homeTeam->name} vs {$match->awayTeam->name}");

                if ($simulationService->startLiveMatch($match)) {
                    $this->line("   ✅ Started successfully");
                } else {
                    $this->error("   ❌ Failed to start");
                }

                $this->newLine();
            }

            $this->info("🏆 Live simulations initiated!");
            $this->line("🌐 Visit /live-matches to watch the simulations");
        }
    }
}