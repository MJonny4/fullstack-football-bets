<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Livewire\Home;
use App\Livewire\Auth\Login;
use App\Livewire\Auth\Register;
use App\Livewire\LeagueTable;
use App\Livewire\Dashboard;
use App\Livewire\FixturesAndResults;
use App\Livewire\BettingHistory;
use App\Livewire\LiveMatches;
use App\Livewire\IndividualMatch;

// Public routes (accessible to everyone)
Route::get('/', Home::class)->name('home');
Route::get('/league-table', LeagueTable::class)->name('league-table');
Route::get('/fixtures-and-results', FixturesAndResults::class)->name('fixtures-and-results');
Route::get('/live-matches', LiveMatches::class)->name('live-matches');
Route::get('/match/{matchId}', IndividualMatch::class)->name('individual-match');
Route::get('/login', Login::class)->name('login')->middleware('guest');
Route::get('/register', Register::class)->name('register')->middleware('guest');

// Protected routes (auth required)
Route::middleware('auth')->group(function () {
    // Dashboard - User's personal betting hub
    Route::get('/dashboard', Dashboard::class)->name('dashboard');

    // Betting History - User's bet tracking
    Route::get('/betting-history', BettingHistory::class)->name('betting-history');

    // Logout route
    Route::post('/logout', function () {
        Auth::logout();
        session()->invalidate();
        session()->regenerateToken();
        return redirect('/');
    })->name('logout');
});
