<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserAchievement extends Model
{
    protected $fillable = [
        'user_id',
        'achievement_id',
        'progress_value',
        'is_completed',
        'completed_at',
        'metadata',
    ];

    protected $casts = [
        'progress_value' => 'decimal:2',
        'is_completed' => 'boolean',
        'completed_at' => 'datetime',
        'metadata' => 'array',
    ];

    /**
     * The user who earned this achievement
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The achievement that was earned
     */
    public function achievement(): BelongsTo
    {
        return $this->belongsTo(Achievement::class);
    }

    /**
     * Scope for completed achievements
     */
    public function scopeCompleted($query)
    {
        return $query->where('is_completed', true);
    }

    /**
     * Scope for in-progress achievements
     */
    public function scopeInProgress($query)
    {
        return $query->where('is_completed', false)->where('progress_value', '>', 0);
    }

    /**
     * Get completion percentage
     */
    public function getCompletionPercentageAttribute(): int
    {
        if ($this->is_completed) {
            return 100;
        }

        return $this->achievement->getCompletionPercentage($this->progress_value);
    }

    /**
     * Check if achievement was recently completed (within last 24 hours)
     */
    public function wasRecentlyCompleted(): bool
    {
        return $this->is_completed &&
               $this->completed_at &&
               $this->completed_at->isAfter(now()->subDay());
    }
}
