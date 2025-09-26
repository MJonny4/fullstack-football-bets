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
        Schema::create('bets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('match_id')->constrained('matches')->onDelete('cascade');
            $table->enum('bet_type', ['home', 'draw', 'away']);
            $table->decimal('amount', 10, 2); // Bet amount in virtual currency
            $table->decimal('odds', 5, 2); // Odds at time of bet placement
            $table->decimal('potential_winnings', 10, 2); // Calculated potential winnings
            $table->enum('status', ['pending', 'won', 'lost', 'void'])->default('pending');
            $table->decimal('actual_winnings', 10, 2)->nullable(); // Actual winnings after match result
            $table->timestamp('placed_at'); // When the bet was placed
            $table->timestamp('settled_at')->nullable(); // When the bet was settled
            $table->json('bet_details')->nullable(); // Store additional bet information
            $table->timestamps();

            // Indexes for performance
            $table->index(['user_id', 'status']);
            $table->index(['match_id', 'status']);
            $table->index(['placed_at']);
            $table->index(['status']);

            // Constraint: User cannot bet on same match twice with same bet_type
            $table->unique(['user_id', 'match_id', 'bet_type'], 'unique_user_match_bet');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bets');
    }
};
