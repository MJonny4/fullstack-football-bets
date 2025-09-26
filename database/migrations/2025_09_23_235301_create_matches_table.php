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
        Schema::create('matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gameweek_id')->constrained('gameweeks')->onDelete('cascade');
            $table->foreignId('home_team_id')->constrained('teams')->onDelete('cascade');
            $table->foreignId('away_team_id')->constrained('teams')->onDelete('cascade');
            $table->timestamp('kickoff_time');
            $table->enum('status', ['scheduled', 'live', 'finished', 'postponed'])->default('scheduled');
            $table->integer('home_goals')->nullable();
            $table->integer('away_goals')->nullable();
            $table->timestamps();

            $table->index(['gameweek_id']);
            $table->index(['status']);
            $table->index(['kickoff_time']);
            $table->index(['home_team_id', 'away_team_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('matches');
    }
};
