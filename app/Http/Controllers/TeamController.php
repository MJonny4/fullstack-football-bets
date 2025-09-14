<?php

namespace App\Http\Controllers;

use App\Models\Team;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TeamController extends Controller
{
    public function index()
    {
        $teams = Team::where('active', true)
                    ->orderBy('name')
                    ->get();

        return Inertia::render('Teams/Index', [
            'teams' => $teams
        ]);
    }

    public function show(Team $team)
    {
        $team->load([
            'homeMatches.awayTeam', 
            'homeMatches.gameweek',
            'awayMatches.homeTeam', 
            'awayMatches.gameweek'
        ]);

        return Inertia::render('Teams/Show', [
            'team' => $team
        ]);
    }
}