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
            $table->timestamp('simulation_started_at')->nullable()->after('started_at');
            $table->integer('current_match_minute')->default(0)->after('simulation_started_at');
            $table->enum('simulation_status', ['pending', 'active', 'paused', 'completed'])->default('pending')->after('current_match_minute');
            $table->timestamp('next_event_check')->nullable()->after('simulation_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('matches', function (Blueprint $table) {
            $table->dropColumn(['simulation_started_at', 'current_match_minute', 'simulation_status', 'next_event_check']);
        });
    }
};