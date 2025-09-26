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
        Schema::create('league_tables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('season_id')->constrained()->onDelete('cascade');
            $table->foreignId('team_id')->constrained()->onDelete('cascade');
            $table->integer('position')->default(1);
            $table->integer('played')->default(0);
            $table->integer('won')->default(0);
            $table->integer('drawn')->default(0);
            $table->integer('lost')->default(0);
            $table->integer('goals_for')->default(0);
            $table->integer('goals_against')->default(0);
            $table->integer('goal_difference')->default(0);
            $table->integer('points')->default(0);
            $table->string('form', 5)->nullable(); // Last 5 results: WWLDL
            $table->integer('home_played')->default(0);
            $table->integer('home_won')->default(0);
            $table->integer('home_drawn')->default(0);
            $table->integer('home_lost')->default(0);
            $table->integer('home_goals_for')->default(0);
            $table->integer('home_goals_against')->default(0);
            $table->integer('away_played')->default(0);
            $table->integer('away_won')->default(0);
            $table->integer('away_drawn')->default(0);
            $table->integer('away_lost')->default(0);
            $table->integer('away_goals_for')->default(0);
            $table->integer('away_goals_against')->default(0);
            $table->timestamps();

            // Indexes for performance
            $table->index(['season_id', 'position']);
            $table->index(['season_id', 'points']);
            $table->unique(['season_id', 'team_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('league_tables');
    }
};
