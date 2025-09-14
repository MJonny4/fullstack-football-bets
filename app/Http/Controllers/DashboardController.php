<?php

namespace App\Http\Controllers;

use App\Models\Bet;
use App\Models\FootballMatch;
use App\Models\Gameweek;
use App\Models\Season;
use App\Models\UserStats;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $currentSeason = Season::where('active', true)->first();
        $currentGameweek = Gameweek::where('active', true)->first();
        
        // Get upcoming matches
        $upcomingMatches = FootballMatch::with(['homeTeam', 'awayTeam', 'gameweek'])
                                       ->where('kickoff_time', '>', now())
                                       ->where('status', '!=', 'finished')
                                       ->orderBy('kickoff_time', 'asc')
                                       ->limit(5)
                                       ->get();

        // Get live matches
        $liveMatches = FootballMatch::with(['homeTeam', 'awayTeam', 'gameweek'])
                                   ->where('status', 'live')
                                   ->orderBy('kickoff_time', 'asc')
                                   ->get();

        // Get user stats for current season
        $userStats = null;
        $recentBets = collect();
        $pendingBets = 0;
        
        if (Auth::check() && $currentSeason) {
            $userStats = UserStats::where('user_id', Auth::id())
                                 ->where('season_id', $currentSeason->id)
                                 ->first();

            // If no stats exist, create them
            if (!$userStats) {
                $userStats = UserStats::create([
                    'user_id' => Auth::id(),
                    'season_id' => $currentSeason->id,
                    'total_points' => 0,
                    'correct_predictions' => 0,
                    'total_predictions' => 0,
                    'accuracy_percentage' => 0,
                    'rank' => 0
                ]);
            }

            // Get recent bets
            $recentBets = Bet::with(['match.homeTeam', 'match.awayTeam', 'match.gameweek'])
                            ->where('user_id', Auth::id())
                            ->orderBy('created_at', 'desc')
                            ->limit(5)
                            ->get();

            // Count pending bets (matches not started yet)
            $pendingBets = Bet::whereHas('match', function ($query) {
                                $query->where('kickoff_time', '>', now());
                            })
                            ->where('user_id', Auth::id())
                            ->count();
        }

        // Get top 5 leaderboard
        $topLeaderboard = collect();
        if ($currentSeason) {
            $topLeaderboard = UserStats::with('user:_id,name')
                                      ->where('season_id', $currentSeason->id)
                                      ->orderBy('total_points', 'desc')
                                      ->orderBy('accuracy_percentage', 'desc')
                                      ->limit(5)
                                      ->get();
        }

        return Inertia::render('dashboard', [
            'upcomingMatches' => $upcomingMatches,
            'liveMatches' => $liveMatches,
            'currentGameweek' => $currentGameweek,
            'currentSeason' => $currentSeason,
            'userStats' => $userStats,
            'recentBets' => $recentBets,
            'pendingBets' => $pendingBets,
            'topLeaderboard' => $topLeaderboard
        ]);
    }

    public function stats()
    {
        if (!Auth::check()) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $currentSeason = Season::where('active', true)->first();
        
        if (!$currentSeason) {
            return response()->json(['message' => 'No active season'], 404);
        }

        $userStats = UserStats::where('user_id', Auth::id())
                             ->where('season_id', $currentSeason->id)
                             ->first();

        if ($userStats) {
            $userStats->updateStats();
        }

        return response()->json([
            'userStats' => $userStats,
            'season' => $currentSeason
        ]);
    }
}