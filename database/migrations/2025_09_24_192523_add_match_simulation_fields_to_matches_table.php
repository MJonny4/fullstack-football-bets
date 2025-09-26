<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('matches', function (Blueprint $table) {
            // Match result and events
            $table->enum('match_result', ['home', 'draw', 'away'])->nullable()->after('away_goals');
            $table->json('match_events')->nullable()->after('match_result');
            $table->json('match_stats')->nullable()->after('match_events');

            // Match timing
            $table->timestamp('started_at')->nullable()->after('match_stats');
            $table->timestamp('finished_at')->nullable()->after('started_at');

            // Additional match data
            $table->integer('attendance')->nullable()->after('finished_at');
            $table->text('referee')->nullable()->after('attendance');

            // Indexes for performance
            $table->index('match_result');
            $table->index('started_at');
            $table->index('finished_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('matches', function (Blueprint $table) {
            $table->dropIndex(['match_result']);
            $table->dropIndex(['started_at']);
            $table->dropIndex(['finished_at']);

            $table->dropColumn([
                'match_result',
                'match_events',
                'match_stats',
                'started_at',
                'finished_at',
                'attendance',
                'referee'
            ]);
        });
    }
};
