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
        Schema::create('gameweeks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('season_id')->constrained('seasons')->onDelete('cascade');
            $table->integer('number');
            $table->string('name');
            $table->timestamp('betting_deadline');
            $table->timestamp('first_match_date');
            $table->boolean('active')->default(false);
            $table->boolean('results_finalized')->default(false);
            $table->timestamps();

            $table->index(['season_id', 'number']);
            $table->index(['active']);
            $table->index(['betting_deadline']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gameweeks');
    }
};
