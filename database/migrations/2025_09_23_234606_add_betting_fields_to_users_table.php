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
        Schema::table('users', function (Blueprint $table) {
            $table->date('date_of_birth')->nullable()->after('email');
            $table->decimal('virtual_balance', 10, 2)->default(1000.00)->after('password');
            $table->string('country', 2)->default('ES')->after('virtual_balance');
            $table->string('timezone')->default('Europe/Madrid')->after('country');
            $table->unsignedBigInteger('favorite_team_id')->nullable()->after('timezone');
            $table->integer('total_bets_placed')->default(0)->after('favorite_team_id');
            $table->decimal('total_winnings', 10, 2)->default(0.00)->after('total_bets_placed');
            $table->timestamp('last_login_at')->nullable()->after('total_winnings');

            $table->index(['country']);
            $table->index(['virtual_balance']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['country']);
            $table->dropIndex(['virtual_balance']);
            $table->dropColumn([
                'date_of_birth',
                'virtual_balance',
                'country',
                'timezone',
                'favorite_team_id',
                'total_bets_placed',
                'total_winnings',
                'last_login_at',
            ]);
        });
    }
};
