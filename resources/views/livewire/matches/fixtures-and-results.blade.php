<div>
    <x-navigation />


    <!-- Header Section -->
    <div class="bg-gradient-to-r from-th-blue to-th-red text-white py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center">
                <h1 class="text-4xl font-bold mb-2 flex items-center justify-center">
                    <img src="{{ asset('images/goalguessers.png') }}" alt="GoalGuessers Logo"
                        class="w-10 h-10 mr-3 object-contain">
                    Fixtures & Results
                </h1>
                <p class="text-blue-100 text-lg">{{ $seasonName }}</p>
                @if ($currentGameweek)
                    <div
                        class="mt-4 inline-flex items-center bg-white dark:bg-gray-800/20 backdrop-blur-sm rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100">
                        <span class="font-medium">Current Gameweek: {{ $currentGameweek->name }}</span>
                    </div>
                @endif
            </div>
        </div>
    </div>

    <!-- Quick Stats Bar -->
    <div class="bg-gray-300 dark:bg-gray-800 py-4">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex flex-wrap justify-center gap-8 text-center text-black dark:text-white">
                <div class="flex items-center">
                    <div class="text-2xl font-bold text-th-blue">{{ $matchCounts['total'] }}</div>
                    <div class="ml-2">Total Matches</div>
                </div>
                <div class="flex items-center">
                    <div class="text-2xl font-bold text-green-600">{{ $matchCounts['upcoming'] }}</div>
                    <div class="ml-2">Upcoming</div>
                </div>
                @if ($matchCounts['live'] > 0)
                    <div class="flex items-center">
                        <div class="text-2xl font-bold text-red-600 animate-pulse">{{ $matchCounts['live'] }}</div>
                        <div class="ml-2">Live Now</div>
                    </div>
                @endif
                <div class="flex items-center">
                    <div class="text-2xl font-bold text-gray-700 dark:text-gray-300">{{ $matchCounts['finished'] }}
                    </div>
                    <div class="ml-2">Completed</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Highlights Section (only on default view) -->
        @if ($selectedView === 'upcoming' && !$selectedGameweek && !$selectedTeam)
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <!-- Next 3 Upcoming Matches -->
                <div class="lg:col-span-2">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-6">🔥 Next Matches</h2>
                    <div class="grid gap-4">
                        @forelse($upcomingHighlights as $match)
                            <div
                                class="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border-l-4 border-th-blue hover:shadow-2xl transition-all">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="text-sm text-gray-600 dark:text-gray-50">
                                        {{ $match->gameweek->name ?? 'Unknown Gameweek' }}</div>
                                    <div class="text-sm font-medium text-gray-900 dark:text-gray-50">
                                        {{ $match->kickoff_time->setTimezone('Europe/Madrid')->format('M d, H:i') }}
                                    </div>
                                </div>
                                <div class="flex items-center justify-between">
                                    <div class="flex-1 text-center">
                                        <img src="{{ asset('images/teams/' . Str::slug($match->homeTeam->name) . '.png') }}"
                                            alt="{{ $match->homeTeam->name }}" class="w-12 h-12 mx-auto mb-2"
                                            onerror="this.style.display='none'">
                                        <h3 class="font-bold text-gray-900 dark:text-gray-50">{{ $match->homeTeam->name }}</h3>
                                        <div class="text-xs text-gray-500 dark:text-gray-400">
                                            {{ $match->homeTeam->short_name }}</div>
                                    </div>
                                    <div class="mx-8 text-center">
                                        <div class="text-2xl font-bold text-gray-700 dark:text-gray-200">VS</div>
                                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {{ $match->getTimeUntilKickoff() }}</div>
                                    </div>
                                    <div class="flex-1 text-center">
                                        <img src="{{ asset('images/teams/' . Str::slug($match->awayTeam->name) . '.png') }}"
                                            alt="{{ $match->awayTeam->name }}" class="w-12 h-12 mx-auto mb-2"
                                            onerror="this.style.display='none'">
                                        <h3 class="font-bold text-gray-900 dark:text-gray-50">{{ $match->awayTeam->name }}</h3>
                                        <div class="text-xs text-gray-500 dark:text-gray-400">
                                            {{ $match->awayTeam->short_name }}</div>
                                    </div>
                                </div>
                                @auth
                                    @if ($match->isBettingAvailable())
                                        <div class="mt-4 pt-4 border-t border-gray-100">
                                            <div class="text-center text-sm text-th-blue font-medium">
                                                🎯 Betting Available
                                            </div>
                                        </div>
                                    @endif
                                @endauth
                            </div>
                        @empty
                            <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                                <div class="flex justify-center mb-2">
                                    <img src="{{ asset('images/goalguessers.png') }}" alt="GoalGuessers Logo"
                                        class="w-16 h-16 object-contain opacity-50">
                                </div>
                                <p>No upcoming matches found</p>
                            </div>
                        @endforelse
                    </div>
                </div>

                <!-- Recent Results Sidebar -->
                <div>
                    <h2 class="text-2xl font-bold text-gray-900 mb-6">📊 Recent Results</h2>
                    <div class="space-y-4">
                        @forelse($recentResults as $match)
                            <div class="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-4">
                                <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    {{ $match->gameweek->name ?? 'Unknown' }}</div>
                                <div class="flex items-center justify-between text-sm">
                                    <div class="flex items-center">
                                        <img src="{{ asset('images/teams/' . Str::slug($match->homeTeam->name) . '.png') }}"
                                            alt="{{ $match->homeTeam->name }}" class="w-6 h-6 mr-2"
                                            onerror="this.style.display='none'">
                                        <span class="font-medium">{{ Str::limit($match->homeTeam->name, 15) }}</span>
                                    </div>
                                    <div class="font-bold text-lg">
                                        @if ($match->home_goals !== null && $match->away_goals !== null)
                                            <span
                                                class="{{ $match->home_goals > $match->away_goals ? 'text-green-600' : ($match->home_goals < $match->away_goals ? 'text-red-600' : 'text-yellow-600') }}">
                                                {{ $match->home_goals }}
                                            </span>
                                            <span class="text-gray-400 mx-1">-</span>
                                            <span
                                                class="{{ $match->away_goals > $match->home_goals ? 'text-green-600' : ($match->away_goals < $match->home_goals ? 'text-red-600' : 'text-yellow-600') }}">
                                                {{ $match->away_goals }}
                                            </span>
                                        @else
                                            <span class="text-gray-400">-:-</span>
                                        @endif
                                    </div>
                                    <div class="flex items-center">
                                        <span class="font-medium">{{ Str::limit($match->awayTeam->name, 15) }}</span>
                                        <img src="{{ asset('images/teams/' . Str::slug($match->awayTeam->name) . '.png') }}"
                                            alt="{{ $match->awayTeam->name }}" class="w-6 h-6 ml-2"
                                            onerror="this.style.display='none'">
                                    </div>
                                </div>
                            </div>
                        @empty
                            <div class="text-center text-gray-500 dark:text-gray-400 py-4">
                                <div class="text-2xl mb-1">📅</div>
                                <p class="text-sm">No results yet</p>
                            </div>
                        @endforelse
                    </div>
                </div>
            </div>
        @endif

        <!-- Filters & View Controls -->
        <div class="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8">
            <!-- View Tabs -->
            <div class="flex flex-wrap items-center gap-4 mb-6">
                <div class="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button wire:click="setView('upcoming')"
                        class="px-4 py-2 text-sm font-medium rounded-md transition-colors {{ $selectedView === 'upcoming' ? 'bg-white dark:bg-gray-800 text-th-blue shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900' }}">
                        🔮 Upcoming ({{ $matchCounts['upcoming'] }})
                    </button>
                    <button wire:click="setView('results')"
                        class="px-4 py-2 text-sm font-medium rounded-md transition-colors {{ $selectedView === 'results' ? 'bg-white dark:bg-gray-800 text-th-blue shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900' }}">
                        📊 Results ({{ $matchCounts['finished'] }})
                    </button>
                    @if ($matchCounts['live'] > 0)
                        <button wire:click="setView('live')"
                            class="px-4 py-2 text-sm font-medium rounded-md transition-colors {{ $selectedView === 'live' ? 'bg-white dark:bg-gray-800 text-th-blue shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900' }}">
                            🔴 Live ({{ $matchCounts['live'] }})
                        </button>
                    @endif
                    <button wire:click="setView('all')"
                        class="px-4 py-2 text-sm font-medium rounded-md transition-colors {{ $selectedView === 'all' ? 'bg-white dark:bg-gray-800 text-th-blue shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900' }}">
                        📋 All ({{ $matchCounts['total'] }})
                    </button>
                </div>

                <!-- Clear Filters -->
                @if ($selectedGameweek || $selectedTeam || $selectedStatus !== 'all' || $searchTerm)
                    <button wire:click="clearFilters" class="text-sm text-th-red hover:text-red-700 font-medium">
                        🗑️ Clear Filters
                    </button>
                @endif
            </div>

            <!-- Filter Controls -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Search -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Teams</label>
                    <input type="text" wire:model.live.debounce.300ms="searchTerm"
                        placeholder="Search team names..."
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-th-blue focus:border-th-blue text-sm">
                </div>

                <!-- Gameweek Filter -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gameweek</label>
                    <select wire:model.live="selectedGameweek"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-th-blue focus:border-th-blue text-sm">
                        <option value="">All Gameweeks</option>
                        @foreach ($gameweeks as $gameweek)
                            <option value="{{ $gameweek->id }}">{{ $gameweek->name }}</option>
                        @endforeach
                    </select>
                </div>

                <!-- Team Filter -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Team</label>
                    <select wire:model.live="selectedTeam"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-th-blue focus:border-th-blue text-sm">
                        <option value="">All Teams</option>
                        @foreach ($teams as $team)
                            <option value="{{ $team->id }}">{{ $team->name }}</option>
                        @endforeach
                    </select>
                </div>

                <!-- Status Filter -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select wire:model.live="selectedStatus"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-th-blue focus:border-th-blue text-sm">
                        <option value="all">All Statuses</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="live">Live</option>
                        <option value="finished">Finished</option>
                        <option value="postponed">Postponed</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Match Results Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @forelse($matches as $match)
                <div
                    class="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
                    <!-- Match Header -->
                    <div class="bg-gradient-to-r from-gray-50 to-white p-4 border-b">
                        <div class="flex items-center justify-between text-sm">
                            <span
                                class="text-gray-600 dark:text-gray-400 font-medium">{{ $match->gameweek->name ?? 'Unknown' }}</span>
                            <span class="text-gray-900 font-semibold">
                                {{ $match->kickoff_time->setTimezone('Europe/Madrid')->format('M d, H:i') }}
                            </span>
                        </div>
                        <div class="mt-1">
                            <span
                                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {{ $match->getStatusBadgeClass() }}">
                                {{ $match->getStatusLabel() }}
                            </span>
                        </div>
                    </div>

                    <!-- Teams -->
                    <div class="p-6">
                        <div class="flex items-center justify-between">
                            <!-- Home Team -->
                            <div class="flex-1 text-center">
                                <img src="{{ asset('images/teams/' . Str::slug($match->homeTeam->name) . '.png') }}"
                                    alt="{{ $match->homeTeam->name }}" class="w-16 h-16 mx-auto mb-3"
                                    onerror="this.style.display='none'">
                                <h3 class="font-bold text-gray-900 text-lg">
                                    {{ Str::limit($match->homeTeam->name, 12) }}</h3>
                                <div class="text-sm text-gray-500 dark:text-gray-400">
                                    {{ $match->homeTeam->short_name }}</div>
                            </div>

                            <!-- Score or VS -->
                            <div class="mx-6 text-center">
                                @if ($match->status === 'finished')
                                    <div class="text-4xl font-bold text-gray-900">
                                        <span
                                            class="{{ $match->home_goals > $match->away_goals ? 'text-green-600' : ($match->home_goals < $match->away_goals ? 'text-red-600' : 'text-yellow-600') }}">
                                            {{ $match->home_goals ?? 0 }}
                                        </span>
                                        <span class="text-gray-400 mx-2">-</span>
                                        <span
                                            class="{{ $match->away_goals > $match->home_goals ? 'text-green-600' : ($match->away_goals < $match->home_goals ? 'text-red-600' : 'text-yellow-600') }}">
                                            {{ $match->away_goals ?? 0 }}
                                        </span>
                                    </div>
                                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Final Score</div>
                                @elseif($match->status === 'live')
                                    <div class="text-3xl font-bold text-red-600 animate-pulse">
                                        {{ $match->home_goals ?? 0 }}-{{ $match->away_goals ?? 0 }}
                                    </div>
                                    <div class="text-xs text-red-600 mt-1 font-medium">LIVE</div>
                                @else
                                    <div class="text-3xl font-bold text-gray-400">VS</div>
                                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        @if ($match->kickoff_time->isFuture())
                                            {{ $match->getTimeUntilKickoff() }}
                                        @else
                                            {{ $match->kickoff_time->setTimezone('Europe/Madrid')->format('H:i') }}
                                        @endif
                                    </div>
                                @endif
                            </div>

                            <!-- Away Team -->
                            <div class="flex-1 text-center">
                                <img src="{{ asset('images/teams/' . Str::slug($match->awayTeam->name) . '.png') }}"
                                    alt="{{ $match->awayTeam->name }}" class="w-16 h-16 mx-auto mb-3"
                                    onerror="this.style.display='none'">
                                <h3 class="font-bold text-gray-900 text-lg">
                                    {{ Str::limit($match->awayTeam->name, 12) }}</h3>
                                <div class="text-sm text-gray-500 dark:text-gray-400">
                                    {{ $match->awayTeam->short_name }}</div>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        @auth
                            @if ($match->isBettingAvailable() && $selectedView !== 'results')
                                <div class="mt-6 pt-4 border-t border-gray-100">
                                    <button
                                        class="w-full bg-gradient-to-r from-th-blue to-th-red text-white py-2 px-4 rounded-lg font-medium hover:from-th-red hover:to-th-blue transition-all">
                                        🎯 Place Bet
                                    </button>
                                </div>
                            @endif
                        @else
                            @if ($selectedView !== 'results')
                                <div class="mt-6 pt-4 border-t border-gray-100">
                                    <a href="{{ route('login') }}"
                                        class="block w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg font-medium text-center transition-colors">
                                        🔐 Login to Bet
                                    </a>
                                </div>
                            @endif
                        @endauth
                    </div>
                </div>
            @empty
                <div class="col-span-full">
                    <div class="text-center text-gray-500 dark:text-gray-400 py-16">
                        <div class="flex justify-center mb-4">
                            <img src="{{ asset('images/goalguessers.png') }}" alt="GoalGuessers Logo"
                                class="w-24 h-24 object-contain opacity-50">
                        </div>
                        <h3 class="text-xl font-medium text-gray-900 mb-2">No matches found</h3>
                        <p>Try adjusting your filters or check back later.</p>
                        @if ($selectedGameweek || $selectedTeam || $selectedStatus !== 'all' || $searchTerm)
                            <button wire:click="clearFilters"
                                class="mt-4 inline-flex items-center px-4 py-2 bg-th-blue text-white rounded-lg hover:bg-blue-600 transition-colors">
                                🗑️ Clear All Filters
                            </button>
                        @endif
                    </div>
                </div>
            @endforelse
        </div>

        <!-- Pagination -->
        @if ($matches->hasPages())
            <div class="mt-8">
                {{ $matches->links() }}
            </div>
        @endif
    </div>
    <x-footer />

</div>
