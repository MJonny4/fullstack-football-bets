<div class="min-h-screen bg-gray-50">
    <!-- Professional Navigation -->
    <x-navigation />

    <!-- Hero Section -->
    <div class="text-white py-12 bg-gradient-to-br from-th-navy to-th-blue">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center">
                <h1 class="text-4xl md:text-6xl font-bold mb-4">
                    Virtual Football Betting
                </h1>
                <p class="text-xl md:text-2xl text-gray-300 mb-8">
                    Experience the thrill with virtual money - {{ $gameweekInfo['name'] }}
                    @if($gameweekInfo['betting_open'])
                        <span class="text-green-300">(Betting Open)</span>
                    @else
                        <span class="text-red-300">(Betting Closed)</span>
                    @endif
                </p>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
                    <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                        <div class="text-3xl font-bold text-th-red">{{ $leagueStats['upcoming_matches'] }}</div>
                        <div class="text-sm text-gray-300">Upcoming Matches</div>
                    </div>
                    <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                        <div class="text-3xl font-bold text-th-red">{{ $leagueStats['active_teams'] }}</div>
                        <div class="text-sm text-gray-300">Active Teams</div>
                    </div>
                    <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                        <div class="text-3xl font-bold text-th-red">{{ $leagueStats['total_matches'] }}</div>
                        <div class="text-sm text-gray-300">Total Matches</div>
                    </div>
                    <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                        <div class="text-3xl font-bold {{ $leagueStats['live_matches'] > 0 ? 'text-red-400 animate-pulse' : 'text-th-red' }}">{{ $leagueStats['live_matches'] }}</div>
                        <div class="text-sm text-gray-300 flex items-center">
                            @if($leagueStats['live_matches'] > 0)
                                <span class="w-2 h-2 bg-red-400 rounded-full mr-2 animate-pulse"></span>
                            @endif
                            Live Matches
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Flash Messages -->
    @if (session()->has('message'))
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
                {{ session('message') }}
            </div>
        </div>
    @endif

    @if (session()->has('error'))
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                {{ session('error') }}
            </div>
        </div>
    @endif

    <!-- Live Matches Banner -->
    @if(count($liveMatches) > 0)
        <div class="bg-red-500/20 border-b border-red-400/30">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <span class="w-3 h-3 bg-red-400 rounded-full mr-3 animate-pulse"></span>
                        <h2 class="text-lg font-bold text-white">Live Now</h2>
                    </div>
                    <a href="{{ route('live-matches') }}" class="text-red-300 hover:text-white text-sm font-medium transition-colors">
                        View All Live →
                    </a>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    @foreach($liveMatches as $match)
                        <div class="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-red-400/30">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-xs text-red-300 font-medium">{{ $match['period'] }}</span>
                                <span class="text-xs text-white/60">{{ $match['gameweek'] }}</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-2">
                                    <img src="{{ $match['home_logo'] }}" alt="{{ $match['home_team'] }}" class="w-6 h-6 rounded">
                                    <span class="text-white text-sm font-medium">{{ $match['home_team'] }}</span>
                                </div>
                                <div class="text-white font-bold">{{ $match['home_goals'] }} - {{ $match['away_goals'] }}</div>
                                <div class="flex items-center space-x-2">
                                    <span class="text-white text-sm font-medium">{{ $match['away_team'] }}</span>
                                    <img src="{{ $match['away_logo'] }}" alt="{{ $match['away_team'] }}" class="w-6 h-6 rounded">
                                </div>
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>
        </div>
    @endif

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

            <!-- Upcoming Matches -->
            <div class="lg:col-span-2">
                <div class="bg-white rounded-xl shadow-lg">
                    <div class="p-6 border-b border-gray-200">
                        <h2 class="text-2xl font-bold text-gray-900">Upcoming Matches</h2>
                        <p class="text-gray-600">Place your virtual bets now</p>
                    </div>

                    <div class="divide-y divide-gray-200">
                        @foreach($upcomingMatches as $match)
                        <div class="p-6 hover:bg-gray-50 transition-colors">
                            <div class="flex items-center justify-between mb-4">
                                <div class="text-sm text-gray-500">
                                    {{ $match['match_time'] }}
                                </div>
                                <div class="flex items-center space-x-2">
                                    @if($match['betting_available'])
                                        <div class="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                                            BETTING OPEN
                                        </div>
                                    @else
                                        <div class="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                                            BETTING CLOSED
                                        </div>
                                    @endif
                                    <div class="bg-th-red text-white px-2 py-1 rounded text-xs font-medium">
                                        LIVE ODDS
                                    </div>
                                </div>
                            </div>

                            <!-- Teams -->
                            <div class="flex items-center justify-between mb-6">
                                <div class="flex items-center space-x-3">
                                    <div class="w-16 h-16 flex-shrink-0">
                                        <img src="{{ $match['home_logo'] }}" alt="{{ $match['home_team'] }}" class="w-full h-full object-contain rounded-lg">
                                    </div>
                                    <div>
                                        <div class="font-semibold text-gray-900">{{ $match['home_team'] }}</div>
                                        <div class="text-sm text-gray-500">Home</div>
                                    </div>
                                </div>

                                <div class="text-2xl font-bold text-gray-400">VS</div>

                                <div class="flex items-center space-x-3">
                                    <div>
                                        <div class="font-semibold text-gray-900 text-right">{{ $match['away_team'] }}</div>
                                        <div class="text-sm text-gray-500 text-right">Away</div>
                                    </div>
                                    <div class="w-16 h-16 flex-shrink-0">
                                        <img src="{{ $match['away_logo'] }}" alt="{{ $match['away_team'] }}" class="w-full h-full object-contain rounded-lg">
                                    </div>
                                </div>
                            </div>

                            <!-- Betting Options -->
                            <div class="grid grid-cols-3 gap-3">
                                <button
                                    wire:click="openBetModal({{ $match['id'] }}, 'home', {{ $match['home_odds'] }})"
                                    @if(!$match['betting_available']) disabled @endif
                                    class="@if($match['betting_available']) bg-white border-2 border-th-blue text-th-blue hover:bg-th-blue hover:text-white @else bg-gray-200 border-2 border-gray-300 text-gray-500 cursor-not-allowed @endif font-semibold py-3 px-4 rounded-lg transition-all duration-200 @if($match['betting_available']) transform hover:scale-105 @endif">
                                    <div class="text-xs @if($match['betting_available']) text-gray-500 @else text-gray-400 @endif">HOME WIN</div>
                                    <div class="text-lg font-bold">{{ $match['home_odds'] }}</div>
                                </button>

                                <button
                                    wire:click="openBetModal({{ $match['id'] }}, 'draw', {{ $match['draw_odds'] }})"
                                    @if(!$match['betting_available']) disabled @endif
                                    class="@if($match['betting_available']) bg-white border-2 border-gray-400 text-gray-700 hover:bg-gray-400 hover:text-white @else bg-gray-200 border-2 border-gray-300 text-gray-500 cursor-not-allowed @endif font-semibold py-3 px-4 rounded-lg transition-all duration-200 @if($match['betting_available']) transform hover:scale-105 @endif">
                                    <div class="text-xs @if($match['betting_available']) text-gray-500 @else text-gray-400 @endif">DRAW</div>
                                    <div class="text-lg font-bold">{{ $match['draw_odds'] }}</div>
                                </button>

                                <button
                                    wire:click="openBetModal({{ $match['id'] }}, 'away', {{ $match['away_odds'] }})"
                                    @if(!$match['betting_available']) disabled @endif
                                    class="@if($match['betting_available']) bg-white border-2 border-th-red text-th-red hover:bg-th-red hover:text-white @else bg-gray-200 border-2 border-gray-300 text-gray-500 cursor-not-allowed @endif font-semibold py-3 px-4 rounded-lg transition-all duration-200 @if($match['betting_available']) transform hover:scale-105 @endif">
                                    <div class="text-xs @if($match['betting_available']) text-gray-500 @else text-gray-400 @endif">AWAY WIN</div>
                                    <div class="text-lg font-bold">{{ $match['away_odds'] }}</div>
                                </button>
                            </div>

                            <!-- Additional Match Info -->
                            @if(!$match['betting_available'])
                                <div class="mt-3 text-center">
                                    <p class="text-sm text-red-600 font-medium">
                                        ⏰ Betting deadline has passed
                                    </p>
                                </div>
                            @else
                                <div class="mt-3 text-center">
                                    <p class="text-sm text-green-600 font-medium">
                                        🕐 Kickoff: {{ $match['time_until_kickoff'] }}
                                    </p>
                                </div>
                            @endif
                        </div>
                        @endforeach
                    </div>
                </div>
            </div>

            <!-- Sidebar -->
            <div class="space-y-6">

                <!-- Quick Stats -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-bold text-gray-900">Your Stats</h3>
                        @auth
                            <a href="{{ route('betting-history') }}" class="text-th-blue hover:text-th-red text-sm font-medium transition-colors">
                                View All →
                            </a>
                        @endauth
                    </div>
                    @auth
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Bets Placed</span>
                                <span class="font-semibold">{{ $userStats['total_bets'] }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Win Rate</span>
                                <span class="font-semibold {{ $userStats['win_rate'] >= 50 ? 'text-green-600' : 'text-red-600' }}">
                                    {{ $userStats['win_rate'] }}%
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Profit/Loss</span>
                                <span class="font-semibold {{ $userStats['net_profit'] >= 0 ? 'text-green-600' : 'text-red-600' }}">
                                    {{ $userStats['net_profit'] >= 0 ? '+' : '' }}{{ $this->formatCurrency($userStats['net_profit']) }}
                                </span>
                            </div>
                            @if($userStats['total_bets'] == 0)
                                <div class="text-center py-4">
                                    <div class="text-4xl mb-2">🎯</div>
                                    <p class="text-gray-500 text-sm">Place your first bet to see stats!</p>
                                </div>
                            @endif
                        </div>
                    @else
                        <div class="text-center py-6">
                            <div class="text-4xl mb-3">📊</div>
                            <p class="text-gray-500 text-sm mb-4">Login to view your betting stats</p>
                            <a href="{{ route('login') }}" class="bg-th-blue hover:bg-th-red text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
                                Login Now
                            </a>
                        </div>
                    @endauth
                </div>

                <!-- Top Leagues -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Virtual Leagues</h3>
                    <div class="space-y-3">
                        <div class="flex items-center justify-between p-3 bg-gradient-to-r from-th-red/10 to-th-blue/10 rounded-lg">
                            <div class="flex items-center space-x-2">
                                <span class="text-lg">🏆</span>
                                <span class="font-medium">Premier Virtual</span>
                            </div>
                            <span class="text-sm text-gray-600">24 matches</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div class="flex items-center space-x-2">
                                <img src="{{ asset('images/goalguessers.png') }}" alt="GoalGuessers Logo" class="w-5 h-5 object-contain">
                                <span class="font-medium">Championship V</span>
                            </div>
                            <span class="text-sm text-gray-600">18 matches</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div class="flex items-center space-x-2">
                                <span class="text-lg">🥅</span>
                                <span class="font-medium">League Virtual</span>
                            </div>
                            <span class="text-sm text-gray-600">12 matches</span>
                        </div>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-bold text-gray-900">Recent Activity</h3>
                        @auth
                            <a href="{{ route('betting-history') }}" class="text-th-blue hover:text-th-red text-sm font-medium transition-colors">
                                View All →
                            </a>
                        @endauth
                    </div>
                    @auth
                        @if(count($userStats['recent_activity']) > 0)
                            <div class="space-y-3">
                                @foreach($userStats['recent_activity'] as $activity)
                                    <div class="flex items-center space-x-3 p-3 {{ $activity['status'] === 'won' ? 'bg-green-50' : ($activity['status'] === 'lost' ? 'bg-red-50' : 'bg-gray-50') }} rounded-lg">
                                        <div class="w-2 h-2 {{ $activity['status'] === 'won' ? 'bg-green-500' : ($activity['status'] === 'lost' ? 'bg-red-500' : 'bg-gray-500') }} rounded-full"></div>
                                        <div class="flex-1">
                                            <div class="text-sm font-medium">{{ $activity['match'] }}</div>
                                            <div class="text-xs text-gray-500">
                                                {{ ucfirst($activity['bet_type']) }} bet • {{ $activity['gameweek'] }}
                                            </div>
                                            <div class="text-xs {{ $activity['status'] === 'won' ? 'text-green-600' : ($activity['status'] === 'lost' ? 'text-red-600' : 'text-gray-600') }} font-medium">
                                                @if($activity['status'] === 'won')
                                                    You won {{ $this->formatCurrency($activity['actual_winnings']) }}
                                                @elseif($activity['status'] === 'lost')
                                                    You lost {{ $this->formatCurrency($activity['amount']) }}
                                                @else
                                                    Bet pending
                                                @endif
                                            </div>
                                        </div>
                                        <div class="text-xs text-gray-400">
                                            {{ $activity['created_at']->diffForHumans() }}
                                        </div>
                                    </div>
                                @endforeach
                            </div>
                        @else
                            <div class="text-center py-6">
                                <div class="text-4xl mb-3">📈</div>
                                <p class="text-gray-500 text-sm">No recent activity</p>
                                <p class="text-gray-400 text-xs mt-1">Start betting to see activity here!</p>
                            </div>
                        @endif
                    @else
                        <div class="text-center py-6">
                            <div class="text-4xl mb-3">📈</div>
                            <p class="text-gray-500 text-sm mb-4">Login to view your activity</p>
                            <a href="{{ route('login') }}" class="bg-th-blue hover:bg-th-red text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
                                Login Now
                            </a>
                        </div>
                    @endauth
                </div>
            </div>
        </div>
    </div>

    <!-- Bet Modal -->
    <livewire:bet-modal />

    <!-- Footer -->
    <footer class="bg-th-navy text-white py-8 mt-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center">
                <div class="text-lg font-semibold mb-2">GoalGuessers</div>
                <div class="text-gray-400 text-sm">
                    Virtual football betting with fake money - No real gambling involved
                </div>
                <div class="text-gray-500 text-xs mt-2">
                    This is a demonstration platform using virtual currency only
                </div>
            </div>
        </div>
    </footer>
</div>
