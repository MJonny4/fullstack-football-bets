<?php

namespace App\Http\Controllers;

use App\Models\FootballMatch;
use Illuminate\Http\Request;

class MatchController extends Controller
{
    // Web routes removed - matches are integrated into betting page

    public function upcoming()
    {
        $matches = FootballMatch::with(['homeTeam', 'awayTeam', 'gameweek'])
                                ->where('kickoff_time', '>', now())
                                ->where('status', '!=', 'finished')
                                ->orderBy('kickoff_time', 'asc')
                                ->limit(10)
                                ->get();

        return response()->json($matches);
    }

    public function live()
    {
        $matches = FootballMatch::with(['homeTeam', 'awayTeam', 'gameweek'])
                                ->where('status', 'live')
                                ->orderBy('kickoff_time', 'asc')
                                ->get();

        return response()->json($matches);
    }
}