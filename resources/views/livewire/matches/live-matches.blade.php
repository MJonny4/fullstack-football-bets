<div data-auto-refresh="30000">
    <x-navigation />

    <!-- Header Section -->
    <div class="bg-gradient-to-r from-th-blue to-th-red text-white py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-4xl font-bold flex items-center">
                        <span class="w-3 h-3 bg-red-400 rounded-full mr-3 animate-pulse"></span>
                        Live Matches
                    </h1>
                    <p class="text-blue-100 text-lg mt-1">Real-time match updates and results</p>
                </div>
                <div class="hidden md:flex items-center space-x-4">
                    <div class="bg-white dark:bg-gray-800/20 backdrop-blur-sm rounded-lg px-4 py-2">
                        <span class="text-gray-900 dark:text-gray-300 text-sm">Live:</span>
                        <span class="text-gray-900 dark:text-white font-bold ml-2">{{ $matchCounts['live'] }}</span>
                    </div>
                    <div class="bg-white dark:bg-gray-800/20 backdrop-blur-sm rounded-lg px-4 py-2">
                        <span class="text-gray-900 dark:text-gray-300 text-sm">Scheduled:</span>
                        <span class="text-gray-900 dark:text-white font-bold ml-2">{{ $matchCounts['scheduled'] }}</span>
                    </div>
                    <button wire:click="refreshData"
                        class="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                        🔄 Refresh
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Live Matches Section -->
        @if (count($liveMatches) > 0)
            <div class="mb-8">
                <div class="flex items-center mb-6">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                        <span class="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></span>
                        Live Now
                    </h2>
                    <span class="ml-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                        {{ count($liveMatches) }} LIVE
                    </span>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    @foreach ($liveMatches as $match)
                        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
                            <!-- Match Header -->
                            <div class="bg-red-500/20 dark:bg-red-500/30 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
                                <div class="flex items-center justify-between">
                                    <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ $match['gameweek'] }}</span>
                                    <div class="flex items-center text-red-600 dark:text-red-400 font-bold text-sm">
                                        <span class="w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full mr-2 animate-pulse"></span>
                                        {{ $match['progress']['display'] }}
                                    </div>
                                </div>
                            </div>

                            <!-- Teams and Score -->
                            <div class="p-6">
                                <div class="flex items-center justify-between mb-4">
                                    <!-- Home Team -->
                                    <div class="flex items-center space-x-3 flex-1">
                                        <div class="relative">
                                            <img src="{{ $match['home_logo'] }}" alt="{{ $match['home_team'] }}"
                                                class="w-12 h-12 rounded-lg">
                                            <!-- Home Team Events -->
                                            @if (count($match['events']) > 0)
                                                <div class="flex space-x-1 mt-1">
                                                    @foreach (array_filter($match['events'], fn($event) => $event['team'] === 'home' && $event['type'] === 'goal') as $event)
                                                        <span
                                                            class="text-xs bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">{{ $event['icon'] }}</span>
                                                    @endforeach
                                                </div>
                                            @endif
                                        </div>
                                        <div>
                                            <div class="font-semibold text-gray-900 dark:text-gray-100">{{ $match['home_team'] }}</div>
                                            <div class="text-sm text-gray-600 dark:text-gray-400">Home</div>
                                        </div>
                                    </div>

                                    <!-- Score -->
                                    <div class="px-6">
                                        <div class="text-4xl font-bold text-gray-900 dark:text-gray-100 text-center">
                                            {{ $match['home_goals'] }} - {{ $match['away_goals'] }}
                                        </div>
                                    </div>

                                    <!-- Away Team -->
                                    <div class="flex items-center space-x-3 flex-1 justify-end text-right">
                                        <div>
                                            <div class="font-semibold text-gray-900 dark:text-gray-100">{{ $match['away_team'] }}</div>
                                            <div class="text-sm text-gray-600 dark:text-gray-400">Away</div>
                                        </div>
                                        <div class="relative">
                                            <img src="{{ $match['away_logo'] }}" alt="{{ $match['away_team'] }}"
                                                class="w-12 h-12 rounded-lg">
                                            <!-- Away Team Events -->
                                            @if (count($match['events']) > 0)
                                                <div class="flex space-x-1 mt-1">
                                                    @foreach (array_filter($match['events'], fn($event) => $event['team'] === 'away' && $event['type'] === 'goal') as $event)
                                                        <span
                                                            class="text-xs bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">{{ $event['icon'] }}</span>
                                                    @endforeach
                                                </div>
                                            @endif
                                        </div>
                                    </div>
                                </div>

                                <!-- Match Events -->
                                @if (count($match['events']) > 0)
                                    <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
                                        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Key Events</h4>
                                        <div class="space-y-2">
                                            @foreach (array_slice($match['events'], -3) as $event)
                                                <div class="flex items-center justify-between text-sm">
                                                    <div class="flex items-center space-x-2">
                                                        <span class="text-lg">{{ $event['icon'] }}</span>
                                                        <span class="text-gray-900 dark:text-gray-100">{{ $event['player'] }}</span>
                                                    </div>
                                                    <div class="text-gray-600 dark:text-gray-400">{{ $event['minute'] }}'</div>
                                                </div>
                                            @endforeach
                                        </div>
                                    </div>
                                @endif

                                <!-- Match Info -->
                                <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                                    <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                        <span>Started: {{ $match['started_at']->format('H:i') }}</span>
                                        @if ($match['attendance'])
                                            <span>👥 {{ number_format($match['attendance']) }}</span>
                                        @endif
                                    </div>
                                </div>
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>
        @else
            <!-- No Live Matches -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-12 text-center mb-8">
                <div class="text-6xl mb-4">⚽</div>
                <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Live Matches</h3>
                <p class="text-gray-600 dark:text-gray-400">Check back during match hours (13:00 - 23:00 Spanish time)</p>
            </div>
        @endif

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Recently Finished -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
                <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                        <span class="mr-2">🏁</span>
                        Recently Finished
                    </h3>
                </div>

                @if (count($recentlyFinished) > 0)
                    <div class="divide-y divide-gray-200 dark:divide-gray-700">
                        @foreach ($recentlyFinished as $match)
                            <div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-sm text-gray-600 dark:text-gray-400">{{ $match['gameweek'] }}</span>
                                    <span
                                        class="text-sm text-gray-600 dark:text-gray-400">{{ $match['finished_at']->format('H:i') }}</span>
                                </div>

                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-3">
                                        <div class="relative">
                                            <img src="{{ $match['home_logo'] }}" alt="{{ $match['home_team'] }}"
                                                class="w-8 h-8 rounded">
                                            @if (count($match['events']) > 0)
                                                <div class="flex space-x-1 mt-1">
                                                    @foreach (array_filter($match['events'], fn($event) => $event['team'] === 'home' && $event['type'] === 'goal') as $event)
                                                        <span
                                                            class="text-xs bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">{{ $event['icon'] }}</span>
                                                    @endforeach
                                                </div>
                                            @endif
                                        </div>
                                        <span class="text-gray-900 dark:text-gray-100 text-sm font-medium">{{ $match['home_team'] }}</span>
                                    </div>

                                    <div class="text-gray-900 dark:text-gray-100 font-bold">
                                        {{ $match['home_goals'] }} - {{ $match['away_goals'] }}
                                    </div>

                                    <div class="flex items-center space-x-3">
                                        <span class="text-gray-900 dark:text-gray-100 text-sm font-medium">{{ $match['away_team'] }}</span>
                                        <div class="relative">
                                            <img src="{{ $match['away_logo'] }}" alt="{{ $match['away_team'] }}"
                                                class="w-8 h-8 rounded">
                                            @if (count($match['events']) > 0)
                                                <div class="flex space-x-1 mt-1">
                                                    @foreach (array_filter($match['events'], fn($event) => $event['team'] === 'away' && $event['type'] === 'goal') as $event)
                                                        <span
                                                            class="text-xs bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">{{ $event['icon'] }}</span>
                                                    @endforeach
                                                </div>
                                            @endif
                                        </div>
                                    </div>
                                </div>
                            </div>
                        @endforeach
                    </div>
                @else
                    <div class="p-6 text-center">
                        <div class="text-4xl mb-2">🕐</div>
                        <p class="text-gray-600 dark:text-gray-400 text-sm">No recently finished matches</p>
                    </div>
                @endif
            </div>

            <!-- Upcoming Soon -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
                <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                        <span class="mr-2">⏰</span>
                        Starting Soon
                    </h3>
                </div>

                @if (count($upcomingSoon) > 0)
                    <div class="divide-y divide-gray-200 dark:divide-gray-700">
                        @foreach ($upcomingSoon as $match)
                            <div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-sm text-gray-600 dark:text-gray-400">{{ $match['gameweek'] }}</span>
                                    <span class="text-sm text-green-600 dark:text-green-400 font-medium">
                                        {{ $match['minutes_until_kickoff'] }} min
                                    </span>
                                </div>

                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-3">
                                        <img src="{{ $match['home_logo'] }}" alt="{{ $match['home_team'] }}"
                                            class="w-8 h-8 rounded">
                                        <span class="text-gray-900 dark:text-gray-100 text-sm font-medium">{{ $match['home_team'] }}</span>
                                    </div>

                                    <div class="text-gray-600 dark:text-gray-400 text-sm">
                                        {{ $match['kickoff_time']->format('H:i') }}
                                    </div>

                                    <div class="flex items-center space-x-3">
                                        <span class="text-gray-900 dark:text-gray-100 text-sm font-medium">{{ $match['away_team'] }}</span>
                                        <img src="{{ $match['away_logo'] }}" alt="{{ $match['away_team'] }}"
                                            class="w-8 h-8 rounded">
                                    </div>
                                </div>
                            </div>
                        @endforeach
                    </div>
                @else
                    <div class="p-6 text-center">
                        <div class="text-4xl mb-2">📅</div>
                        <p class="text-gray-600 dark:text-gray-400 text-sm">No matches starting soon</p>
                    </div>
                @endif
            </div>
        </div>

        <!-- Auto Refresh Notice -->
        <div class="mt-8 text-center">
            <p class="text-gray-600 dark:text-gray-400 text-sm">
                🔄 Page refreshes automatically every 30 seconds during live matches
            </p>
        </div>
    </div>

    <!-- Auto-refresh script -->
    @if (count($liveMatches) > 0)
    @endif
    <x-footer />

</div>
