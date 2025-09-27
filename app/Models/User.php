<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'date_of_birth',
        'virtual_balance',
        'country',
        'timezone',
        'favorite_team_id',
        'total_bets_placed',
        'total_winnings',
        'last_login_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'date_of_birth' => 'date',
            'virtual_balance' => 'decimal:2',
            'total_winnings' => 'decimal:2',
            'last_login_at' => 'datetime',
        ];
    }

    /**
     * Get the user's favorite team.
     */
    public function favoriteTeam()
    {
        return $this->belongsTo(Team::class, 'favorite_team_id');
    }

    /**
     * Get all bets placed by this user.
     */
    public function bets()
    {
        return $this->hasMany(Bet::class);
    }

    /**
     * Get all achievements earned by this user.
     */
    public function achievements()
    {
        return $this->belongsToMany(Achievement::class, 'user_achievements')
            ->withPivot(['progress_value', 'is_completed', 'completed_at', 'metadata'])
            ->withTimestamps();
    }

    /**
     * Get user achievement records.
     */
    public function userAchievements()
    {
        return $this->hasMany(UserAchievement::class);
    }

    /**
     * Get completed achievements only.
     */
    public function completedAchievements()
    {
        return $this->achievements()->wherePivot('is_completed', true);
    }

    /**
     * Get total achievement points.
     */
    public function getTotalAchievementPointsAttribute(): int
    {
        return $this->completedAchievements()->sum('points');
    }

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($user) {
            if (empty($user->virtual_balance)) {
                $user->virtual_balance = 1000.00; // Starting virtual money
            }
            if (empty($user->country)) {
                $user->country = 'ES'; // Default to Spain
            }
            if (empty($user->timezone)) {
                $user->timezone = 'Europe/Madrid'; // Spanish timezone
            }
        });
    }
}
