<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Livewire\Home\Home;
use App\Livewire\Auth\Login;
use App\Livewire\Auth\Register;
use App\Livewire\League\LeagueTable;
use App\Livewire\Account\Dashboard;
use App\Livewire\Matches\FixturesAndResults;
use App\Livewire\Matches\LiveMatches;
use App\Livewire\Matches\IndividualMatch;
use App\Livewire\Account\Profile;
use App\Livewire\Account\TransactionHistory;
use App\Livewire\League\Leaderboards;
use App\Livewire\About\About;

// Public routes (accessible to everyone)
Route::get('/', Home::class)->name('home');
Route::get('/league-table', LeagueTable::class)->name('league-table');
Route::get('/fixtures-and-results', FixturesAndResults::class)->name('fixtures-and-results');
Route::get('/live-matches', LiveMatches::class)->name('live-matches');
Route::get('/match/{matchId}', IndividualMatch::class)->name('individual-match');
Route::get('/about', About::class)->name('about');
Route::get('/login', Login::class)->name('login')->middleware('guest');
Route::get('/register', Register::class)->name('register')->middleware('guest');

// Protected routes (auth required)
Route::middleware('auth')->group(function () {
    // Dashboard - User's personal betting hub
    Route::get('/dashboard', Dashboard::class)->name('dashboard');


    // Profile - User's account settings
    Route::get('/profile', Profile::class)->name('profile');

    // Betting & Transaction History - Unified view
    Route::get('/transactions', TransactionHistory::class)->name('transaction-history');
    Route::get('/betting-history', TransactionHistory::class)->name('betting-history'); // Alias for backward compatibility

    // Leaderboards - Global rankings and competition
    Route::get('/leaderboards', Leaderboards::class)->name('leaderboards');

    // Logout route
    Route::post('/logout', function () {
        Auth::logout();
        session()->invalidate();
        session()->regenerateToken();
        return redirect('/');
    })->name('logout');
});
