<?php

use App\Http\Controllers\BettingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\MatchController;
use App\Http\Controllers\TeamController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/about', function () {
    return Inertia::render('about');
})->name('about');

Route::get('/age-verification', function() {
    return Inertia::render('auth/age-verification');
})->name('age-verification')->middleware('auth');

// Public routes (matches are integrated into betting page)
Route::get('/leaderboard', [LeaderboardController::class, 'index'])->name('leaderboard.index');
Route::get('/teams', [TeamController::class, 'index'])->name('teams.index');

// API routes for public data
Route::prefix('api')->group(function () {
    Route::get('/matches/upcoming', [MatchController::class, 'upcoming']);
    Route::get('/matches/live', [MatchController::class, 'live']);
    Route::get('/leaderboard', [LeaderboardController::class, 'api']);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('api/dashboard/stats', [DashboardController::class, 'stats']);
});

Route::middleware(['auth', 'verified', 'adult'])->group(function () {
    // Betting routes
    Route::get('/betting', [BettingController::class, 'index'])->name('betting.index');
    Route::post('/betting', [BettingController::class, 'store'])->name('betting.store');
    Route::put('/betting/{bet}', [BettingController::class, 'update'])->name('betting.update');
    Route::delete('/betting/{bet}', [BettingController::class, 'destroy'])->name('betting.destroy');
    Route::get('/my-bets', [BettingController::class, 'myBets'])->name('betting.myBets');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
