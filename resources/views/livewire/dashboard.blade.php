<div class="min-h-screen bg-gray-50">
    <!-- Professional Navigation -->
    <x-navigation />

    <!-- Dashboard Header -->
    <div class="bg-gradient-to-r from-th-blue to-th-red text-white py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 class="text-3xl font-bold">Welcome back, {{ $user->name }}! 👋</h1>
                    <p class="text-blue-100 mt-2">Here's your betting performance overview</p>
                </div>
                <div class="mt-4 lg:mt-0 flex items-center space-x-4">
                    <!-- Period Selector -->
                    <div class="bg-white/20 backdrop-blur-sm rounded-lg p-1">
                        <button
                            wire:click="changePeriod('week')"
                            class="px-3 py-1 text-sm rounded {{ $selectedPeriod === 'week' ? 'bg-white text-th-blue' : 'text-white hover:bg-white/20' }} transition-colors"
                        >
                            Week
                        </button>
                        <button
                            wire:click="changePeriod('month')"
                            class="px-3 py-1 text-sm rounded {{ $selectedPeriod === 'month' ? 'bg-white text-th-blue' : 'text-white hover:bg-white/20' }} transition-colors"
                        >
                            Month
                        </button>
                        <button
                            wire:click="changePeriod('all')"
                            class="px-3 py-1 text-sm rounded {{ $selectedPeriod === 'all' ? 'bg-white text-th-blue' : 'text-white hover:bg-white/20' }} transition-colors"
                        >
                            All Time
                        </button>
                    </div>
                    <!-- Refresh Button -->
                    <button
                        wire:click="refreshStats"
                        class="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
                    >
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Dashboard Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- KPI Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            @foreach($kpiCards as $card)
                <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-600 text-sm font-medium">{{ $card['title'] }}</p>
                            <p class="text-2xl font-bold text-gray-900 mt-1">{{ $card['value'] }}</p>
                        </div>
                        <div class="text-3xl">{{ $card['icon'] }}</div>
                    </div>
                    @if($card['change'] !== null)
                        <div class="mt-3 flex items-center">
                            <span class="text-{{ $card['color'] }}-600 font-medium text-sm">
                                {{ $card['change'] >= 0 ? '+' : '' }}€{{ number_format($card['change'], 2) }}
                            </span>
                            <span class="text-gray-500 text-sm ml-2">{{ $card['change_label'] }}</span>
                        </div>
                    @else
                        <div class="mt-3">
                            <span class="text-gray-500 text-sm">{{ $card['change_label'] }}</span>
                        </div>
                    @endif
                </div>
            @endforeach
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <!-- Main Content Area (2/3 width) -->
            <div class="xl:col-span-2 space-y-8">
                <!-- Current Streak & Achievements -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Current Streak -->
                    <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6">
                        <h3 class="text-lg font-bold text-gray-900 mb-4">Current Streak</h3>
                        <div class="text-center">
                            @if($currentStreak['type'] === 'winning')
                                <div class="text-4xl mb-2">🔥</div>
                                <div class="text-3xl font-bold text-green-600">{{ $currentStreak['value'] }}</div>
                                <div class="text-green-700 font-medium">Win Streak</div>
                            @elseif($currentStreak['type'] === 'losing')
                                <div class="text-4xl mb-2">💔</div>
                                <div class="text-3xl font-bold text-red-600">{{ $currentStreak['value'] }}</div>
                                <div class="text-red-700 font-medium">Loss Streak</div>
                            @else
                                <div class="text-4xl mb-2">⚡</div>
                                <div class="text-3xl font-bold text-gray-600">0</div>
                                <div class="text-gray-700 font-medium">No Active Streak</div>
                            @endif
                        </div>
                    </div>

                    <!-- Quick Achievements -->
                    <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6">
                        <h3 class="text-lg font-bold text-gray-900 mb-4">Achievements</h3>
                        @if(count($achievements) > 0)
                            <div class="space-y-3">
                                @foreach(array_slice($achievements, 0, 3) as $achievement)
                                    <div class="flex items-center">
                                        <span class="text-2xl mr-3">{{ $achievement['icon'] }}</span>
                                        <div>
                                            <div class="font-medium text-gray-900">{{ $achievement['name'] }}</div>
                                            <div class="text-sm text-gray-600">{{ $achievement['description'] }}</div>
                                        </div>
                                    </div>
                                @endforeach
                            </div>
                        @else
                            <div class="text-center text-gray-500">
                                <div class="text-4xl mb-2">🏆</div>
                                <p>Start betting to unlock achievements!</p>
                            </div>
                        @endif
                    </div>
                </div>

                <!-- Recent Betting Activity -->
                <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-lg font-bold text-gray-900">Recent Betting Activity</h3>
                        <a href="#" class="text-th-blue hover:text-th-red font-medium text-sm transition-colors">View All</a>
                    </div>

                    @if($recentBets->count() > 0)
                        <div class="space-y-4">
                            @foreach($recentBets as $bet)
                                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div class="flex-1">
                                        <div class="font-medium text-gray-900">{{ $bet['match'] }}</div>
                                        <div class="text-sm text-gray-600">
                                            {{ $bet['bet_type'] }} • Odds: {{ $bet['odds'] }} • {{ $bet['gameweek'] }}
                                        </div>
                                        <div class="text-xs text-gray-500 mt-1">
                                            {{ Carbon\Carbon::parse($bet['created_at'])->diffForHumans() }}
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <div class="font-bold text-gray-900">€{{ number_format($bet['amount'], 2) }}</div>
                                        @if($bet['status'] === 'settled')
                                            <div class="text-sm font-medium {{ $bet['result'] === 'won' ? 'text-green-600' : 'text-red-600' }}">
                                                {{ $bet['result'] === 'won' ? '+€' . number_format($bet['actual_winnings'], 2) : 'Lost' }}
                                            </div>
                                        @else
                                            <div class="text-sm text-yellow-600 font-medium">Pending</div>
                                        @endif
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    @else
                        <div class="text-center text-gray-500 py-8">
                            <div class="text-4xl mb-2">🎲</div>
                            <p class="font-medium">No betting activity yet</p>
                            <p class="text-sm">Place your first bet to get started!</p>
                        </div>
                    @endif
                </div>

                <!-- Upcoming Betting Opportunities -->
                @if($upcomingMatches && $upcomingMatches->count() > 0)
                <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-lg font-bold text-gray-900">Upcoming Betting Opportunities</h3>
                        <span class="text-sm text-gray-600">{{ $upcomingMatches->count() }} matches available</span>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        @foreach($upcomingMatches->take(4) as $match)
                            <div class="p-4 border border-gray-200 rounded-xl hover:border-th-blue transition-colors">
                                <div class="flex items-center justify-between mb-2">
                                    <div class="text-sm text-gray-600">{{ $match['gameweek'] }}</div>
                                    <div class="text-sm font-medium text-gray-900">{{ Carbon\Carbon::parse($match['kickoff_time'])->format('M d, H:i') }}</div>
                                </div>
                                <div class="flex items-center justify-center space-x-4 mb-3">
                                    <div class="text-center">
                                        <img src="{{ $match['home_logo'] }}" alt="{{ $match['home_team'] }}" class="w-8 h-8 mx-auto mb-1" onerror="this.style.display='none'">
                                        <div class="text-sm font-medium">{{ Str::limit($match['home_team'], 12) }}</div>
                                    </div>
                                    <div class="text-gray-400 font-bold">vs</div>
                                    <div class="text-center">
                                        <img src="{{ $match['away_logo'] }}" alt="{{ $match['away_team'] }}" class="w-8 h-8 mx-auto mb-1" onerror="this.style.display='none'">
                                        <div class="text-sm font-medium">{{ Str::limit($match['away_team'], 12) }}</div>
                                    </div>
                                </div>
                                @if($match['betting_available'])
                                    <div class="flex justify-center space-x-2 text-xs">
                                        <span class="bg-th-blue/10 text-th-blue px-2 py-1 rounded">{{ $match['odds']['home_odds'] }}</span>
                                        <span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">{{ $match['odds']['draw_odds'] }}</span>
                                        <span class="bg-th-red/10 text-th-red px-2 py-1 rounded">{{ $match['odds']['away_odds'] }}</span>
                                    </div>
                                @else
                                    <div class="text-center text-xs text-gray-500">Betting Closed</div>
                                @endif
                            </div>
                        @endforeach
                    </div>
                </div>
                @endif
            </div>

            <!-- Sidebar (1/3 width) -->
            <div class="space-y-6">
                <!-- Favorite Teams -->
                <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6">
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Your Top Teams</h3>
                    @if($topTeams->count() > 0)
                        <div class="space-y-4">
                            @foreach($topTeams as $team)
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center">
                                        <img
                                            src="{{ asset('images/teams/' . Str::slug($team['team']['name']) . '.png') }}"
                                            alt="{{ $team['team']['name'] }}"
                                            class="w-6 h-6 rounded-full mr-2"
                                            onerror="this.style.display='none'"
                                        >
                                        <div>
                                            <div class="font-medium text-sm">{{ Str::limit($team['team']['name'], 15) }}</div>
                                            <div class="text-xs text-gray-500">{{ $team['total_bets'] }} bets</div>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-sm font-bold {{ $team['win_rate'] >= 50 ? 'text-green-600' : 'text-red-600' }}">
                                            {{ $team['win_rate'] }}%
                                        </div>
                                        <div class="text-xs text-gray-500">win rate</div>
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    @else
                        <div class="text-center text-gray-500">
                            <div class="flex justify-center mb-2">
                                <img src="{{ asset('images/goalguessers.png') }}" alt="GoalGuessers Logo" class="w-8 h-8 object-contain opacity-50">
                            </div>
                            <p class="text-sm">Bet on matches to see your favorite teams!</p>
                        </div>
                    @endif
                </div>

                <!-- Quick Stats -->
                <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6">
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Quick Stats</h3>
                    <div class="space-y-3">
                        @php
                            $performance = $stats['betting_performance'] ?? [];
                        @endphp
                        <div class="flex justify-between">
                            <span class="text-gray-600">Best Winning Streak</span>
                            <span class="font-medium">{{ $performance['best_winning_streak'] ?? 0 }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Biggest Win</span>
                            <span class="font-medium text-green-600">
                                @if(isset($performance['biggest_win']))
                                    €{{ number_format($performance['biggest_win']['amount'], 2) }}
                                @else
                                    -
                                @endif
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Most Bet Type</span>
                            <span class="font-medium">
                                @php
                                    $byType = $performance['by_bet_type'] ?? [];
                                    $mostUsed = collect($byType)->sortByDesc('total')->keys()->first();
                                @endphp
                                {{ $mostUsed ? ucfirst($mostUsed) : 'None' }}
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">This Week</span>
                            <span class="font-medium">
                                @php
                                    $thisWeek = collect($performance['weekly_performance'] ?? [])->last();
                                @endphp
                                {{ $thisWeek['total_bets'] ?? 0 }} bets
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Balance Trend -->
                <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6">
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Balance Trend</h3>
                    <div class="text-center">
                        <div class="text-3xl font-bold text-gray-900 mb-1">
                            €{{ number_format($user->virtual_balance ?? 0, 2) }}
                        </div>
                        @php
                            $netProfit = $periodStats['net_profit'] ?? 0;
                        @endphp
                        <div class="text-sm {{ $netProfit >= 0 ? 'text-green-600' : 'text-red-600' }}">
                            {{ $netProfit >= 0 ? '+' : '' }}€{{ number_format($netProfit, 2) }} {{ $selectedPeriod === 'all' ? 'total' : $selectedPeriod }}
                        </div>
                        <div class="mt-4">
                            <div class="h-2 bg-gray-200 rounded-full">
                                @php
                                    $startingBalance = 1000;
                                    $currentBalance = $user->virtual_balance ?? 0;
                                    $progress = min(100, max(0, ($currentBalance / $startingBalance) * 100));
                                @endphp
                                <div class="h-2 {{ $currentBalance >= $startingBalance ? 'bg-green-500' : 'bg-red-500' }} rounded-full transition-all duration-300" style="width: {{ $progress }}%"></div>
                            </div>
                            <div class="text-xs text-gray-500 mt-1">
                                {{ $progress >= 100 ? 'Above' : 'Below' }} starting balance (€1,000)
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
