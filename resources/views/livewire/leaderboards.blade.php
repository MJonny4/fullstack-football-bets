<div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
    <x-navigation />

    <!-- Header -->
    <div class="bg-gradient-to-br from-th-navy to-th-blue text-white py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 class="text-3xl font-bold">🏆 Leaderboards</h1>
            <p class="text-gray-300 mt-2">Compete with other players and climb the rankings</p>
        </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Controls -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 transition-colors">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <!-- Board Selection -->
                <div class="flex space-x-2">
                    <button wire:click="$set('selectedBoard', 'profit')" class="px-4 py-2 rounded-lg font-medium transition-colors {{ $selectedBoard === 'profit' ? 'bg-th-blue text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200' }}">💰 Profit</button>
                    <button wire:click="$set('selectedBoard', 'win_rate')" class="px-4 py-2 rounded-lg font-medium transition-colors {{ $selectedBoard === 'win_rate' ? 'bg-th-blue text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200' }}">🎯 Win Rate</button>
                    <button wire:click="$set('selectedBoard', 'volume')" class="px-4 py-2 rounded-lg font-medium transition-colors {{ $selectedBoard === 'volume' ? 'bg-th-blue text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200' }}">📊 Volume</button>
                    <button wire:click="$set('selectedBoard', 'achievements')" class="px-4 py-2 rounded-lg font-medium transition-colors {{ $selectedBoard === 'achievements' ? 'bg-th-blue text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200' }}">🏅 Achievements</button>
                    <button wire:click="$set('selectedBoard', 'streaks')" class="px-4 py-2 rounded-lg font-medium transition-colors {{ $selectedBoard === 'streaks' ? 'bg-th-blue text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200' }}">🔥 Streaks</button>
                </div>

                <!-- Period Selection -->
                <select wire:model.live="selectedPeriod" class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-th-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    <option value="all_time">All Time</option>
                    <option value="year">This Year</option>
                    <option value="3months">Last 3 Months</option>
                    <option value="month">This Month</option>
                    <option value="week">This Week</option>
                    <option value="today">Today</option>
                </select>
            </div>
        </div>

        <!-- Current User Rank -->
        @if($currentUserRank)
            <div class="bg-gradient-to-r from-th-red/10 to-th-blue/10 dark:from-th-red/20 dark:to-th-blue/20 rounded-xl p-4 mb-6">
                <div class="flex items-center">
                    <span class="text-2xl mr-3">👤</span>
                    <div>
                        <div class="font-bold text-th-navy dark:text-blue-400">Your Current Rank: #{{ $currentUserRank }}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">You're ranked {{ $currentUserRank }} out of {{ $leaderboardData->count() }} active players</div>
                    </div>
                </div>
            </div>
        @endif

        <!-- Leaderboard -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-colors">
            <div class="divide-y divide-gray-200 dark:divide-gray-600">
                @forelse($leaderboardData as $entry)
                    <div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors {{ $currentUser && $entry['user']->id === $currentUser->id ? 'bg-blue-50 dark:bg-blue-900/30' : '' }}">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-4">
                                <!-- Rank -->
                                <div class="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg {{ $entry['rank'] <= 3 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' }}">
                                    @if($entry['rank'] === 1) 🥇
                                    @elseif($entry['rank'] === 2) 🥈
                                    @elseif($entry['rank'] === 3) 🥉
                                    @else {{ $entry['rank'] }}
                                    @endif
                                </div>

                                <!-- User Info -->
                                <div class="flex-1">
                                    <div class="font-semibold text-gray-900 dark:text-gray-100">{{ $entry['user']->name }}</div>
                                    <div class="text-sm text-gray-600 dark:text-gray-400">
                                        @if($selectedBoard === 'win_rate' && isset($entry['total_bets']))
                                            {{ $entry['total_bets'] }} total bets
                                        @elseif($selectedBoard === 'achievements' && isset($entry['achievements_count']))
                                            {{ $entry['achievements_count'] }} achievements earned
                                        @else
                                            Member since {{ $entry['user']->created_at->format('M Y') }}
                                        @endif
                                    </div>
                                </div>

                                <!-- Badge -->
                                <span class="px-3 py-1 rounded-full text-xs font-medium {{ $entry['badge']['class'] }}">
                                    {{ $entry['badge']['text'] }}
                                </span>
                            </div>

                            <!-- Value -->
                            <div class="text-right">
                                <div class="text-xl font-bold {{ $entry['rank'] <= 3 ? 'text-th-red' : 'text-gray-900 dark:text-gray-100' }}">
                                    {{ $entry['formatted_value'] }}
                                </div>
                                @if($selectedBoard === 'streaks' && isset($entry['streak_type']))
                                    <div class="text-sm {{ $entry['streak_type'] === 'wins' ? 'text-green-600' : 'text-red-600' }}">
                                        {{ ucfirst($entry['streak_type']) }} Streak
                                    </div>
                                @endif
                            </div>
                        </div>
                    </div>
                @empty
                    <div class="p-12 text-center">
                        <div class="text-6xl mb-4">🏆</div>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Rankings Yet</h3>
                        <p class="text-gray-600 dark:text-gray-400">Start betting to appear on the leaderboards!</p>
                    </div>
                @endforelse
            </div>
        </div>
    </div>
</div>