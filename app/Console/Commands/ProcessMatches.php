<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\MatchSimulationService;
use App\Models\FootballMatch;
use Carbon\Carbon;

class ProcessMatches extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'matches:process {--dry-run : Show what would be processed without actually doing it}';

    /**
     * The console command description.
     */
    protected $description = 'Process scheduled matches: start live matches and finish completed ones';

    private MatchSimulationService $simulationService;

    public function __construct()
    {
        parent::__construct();
        $this->simulationService = new MatchSimulationService();
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $isDryRun = $this->option('dry-run');

        if ($isDryRun) {
            $this->info('🔍 DRY RUN MODE - No changes will be made');
            $this->newLine();
        }

        $this->info('🏈 Processing scheduled matches...');

        // Start matches that should be live now
        $this->startScheduledMatches($isDryRun);

        // Finish live matches that have been running for 90+ minutes
        $this->finishLiveMatches($isDryRun);

        $this->info('✅ Match processing completed!');
    }

    /**
     * Start matches that are scheduled to begin now.
     */
    private function startScheduledMatches(bool $isDryRun): void
    {
        $matchesToStart = $this->simulationService->getMatchesToStart();

        if ($matchesToStart->isEmpty()) {
            $this->info('📅 No matches to start at this time');
            return;
        }

        $this->info("🚀 Starting {$matchesToStart->count()} match(es):");

        foreach ($matchesToStart as $match) {
            $homeTeam = $match->homeTeam->name;
            $awayTeam = $match->awayTeam->name;
            $kickoffTime = $match->kickoff_time->setTimezone('Europe/Madrid')->format('H:i');

            $this->line("   • {$homeTeam} vs {$awayTeam} (Kickoff: {$kickoffTime})");

            if (!$isDryRun) {
                $success = $this->simulationService->startMatch($match);
                if ($success) {
                    $this->line("     ✅ Match started successfully", 'info');
                } else {
                    $this->line("     ❌ Failed to start match", 'error');
                }
            }
        }

        $this->newLine();
    }

    /**
     * Finish live matches that have been running long enough.
     */
    private function finishLiveMatches(bool $isDryRun): void
    {
        $matchesToFinish = $this->simulationService->getLiveMatchesToFinish();

        if ($matchesToFinish->isEmpty()) {
            $this->info('⏱️  No live matches to finish at this time');
            return;
        }

        $this->info("🏁 Finishing {$matchesToFinish->count()} match(es):");

        foreach ($matchesToFinish as $match) {
            $homeTeam = $match->homeTeam->name;
            $awayTeam = $match->awayTeam->name;
            $startedAt = $match->started_at->setTimezone('Europe/Madrid')->format('H:i');
            $runningTime = $match->started_at->diffInMinutes(Carbon::now('Europe/Madrid'));

            $this->line("   • {$homeTeam} vs {$awayTeam} (Started: {$startedAt}, Running: {$runningTime} min)");

            if (!$isDryRun) {
                // Simulate the match
                $simulationResult = $this->simulationService->simulateMatch($match);

                // Process the result
                $success = $this->simulationService->processMatchResult($match, $simulationResult);

                if ($success) {
                    $score = "{$simulationResult['home_goals']}-{$simulationResult['away_goals']}";
                    $result = ucfirst($simulationResult['result']);
                    $this->line("     ✅ Final Score: {$score} ({$result} Win)", 'info');
                    $this->line("     💰 Bets settled automatically", 'comment');
                } else {
                    $this->line("     ❌ Failed to finish match", 'error');
                }
            } else {
                // Show what would happen in dry run
                $this->line("     🎲 Would simulate match and settle bets", 'comment');
            }
        }

        $this->newLine();
    }

    /**
     * Show current match status summary.
     */
    private function showMatchSummary(): void
    {
        $this->info('📊 Current Match Status:');

        $scheduled = FootballMatch::where('status', 'scheduled')->count();
        $live = FootballMatch::where('status', 'live')->count();
        $finished = FootballMatch::where('status', 'finished')->count();

        $this->table(
            ['Status', 'Count'],
            [
                ['Scheduled', $scheduled],
                ['Live', $live],
                ['Finished', $finished],
            ]
        );
    }
}