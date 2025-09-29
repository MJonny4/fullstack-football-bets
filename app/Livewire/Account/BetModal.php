<?php

namespace App\Livewire\Account;

use Livewire\Component;
use App\Models\FootballMatch;
use App\Models\Bet;
use Illuminate\Support\Facades\Auth;

class BetModal extends Component
{
    public $isOpen = false;
    public $match = null;
    public $betType = null;
    public $odds = null;
    public $betAmount = 10.00;
    public $potentialWinnings = 0;
    public $userBalance = 0;
    public $netProfit = 0;
    public $maxBetForBalance = 0;
    public $showAdvancedCalculations = false;

    // Betting constraints
    public const MIN_BET_AMOUNT = 5.00;
    public const MAX_BET_AMOUNT = 1000.00;

    protected $rules = [
        'betAmount' => 'required|numeric|min:5|max:1000',
    ];

    protected $messages = [
        'betAmount.required' => 'Please enter a bet amount',
        'betAmount.numeric' => 'Bet amount must be a number',
        'betAmount.min' => 'Minimum bet amount is €5.00',
        'betAmount.max' => 'Maximum bet amount is €1,000.00',
    ];

    protected $listeners = ['openBetModal'];

    public function mount()
    {
        $this->updateUserBalance();
    }

    /**
     * Open the bet modal with match and bet details (called via event)
     */
    public function openBetModal($data)
    {
        $this->openModal($data['matchId'], $data['betType'], $data['odds']);
    }

    /**
     * Open the bet modal with match and bet details
     */
    private function openModal($matchId, $betType, $odds)
    {
        $this->match = FootballMatch::with(['homeTeam', 'awayTeam', 'gameweek'])->find($matchId);

        if (!$this->match) {
            session()->flash('error', 'Match not found.');
            return;
        }

        $this->betType = $betType;
        $this->odds = $odds;
        $this->betAmount = 10.00; // Default amount
        $this->isOpen = true;

        $this->updateUserBalance();
        $this->calculatePotentialWinnings();
    }

    /**
     * Close the modal
     */
    public function closeModal()
    {
        $this->isOpen = false;
        $this->reset(['match', 'betType', 'odds', 'betAmount', 'potentialWinnings']);
    }

    /**
     * Update bet amount and recalculate winnings
     */
    public function updatedBetAmount()
    {
        $this->calculatePotentialWinnings();
        $this->validateOnly('betAmount');
    }

    /**
     * Calculate potential winnings and advanced calculations
     */
    private function calculatePotentialWinnings()
    {
        if ($this->betAmount && $this->odds) {
            $this->potentialWinnings = $this->betAmount * $this->odds;
            $this->netProfit = $this->potentialWinnings - $this->betAmount;
        } else {
            $this->potentialWinnings = 0;
            $this->netProfit = 0;
        }

        // Calculate maximum bet for current balance
        $this->maxBetForBalance = min($this->userBalance, self::MAX_BET_AMOUNT);
    }

    /**
     * Update user's current balance
     */
    private function updateUserBalance()
    {
        if (Auth::check()) {
            $this->userBalance = Auth::user()->virtual_balance ?? 0;
        }
    }

    /**
     * Confirm and place the bet
     */
    public function confirmBet()
    {
        // Validate the bet amount
        $this->validate();

        if (!Auth::check()) {
            session()->flash('error', 'Please login to place bets.');
            $this->closeModal();
            return;
        }

        if (!$this->match) {
            session()->flash('error', 'Match not found.');
            $this->closeModal();
            return;
        }

        // Check if user has sufficient balance
        $this->updateUserBalance();
        if ($this->userBalance < $this->betAmount) {
            session()->flash('error', 'Insufficient balance. Your current balance is €' . number_format($this->userBalance, 2));
            return;
        }

        // Use the professional betting system
        $result = Bet::placeBet(Auth::user(), $this->match, $this->betType, $this->betAmount, $this->odds);

        if ($result['success']) {
            $bet = $result['bet'];
            session()->flash('message',
                "Bet placed successfully! " .
                "Match: {$this->match->homeTeam->name} vs {$this->match->awayTeam->name}, " .
                "Bet: " . ucfirst($this->betType) . " Win, " .
                "Amount: €" . number_format($this->betAmount, 2) . ", " .
                "Potential Winnings: €" . number_format($bet->potential_winnings, 2)
            );

            // Update balance for display
            $this->updateUserBalance();

            // Emit event to update parent component
            $this->dispatch('betPlaced', [
                'newBalance' => $this->userBalance
            ]);
        } else {
            // Display validation errors
            $errorMessages = implode(' ', $result['errors']);
            session()->flash('error', $errorMessages);
        }

        $this->closeModal();
    }

    /**
     * Get formatted bet type display name
     */
    public function getBetTypeDisplay()
    {
        return match($this->betType) {
            'home' => $this->match?->homeTeam->name . ' Win',
            'away' => $this->match?->awayTeam->name . ' Win',
            'draw' => 'Draw',
            default => 'Unknown'
        };
    }

    /**
     * Get bet type color class
     */
    public function getBetTypeColor()
    {
        return match($this->betType) {
            'home' => 'text-blue-600',
            'away' => 'text-red-600',
            'draw' => 'text-gray-600',
            default => 'text-gray-600'
        };
    }

    /**
     * Check if betting is still available for this match
     */
    public function isBettingAvailable()
    {
        return $this->match && $this->match->isBettingAvailable();
    }

    /**
     * Quick bet amount buttons
     */
    public function setQuickAmount($amount)
    {
        $this->betAmount = $amount;
        $this->calculatePotentialWinnings();
    }

    /**
     * Set maximum possible bet for user's balance
     */
    public function setMaxBet()
    {
        $this->betAmount = $this->maxBetForBalance;
        $this->calculatePotentialWinnings();
    }

    /**
     * Toggle advanced calculations display
     */
    public function toggleAdvancedCalculations()
    {
        $this->showAdvancedCalculations = !$this->showAdvancedCalculations;
    }

    /**
     * Get probability percentage based on odds
     */
    public function getImpliedProbability()
    {
        if (!$this->odds || $this->odds <= 0) return 0;
        return round((1 / $this->odds) * 100, 1);
    }

    /**
     * Get user's betting statistics for this session
     */
    public function getUserBettingStats()
    {
        if (!Auth::check()) return null;

        $user = Auth::user();
        $recentBets = $user->bets()->orderBy('created_at', 'desc')->limit(10)->get();

        return [
            'total_bets_today' => $user->bets()->whereDate('created_at', today())->count(),
            'wagered_today' => $user->bets()->whereDate('created_at', today())->sum('amount'),
            'recent_streak' => $this->calculateRecentStreak($recentBets),
            'favorite_bet_type' => $this->getFavoriteBetType($user),
        ];
    }

    /**
     * Calculate recent betting streak
     */
    private function calculateRecentStreak($recentBets)
    {
        $streak = 0;
        $lastResult = null;

        foreach ($recentBets as $bet) {
            if ($bet->status === 'pending') continue;

            if ($lastResult === null) {
                $lastResult = $bet->status;
                $streak = 1;
            } elseif ($bet->status === $lastResult) {
                $streak++;
            } else {
                break;
            }
        }

        return [
            'count' => $streak,
            'type' => $lastResult,
        ];
    }

    /**
     * Get user's most frequent bet type
     */
    private function getFavoriteBetType($user)
    {
        $betTypes = $user->bets()
            ->selectRaw('bet_type, COUNT(*) as count')
            ->groupBy('bet_type')
            ->orderBy('count', 'desc')
            ->first();

        return $betTypes ? $betTypes->bet_type : null;
    }

    public function render()
    {
        return view('livewire.account.bet-modal');
    }
}