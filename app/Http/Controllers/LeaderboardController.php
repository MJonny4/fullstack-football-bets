<?php

namespace App\Http\Controllers;

use App\Models\Season;
use App\Models\User;
use App\Models\UserStats;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeaderboardController extends Controller
{
    public function index(Request $request)
    {
        $currentSeason = Season::where('active', true)->first();
        
        if (!$currentSeason) {
            return Inertia::render('Leaderboard/Index', [
                'leaderboard' => [],
                'currentSeason' => null,
                'message' => 'No active season found.'
            ]);
        }

        $leaderboard = UserStats::with('user')
                                ->where('season_id', $currentSeason->id)
                                ->orderBy('total_points', 'desc')
                                ->orderBy('accuracy_percentage', 'desc')
                                ->limit(50)
                                ->get();

        // Update rankings
        $leaderboard->each(function ($stats, $index) {
            $stats->rank = $index + 1;
            $stats->save();
        });

        return Inertia::render('Leaderboard/Index', [
            'leaderboard' => $leaderboard,
            'currentSeason' => $currentSeason,
            'userStats' => auth()->user() ? 
                UserStats::where('user_id', auth()->id())
                         ->where('season_id', $currentSeason->id)
                         ->first() : null
        ]);
    }

    // Individual user profile pages removed - not needed for this application

    public function api()
    {
        $currentSeason = Season::where('active', true)->first();
        
        if (!$currentSeason) {
            return response()->json([
                'leaderboard' => [],
                'message' => 'No active season found.'
            ]);
        }

        $leaderboard = UserStats::with('user:_id,name')
                                ->where('season_id', $currentSeason->id)
                                ->orderBy('total_points', 'desc')
                                ->orderBy('accuracy_percentage', 'desc')
                                ->limit(10)
                                ->get();

        return response()->json([
            'leaderboard' => $leaderboard,
            'season' => $currentSeason
        ]);
    }
}