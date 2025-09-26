<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Carbon\Carbon;

class Bet extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'match_id',
        'bet_type',
        'amount',
        'odds',
        'potential_winnings',
        'status',
        'actual_winnings',
        'placed_at',
        'settled_at',
        'bet_details',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'odds' => 'decimal:2',
        'potential_winnings' => 'decimal:2',
        'actual_winnings' => 'decimal:2',
        'placed_at' => 'datetime',
        'settled_at' => 'datetime',
        'bet_details' => 'array',
    ];

    /**
     * Bet status constants.
     */
    public const STATUS_PENDING = 'pending';
    public const STATUS_WON = 'won';
    public const STATUS_LOST = 'lost';
    public const STATUS_VOID = 'void';

    /**
     * Bet type constants.
     */
    public const TYPE_HOME = 'home';
    public const TYPE_DRAW = 'draw';
    public const TYPE_AWAY = 'away';

    /**
     * Minimum and maximum bet amounts.
     */
    public const MIN_BET_AMOUNT = 5.00;
    public const MAX_BET_AMOUNT = 1000.00;

    /**
     * Get the user who placed this bet.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the match this bet is on.
     */
    public function match()
    {
        return $this->belongsTo(FootballMatch::class, 'match_id');
    }

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($bet) {
            $bet->placed_at = $bet->placed_at ?: Carbon::now();
            $bet->potential_winnings = $bet->amount * $bet->odds;
        });
    }

    /**
     * Check if the bet is pending.
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Check if the bet won.
     */
    public function isWon(): bool
    {
        return $this->status === self::STATUS_WON;
    }

    /**
     * Check if the bet lost.
     */
    public function isLost(): bool
    {
        return $this->status === self::STATUS_LOST;
    }

    /**
     * Check if the bet is void.
     */
    public function isVoid(): bool
    {
        return $this->status === self::STATUS_VOID;
    }

    /**
     * Check if the bet is settled (won, lost, or void).
     */
    public function isSettled(): bool
    {
        return in_array($this->status, [self::STATUS_WON, self::STATUS_LOST, self::STATUS_VOID]);
    }

    /**
     * Get the bet type in human readable format.
     */
    public function getBetTypeLabel(): string
    {
        return match ($this->bet_type) {
            self::TYPE_HOME => 'Home Win',
            self::TYPE_DRAW => 'Draw',
            self::TYPE_AWAY => 'Away Win',
            default => 'Unknown',
        };
    }

    /**
     * Get the status in human readable format.
     */
    public function getStatusLabel(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING => 'Pending',
            self::STATUS_WON => 'Won',
            self::STATUS_LOST => 'Lost',
            self::STATUS_VOID => 'Void',
            default => 'Unknown',
        };
    }

    /**
     * Get the potential profit (winnings minus stake).
     */
    public function getPotentialProfit(): float
    {
        return $this->potential_winnings - $this->amount;
    }

    /**
     * Get the actual profit (actual winnings minus stake).
     */
    public function getActualProfit(): ?float
    {
        if ($this->actual_winnings === null) {
            return null;
        }

        return $this->actual_winnings - $this->amount;
    }

    /**
     * Settle the bet based on match result.
     */
    public function settle(string $matchResult): bool
    {
        if ($this->isSettled()) {
            return false; // Already settled
        }

        $this->settled_at = Carbon::now();

        // Determine if bet won based on match result
        $betWon = match (true) {
            $this->bet_type === self::TYPE_HOME && $matchResult === 'H' => true,
            $this->bet_type === self::TYPE_DRAW && $matchResult === 'D' => true,
            $this->bet_type === self::TYPE_AWAY && $matchResult === 'A' => true,
            default => false,
        };

        if ($betWon) {
            $this->status = self::STATUS_WON;
            $this->actual_winnings = $this->potential_winnings;
        } else {
            $this->status = self::STATUS_LOST;
            $this->actual_winnings = 0.00;
        }

        return $this->save();
    }

    /**
     * Void the bet (refund the stake).
     */
    public function void(): bool
    {
        if ($this->isSettled()) {
            return false; // Already settled
        }

        $this->status = self::STATUS_VOID;
        $this->actual_winnings = $this->amount; // Refund stake
        $this->settled_at = Carbon::now();

        return $this->save();
    }

    /**
     * Validate bet placement rules.
     */
    public static function validateBetPlacement(User $user, FootballMatch $match, string $betType, float $amount): array
    {
        $errors = [];

        // Check if user has sufficient balance
        if ($user->virtual_balance < $amount) {
            $errors[] = 'Insufficient virtual balance.';
        }

        // Check minimum and maximum bet amounts
        if ($amount < self::MIN_BET_AMOUNT) {
            $errors[] = 'Minimum bet amount is €' . self::MIN_BET_AMOUNT;
        }

        if ($amount > self::MAX_BET_AMOUNT) {
            $errors[] = 'Maximum bet amount is €' . self::MAX_BET_AMOUNT;
        }

        // Check if betting is available for this match
        if (!$match->isBettingAvailable()) {
            $errors[] = 'Betting is no longer available for this match.';
        }

        // Check if user already has a bet on this match with this bet type
        $existingBet = self::where('user_id', $user->id)
            ->where('match_id', $match->id)
            ->where('bet_type', $betType)
            ->exists();

        if ($existingBet) {
            $errors[] = 'You have already placed a bet of this type on this match.';
        }

        // Validate bet type
        if (!in_array($betType, [self::TYPE_HOME, self::TYPE_DRAW, self::TYPE_AWAY])) {
            $errors[] = 'Invalid bet type.';
        }

        return $errors;
    }

    /**
     * Create a new bet with validation.
     */
    public static function placeBet(User $user, FootballMatch $match, string $betType, float $amount, float $odds): array
    {
        // Validate the bet
        $errors = self::validateBetPlacement($user, $match, $betType, $amount);

        if (!empty($errors)) {
            return ['success' => false, 'errors' => $errors];
        }

        try {
            // Start database transaction
            \DB::beginTransaction();

            // Deduct money from user's balance
            $user->virtual_balance -= $amount;
            $user->total_bets_placed += 1;
            $user->save();

            // Create the bet
            $bet = self::create([
                'user_id' => $user->id,
                'match_id' => $match->id,
                'bet_type' => $betType,
                'amount' => $amount,
                'odds' => $odds,
                'status' => self::STATUS_PENDING,
                'bet_details' => [
                    'home_team' => $match->homeTeam->name,
                    'away_team' => $match->awayTeam->name,
                    'match_time' => $match->kickoff_time->format('Y-m-d H:i:s'),
                ],
            ]);

            \DB::commit();

            return ['success' => true, 'bet' => $bet];

        } catch (\Exception $e) {
            \DB::rollback();
            return ['success' => false, 'errors' => ['An error occurred while placing your bet.']];
        }
    }

    /**
     * Scope to get pending bets.
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Scope to get won bets.
     */
    public function scopeWon($query)
    {
        return $query->where('status', self::STATUS_WON);
    }

    /**
     * Scope to get lost bets.
     */
    public function scopeLost($query)
    {
        return $query->where('status', self::STATUS_LOST);
    }

    /**
     * Scope to get bets for a specific user.
     */
    public function scopeForUser($query, User $user)
    {
        return $query->where('user_id', $user->id);
    }

    /**
     * Scope to get recent bets.
     */
    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('placed_at', '>=', Carbon::now()->subDays($days));
    }
}
