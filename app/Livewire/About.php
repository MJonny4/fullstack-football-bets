<?php

namespace App\Livewire;

use Livewire\Component;
use App\Models\Team;
use App\Models\User;
use App\Models\Bet;
use App\Models\Season;
use App\Models\FootballMatch;

class About extends Component
{
    public function render()
    {
        // Get platform statistics
        $stats = [
            'total_teams' => Team::count(),
            'total_users' => User::count(),
            'total_bets' => Bet::count(),
            'total_matches' => FootballMatch::count(),
            'current_season' => Season::where('active', true)->first(),
            'total_virtual_balance' => User::sum('virtual_balance'),
        ];

        return view('livewire.about', compact('stats'))
            ->layout('components.layouts.app', ['title' => 'About GoalGuessers']);
    }
}