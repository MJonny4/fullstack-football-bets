<?php

namespace App\Livewire;

use Livewire\Component;
use Livewire\WithPagination;
use App\Models\Bet;
use App\Models\Team;
use App\Models\Gameweek;
use Carbon\Carbon;

class BettingHistory extends Component
{
    use WithPagination;

    // Filters
    public $selectedStatus = 'all';
    public $selectedBetType = 'all';
    public $selectedTeam = '';
    public $selectedGameweek = '';
    public $dateFrom = '';
    public $dateTo = '';
    public $searchTerm = '';

    // Stats
    public $totalBets = 0;
    public $totalWagered = 0;
    public $totalWinnings = 0;
    public $profitLoss = 0;
    public $winRate = 0;

    protected $queryString = [
        'selectedStatus' => ['except' => 'all'],
        'selectedBetType' => ['except' => 'all'],
        'selectedTeam' => ['except' => ''],
        'selectedGameweek' => ['except' => ''],
        'dateFrom' => ['except' => ''],
        'dateTo' => ['except' => ''],
        'searchTerm' => ['except' => ''],
    ];

    public function mount()
    {
        $this->calculateStats();
    }

    public function updatedSelectedStatus()
    {
        $this->resetPage();
        $this->calculateStats();
    }

    public function updatedSelectedBetType()
    {
        $this->resetPage();
        $this->calculateStats();
    }

    public function updatedSelectedTeam()
    {
        $this->resetPage();
        $this->calculateStats();
    }

    public function updatedSelectedGameweek()
    {
        $this->resetPage();
        $this->calculateStats();
    }

    public function updatedDateFrom()
    {
        $this->resetPage();
        $this->calculateStats();
    }

    public function updatedDateTo()
    {
        $this->resetPage();
        $this->calculateStats();
    }

    public function updatedSearchTerm()
    {
        $this->resetPage();
        $this->calculateStats();
    }

    public function clearFilters()
    {
        $this->selectedStatus = 'all';
        $this->selectedBetType = 'all';
        $this->selectedTeam = '';
        $this->selectedGameweek = '';
        $this->dateFrom = '';
        $this->dateTo = '';
        $this->searchTerm = '';
        $this->resetPage();
        $this->calculateStats();
    }

    public function getFilteredBetsQuery()
    {
        $query = Bet::with(['match.homeTeam', 'match.awayTeam', 'match.gameweek'])
            ->where('user_id', auth()->id())
            ->orderByDesc('created_at');

        // Filter by status
        if ($this->selectedStatus !== 'all') {
            $query->where('status', $this->selectedStatus);
        }

        // Filter by bet type
        if ($this->selectedBetType !== 'all') {
            $query->where('bet_type', $this->selectedBetType);
        }

        // Filter by team (either home or away)
        if ($this->selectedTeam) {
            $query->whereHas('match', function ($q) {
                $q->where('home_team_id', $this->selectedTeam)
                  ->orWhere('away_team_id', $this->selectedTeam);
            });
        }

        // Filter by gameweek
        if ($this->selectedGameweek) {
            $query->whereHas('match', function ($q) {
                $q->where('gameweek_id', $this->selectedGameweek);
            });
        }

        // Filter by date range
        if ($this->dateFrom) {
            $query->whereDate('created_at', '>=', $this->dateFrom);
        }

        if ($this->dateTo) {
            $query->whereDate('created_at', '<=', $this->dateTo);
        }

        // Search filter
        if ($this->searchTerm) {
            $query->whereHas('match', function ($q) {
                $q->whereHas('homeTeam', function ($teamQuery) {
                    $teamQuery->where('name', 'like', '%' . $this->searchTerm . '%');
                })->orWhereHas('awayTeam', function ($teamQuery) {
                    $teamQuery->where('name', 'like', '%' . $this->searchTerm . '%');
                });
            });
        }

        return $query;
    }

    public function getBets()
    {
        return $this->getFilteredBetsQuery()->paginate(10);
    }

    public function calculateStats()
    {
        $query = $this->getFilteredBetsQuery();

        $allBets = $query->get();
        $this->totalBets = $allBets->count();
        $this->totalWagered = $allBets->sum('amount');
        $this->totalWinnings = $allBets->where('status', 'won')->sum('winnings');
        $this->profitLoss = $this->totalWinnings - $this->totalWagered;

        $wonBets = $allBets->where('status', 'won')->count();
        $this->winRate = $this->totalBets > 0 ? round(($wonBets / $this->totalBets) * 100, 1) : 0;
    }

    public function getTeams()
    {
        return Team::orderBy('name')->get();
    }

    public function getGameweeks()
    {
        return Gameweek::with('season')
            ->whereHas('season', function ($q) {
                $q->where('active', true);
            })
            ->orderBy('number')
            ->get();
    }

    public function getBetTypeOptions()
    {
        return [
            'home' => 'Home Win',
            'draw' => 'Draw',
            'away' => 'Away Win',
        ];
    }

    public function getStatusOptions()
    {
        return [
            'pending' => 'Pending',
            'won' => 'Won',
            'lost' => 'Lost',
            'void' => 'Void',
        ];
    }

    public function getBetStatusClass($status)
    {
        return match ($status) {
            'won' => 'bg-green-100 text-green-800 border-green-200',
            'lost' => 'bg-red-100 text-red-800 border-red-200',
            'pending' => 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'void' => 'bg-gray-100 text-gray-800 border-gray-200',
            default => 'bg-gray-100 text-gray-800 border-gray-200',
        };
    }

    public function getBetTypeDisplay($betType)
    {
        return match ($betType) {
            'home' => 'Home Win',
            'draw' => 'Draw',
            'away' => 'Away Win',
            default => ucfirst($betType),
        };
    }

    public function formatCurrency($amount)
    {
        return '€' . number_format($amount, 2);
    }

    public function getProfitLossClass()
    {
        if ($this->profitLoss > 0) {
            return 'text-green-600';
        } elseif ($this->profitLoss < 0) {
            return 'text-red-600';
        } else {
            return 'text-gray-600';
        }
    }

    public function render()
    {
        return view('livewire.betting-history', [
            'bets' => $this->getBets(),
            'teams' => $this->getTeams(),
            'gameweeks' => $this->getGameweeks(),
            'betTypeOptions' => $this->getBetTypeOptions(),
            'statusOptions' => $this->getStatusOptions(),
        ])->layout('components.layouts.app', ['title' => 'My Betting History - GoalGuessers']);
    }
}