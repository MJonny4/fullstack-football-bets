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
        Schema::create('achievements', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // Unique identifier for the achievement
            $table->string('name'); // Display name
            $table->text('description'); // What the achievement is for
            $table->string('icon')->default('🏆'); // Emoji or icon class
            $table->string('category'); // e.g., 'betting', 'profit', 'streak', 'milestone'
            $table->string('type'); // e.g., 'count', 'amount', 'percentage', 'streak'
            $table->decimal('target_value', 15, 2)->nullable(); // Target to achieve (e.g., 100 for 100 bets)
            $table->string('rarity')->default('common'); // common, rare, epic, legendary
            $table->integer('points')->default(10); // Points awarded for this achievement
            $table->boolean('is_active')->default(true); // Can be disabled
            $table->json('metadata')->nullable(); // Additional data for complex achievements
            $table->timestamps();

            $table->index(['category', 'type']);
            $table->index('rarity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('achievements');
    }
};
