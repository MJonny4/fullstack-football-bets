<?php

namespace App\Http\Controllers;

use App\Models\Bet;
use App\Models\FootballMatch;
use App\Models\Gameweek;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BettingController extends Controller
{
    public function index()
    {
        $currentGameweek = Gameweek::where('active', true)->first();
        
        if (!$currentGameweek) {
            return Inertia::render('Betting/Index', [
                'matches' => [],
                'userBets' => [],
                'currentGameweek' => null,
                'message' => 'No active gameweek found.'
            ]);
        }

        $matches = FootballMatch::with(['homeTeam', 'awayTeam'])
                                ->where('gameweek_id', $currentGameweek->_id)
                                ->orderBy('kickoff_time', 'asc')
                                ->get();


        $userBets = [];
        if (Auth::check()) {
            $userBets = Bet::where('user_id', Auth::id())
                          ->whereIn('match_id', $matches->pluck('id'))
                          ->get()
                          ->keyBy('match_id');
        }

        return Inertia::render('Betting/Index', [
            'matches' => $matches,
            'userBets' => $userBets,
            'currentGameweek' => $currentGameweek,
            'deadline' => $currentGameweek->deadline_time
        ]);
    }

    public function store(Request $request)
    {

        $request->validate([
            'match_id' => 'required|string',
            'prediction' => 'required|in:1,X,2'
        ]);

        $match = FootballMatch::findOrFail($request->match_id);

        // Check if betting is still allowed
        if ($match->hasStarted()) {
            return back()->withErrors(['betting' => 'Betting is closed for this match.']);
        }

        // Check if user already has a bet for this match
        $existingBet = Bet::where('user_id', Auth::id())
                         ->where('match_id', $request->match_id)
                         ->first();

        if ($existingBet) {
            // Update existing bet
            $existingBet->update([
                'prediction' => $request->prediction
            ]);
            $bet = $existingBet;
        } else {
            // Create new bet
            $bet = Bet::create([
                'user_id' => Auth::id(),
                'match_id' => $request->match_id,
                'prediction' => $request->prediction,
                'points_awarded' => 0,
                'is_correct' => false
            ]);
        }


        // Get updated user bets for the current gameweek
        $currentGameweek = Gameweek::where('active', true)->first();
        $matches = FootballMatch::where('gameweek_id', $currentGameweek->_id)->get();
        $userBets = Bet::where('user_id', Auth::id())
                      ->whereIn('match_id', $matches->pluck('id'))
                      ->get()
                      ->keyBy('match_id');

        return back()->with([
            'message' => 'Bet placed successfully!',
            'userBets' => $userBets
        ]);
    }

    public function update(Request $request, Bet $bet)
    {
        // Check if user owns this bet
        if ($bet->user_id !== Auth::id()) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $request->validate([
            'prediction' => 'required|in:1,X,2'
        ]);

        $match = $bet->match;
        
        // Check if betting is still allowed
        if ($match->hasStarted()) {
            return response()->json([
                'message' => 'Betting is closed for this match.'
            ], 400);
        }

        $bet->update([
            'prediction' => $request->prediction
        ]);

        return response()->json([
            'bet' => $bet,
            'message' => 'Bet updated successfully!'
        ]);
    }

    public function destroy(Bet $bet)
    {
        // Check if user owns this bet
        if ($bet->user_id !== Auth::id()) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $match = $bet->match;
        
        // Check if betting is still allowed
        if ($match->hasStarted()) {
            return response()->json([
                'message' => 'Cannot delete bet after match has started.'
            ], 400);
        }

        $bet->delete();

        return response()->json([
            'message' => 'Bet deleted successfully!'
        ]);
    }

    public function myBets()
    {
        $bets = Bet::with(['match.homeTeam', 'match.awayTeam', 'match.gameweek'])
                  ->where('user_id', Auth::id())
                  ->orderBy('created_at', 'desc')
                  ->paginate(20);

        return Inertia::render('Betting/MyBets', [
            'bets' => $bets
        ]);
    }
}