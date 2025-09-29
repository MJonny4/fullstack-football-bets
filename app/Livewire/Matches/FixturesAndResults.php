<?php

namespace App\Livewire\Matches;

use Livewire\Component;
use Livewire\WithPagination;
use App\Models\FootballMatch;
use App\Models\Season;
use App\Models\Gameweek;
use App\Models\Team;
use Carbon\Carbon;

class FixturesAndResults extends Component
{
    use WithPagination;

    // Filters
    public $selectedGameweek = '';
    public $selectedTeam = '';
    public $selectedStatus = 'all';
    public $selectedView = 'upcoming'; // upcoming, results, all
    public $searchTerm = '';

    // Data
    public $season;
    public $gameweeks;
    public $teams;

    protected $queryString = [
        'selectedGameweek' => ['except' => ''],
        'selectedTeam' => ['except' => ''],
        'selectedStatus' => ['except' => 'all'],
        'selectedView' => ['except' => 'upcoming'],
        'searchTerm' => ['except' => ''],
    ];

    public function mount()
    {
        $this->season = Season::where('active', true)->first();
        $this->gameweeks = $this->season ? $this->season->gameweeks()->orderBy('number')->get() : collect();
        $this->teams = Team::orderBy('name')->get();
    }

    public function updatedSelectedGameweek()
    {
        $this->resetPage();
    }

    public function updatedSelectedTeam()
    {
        $this->resetPage();
    }

    public function updatedSelectedStatus()
    {
        $this->resetPage();
    }

    public function updatedSelectedView()
    {
        $this->resetPage();
    }

    public function updatedSearchTerm()
    {
        $this->resetPage();
    }

    public function clearFilters()
    {
        $this->selectedGameweek = '';
        $this->selectedTeam = '';
        $this->selectedStatus = 'all';
        $this->selectedView = 'upcoming';
        $this->searchTerm = '';
        $this->resetPage();
    }

    public function setView($view)
    {
        $this->selectedView = $view;
        $this->resetPage();
    }

    public function getFilteredMatches()
    {
        if (!$this->season) {
            return FootballMatch::query()->whereNull('id'); // Empty query
        }

        $query = FootballMatch::query()
            ->with(['homeTeam', 'awayTeam', 'gameweek'])
            ->whereHas('gameweek', function ($q) {
                $q->where('season_id', $this->season->id);
            });

        // Filter by view (upcoming, results, all)
        switch ($this->selectedView) {
            case 'upcoming':
                $query->where('status', 'scheduled')
                      ->where('kickoff_time', '>', now());
                break;
            case 'results':
                $query->where('status', 'finished');
                break;
            case 'live':
                $query->where('status', 'live');
                break;
            // 'all' - no additional filter
        }

        // Filter by gameweek
        if ($this->selectedGameweek) {
            $query->where('gameweek_id', $this->selectedGameweek);
        }

        // Filter by team
        if ($this->selectedTeam) {
            $query->where(function ($q) {
                $q->where('home_team_id', $this->selectedTeam)
                  ->orWhere('away_team_id', $this->selectedTeam);
            });
        }

        // Filter by status
        if ($this->selectedStatus && $this->selectedStatus !== 'all') {
            $query->where('status', $this->selectedStatus);
        }

        // Search filter
        if ($this->searchTerm) {
            $query->where(function ($q) {
                $q->whereHas('homeTeam', function ($teamQuery) {
                    $teamQuery->where('name', 'like', '%' . $this->searchTerm . '%');
                })->orWhereHas('awayTeam', function ($teamQuery) {
                    $teamQuery->where('name', 'like', '%' . $this->searchTerm . '%');
                });
            });
        }

        // Order by kickoff time
        $query->orderBy('kickoff_time', $this->selectedView === 'results' ? 'desc' : 'asc');

        return $query->paginate(12);
    }

    public function getUpcomingHighlights()
    {
        if (!$this->season) return collect();

        return FootballMatch::with(['homeTeam', 'awayTeam', 'gameweek'])
            ->whereHas('gameweek', function ($q) {
                $q->where('season_id', $this->season->id);
            })
            ->where('status', 'scheduled')
            ->where('kickoff_time', '>', now())
            ->orderBy('kickoff_time')
            ->limit(3)
            ->get();
    }

    public function getRecentResults()
    {
        if (!$this->season) return collect();

        return FootballMatch::with(['homeTeam', 'awayTeam', 'gameweek'])
            ->whereHas('gameweek', function ($q) {
                $q->where('season_id', $this->season->id);
            })
            ->where('status', 'finished')
            ->orderByDesc('kickoff_time')
            ->limit(5)
            ->get();
    }

    public function getCurrentGameweek()
    {
        return $this->season ? $this->season->gameweeks()->where('active', true)->first() : null;
    }

    public function getMatchCounts()
    {
        if (!$this->season) {
            return [
                'total' => 0,
                'upcoming' => 0,
                'live' => 0,
                'finished' => 0,
            ];
        }

        $baseQuery = FootballMatch::whereHas('gameweek', function ($q) {
            $q->where('season_id', $this->season->id);
        });

        return [
            'total' => $baseQuery->clone()->count(),
            'upcoming' => $baseQuery->clone()->where('status', 'scheduled')->where('kickoff_time', '>', now())->count(),
            'live' => $baseQuery->clone()->where('status', 'live')->count(),
            'finished' => $baseQuery->clone()->where('status', 'finished')->count(),
        ];
    }

    public function render()
    {
        $matches = $this->getFilteredMatches();
        $upcomingHighlights = $this->getUpcomingHighlights();
        $recentResults = $this->getRecentResults();
        $currentGameweek = $this->getCurrentGameweek();
        $matchCounts = $this->getMatchCounts();

        return view('livewire.matches.fixtures-and-results', [
            'matches' => $matches,
            'upcomingHighlights' => $upcomingHighlights,
            'recentResults' => $recentResults,
            'currentGameweek' => $currentGameweek,
            'matchCounts' => $matchCounts,
            'seasonName' => $this->season?->name ?? 'No Active Season',
            'title' => 'Fixtures & Results - GoalGuessers',
        ]);
    }
}
