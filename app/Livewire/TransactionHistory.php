<?php

namespace App\Livewire;

use App\Models\User;
use App\Models\Bet;
use App\Models\Team;
use App\Models\Gameweek;
use Livewire\Component;
use Livewire\WithPagination;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class TransactionHistory extends Component
{
    use WithPagination;

    public $user;

    // Enhanced filters from BettingHistory
    public $selectedStatus = 'all';
    public $selectedBetType = 'all';
    public $selectedTeam = '';
    public $selectedGameweek = '';
    public $dateFrom = '';
    public $dateTo = '';
    public $searchTerm = '';
    public $selectedPeriod = 'all';

    // View mode
    public $viewMode = 'transactions'; // transactions, betting, analytics

    protected $queryString = [
        'selectedStatus' => ['except' => 'all'],
        'selectedBetType' => ['except' => 'all'],
        'selectedTeam' => ['except' => ''],
        'selectedGameweek' => ['except' => ''],
        'dateFrom' => ['except' => ''],
        'dateTo' => ['except' => ''],
        'searchTerm' => ['except' => ''],
        'selectedPeriod' => ['except' => 'all'],
        'viewMode' => ['except' => 'transactions'],
    ];

    public function mount()
    {
        $this->user = Auth::user();
    }

    // Updated methods for all filters
    public function updatingSearchTerm()
    {
        $this->resetPage();
    }

    public function updatingSelectedStatus()
    {
        $this->resetPage();
    }

    public function updatingSelectedBetType()
    {
        $this->resetPage();
    }

    public function updatingSelectedTeam()
    {
        $this->resetPage();
    }

    public function updatingSelectedGameweek()
    {
        $this->resetPage();
    }

    public function updatingDateFrom()
    {
        $this->resetPage();
    }

    public function updatingDateTo()
    {
        $this->resetPage();
    }

    public function updatingViewMode()
    {
        $this->resetPage();
    }

    public function updatingSelectedPeriod()
    {
        $this->resetPage();
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
        $this->selectedPeriod = 'all';
        $this->resetPage();
    }

    public function getFilteredBetsQuery()
    {
        $query = $this->user->bets()
            ->with(['match.homeTeam', 'match.awayTeam', 'match.gameweek'])
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

    public function getTransactionsProperty()
    {
        return $this->getFilteredBetsQuery()->paginate(15);
    }

    public function getTransactionStatsProperty()
    {
        $allBets = $this->getFilteredBetsQuery()->get();

        $totalBets = $allBets->count();
        $totalWagered = $allBets->sum('amount');
        $totalWinnings = $allBets->where('status', 'won')->sum('actual_winnings');
        $pendingAmount = $allBets->where('status', 'pending')->sum('amount');
        $wonBets = $allBets->where('status', 'won')->count();
        $winRate = $totalBets > 0 ? round(($wonBets / $totalBets) * 100, 1) : 0;

        return [
            'total_transactions' => $totalBets,
            'total_wagered' => $totalWagered,
            'total_winnings' => $totalWinnings,
            'net_change' => $totalWinnings - $totalWagered,
            'pending_amount' => $pendingAmount,
            'win_rate' => $winRate,
            'won_bets' => $wonBets,
            'lost_bets' => $allBets->where('status', 'lost')->count(),
        ];
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

    public function getBalanceHistoryProperty()
    {
        // This would ideally come from a balance_history table
        // For now, we'll simulate based on betting activity for the selected period
        $startDate = match($this->selectedPeriod) {
            'today' => now()->startOfDay(),
            'week' => now()->subWeek(),
            'month' => now()->subMonth(),
            '3months' => now()->subMonths(3),
            default => now()->subMonths(6), // Default to 6 months for 'all'
        };

        $bets = $this->user->bets()
            ->where('created_at', '>=', $startDate)
            ->orderBy('created_at')
            ->get();

        // Start with current balance and work backwards
        $currentBalance = $this->user->virtual_balance;
        $history = [];

        // Calculate what the balance was at the start of the period
        $totalChange = 0;
        foreach ($bets as $bet) {
            $totalChange -= $bet->amount; // Subtract bet amount
            if ($bet->status === 'won') {
                $totalChange += $bet->actual_winnings; // Add winnings
            }
        }

        $startBalance = $currentBalance - $totalChange;
        $runningBalance = $startBalance;

        $history[] = [
            'date' => $startDate->toDateString(),
            'balance' => $runningBalance,
            'change' => 0,
            'description' => 'Starting balance',
        ];

        foreach ($bets as $bet) {
            $runningBalance -= $bet->amount;
            $history[] = [
                'date' => $bet->created_at->toDateString(),
                'balance' => $runningBalance,
                'change' => -$bet->amount,
                'description' => 'Bet placed: ' . $bet->match->homeTeam->name . ' vs ' . $bet->match->awayTeam->name,
                'type' => 'debit',
            ];

            if ($bet->status === 'won') {
                $runningBalance += $bet->actual_winnings;
                $history[] = [
                    'date' => $bet->updated_at->toDateString(),
                    'balance' => $runningBalance,
                    'change' => $bet->actual_winnings,
                    'description' => 'Bet won: ' . $bet->match->homeTeam->name . ' vs ' . $bet->match->awayTeam->name,
                    'type' => 'credit',
                ];
            }
        }

        return collect($history)->reverse()->take(20)->values();
    }

    public function formatCurrency($amount)
    {
        return '€' . number_format($amount, 2);
    }

    public function getTransactionType($bet)
    {
        if ($bet->status === 'won') {
            return 'credit'; // Money added to account
        } else {
            return 'debit'; // Money taken from account
        }
    }

    public function getTransactionAmount($bet)
    {
        if ($bet->status === 'won') {
            return $bet->actual_winnings; // Return the winnings
        } else {
            return $bet->amount; // Return the bet amount
        }
    }

    public function getTransactionDescription($bet)
    {
        $match = $bet->match->homeTeam->name . ' vs ' . $bet->match->awayTeam->name;
        $betType = ucfirst($bet->bet_type);

        if ($bet->status === 'won') {
            return "Bet won: {$betType} on {$match}";
        } elseif ($bet->status === 'lost') {
            return "Bet lost: {$betType} on {$match}";
        } else {
            return "Bet placed: {$betType} on {$match}";
        }
    }

    public function render()
    {
        return view('livewire.transaction-history', [
            'transactions' => $this->transactions,
            'transactionStats' => $this->transactionStats,
            'balanceHistory' => $this->balanceHistory,
            'teams' => $this->getTeams(),
            'gameweeks' => $this->getGameweeks(),
            'betTypeOptions' => $this->getBetTypeOptions(),
            'statusOptions' => $this->getStatusOptions(),
        ])->layout('components.layouts.app', ['title' => 'Betting & Transactions - GoalGuessers']);
    }
}