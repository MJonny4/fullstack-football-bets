<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Achievement extends Model
{
    protected $fillable = [
        'key',
        'name',
        'description',
        'icon',
        'category',
        'type',
        'target_value',
        'rarity',
        'points',
        'is_active',
        'metadata',
    ];

    protected $casts = [
        'target_value' => 'decimal:2',
        'is_active' => 'boolean',
        'metadata' => 'array',
    ];

    /**
     * Users who have earned this achievement
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_achievements')
            ->withPivot(['progress_value', 'is_completed', 'completed_at', 'metadata'])
            ->withTimestamps();
    }

    /**
     * User achievement records
     */
    public function userAchievements(): HasMany
    {
        return $this->hasMany(UserAchievement::class);
    }

    /**
     * Get achievements by category
     */
    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Get active achievements only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get achievements by rarity
     */
    public function scopeByRarity($query, string $rarity)
    {
        return $query->where('rarity', $rarity);
    }

    /**
     * Get rarity color class for UI
     */
    public function getRarityColorAttribute(): string
    {
        return match($this->rarity) {
            'common' => 'text-gray-600 bg-gray-100',
            'rare' => 'text-blue-600 bg-blue-100',
            'epic' => 'text-purple-600 bg-purple-100',
            'legendary' => 'text-yellow-600 bg-yellow-100',
            default => 'text-gray-600 bg-gray-100',
        };
    }

    /**
     * Get category display name
     */
    public function getCategoryDisplayAttribute(): string
    {
        return match($this->category) {
            'betting' => 'Betting Activity',
            'profit' => 'Profit & Earnings',
            'streak' => 'Winning Streaks',
            'milestone' => 'Major Milestones',
            'social' => 'Social Features',
            default => ucfirst($this->category),
        };
    }

    /**
     * Check if this is a progress-based achievement
     */
    public function isProgressBased(): bool
    {
        return in_array($this->type, ['count', 'amount', 'percentage']);
    }

    /**
     * Get completion percentage for a given progress value
     */
    public function getCompletionPercentage(float $progressValue): int
    {
        if (!$this->target_value || $this->target_value <= 0) {
            return 0;
        }

        return min(100, round(($progressValue / $this->target_value) * 100));
    }
}
