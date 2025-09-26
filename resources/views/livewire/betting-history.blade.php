<div>
    <!-- Navigation -->
    <x-navigation />

    <div class="min-h-screen bg-gradient-to-br from-th-blue via-th-navy to-th-red">
    <!-- Header Section -->
    <div class="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-white">My Betting History</h1>
                    <p class="text-white/80 mt-1">Track your betting performance and history</p>
                </div>
                <div class="hidden md:flex items-center space-x-4">
                    <div class="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                        <span class="text-white/80 text-sm">Total Bets:</span>
                        <span class="text-white font-bold ml-2">{{ $totalBets }}</span>
                    </div>
                    <div class="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                        <span class="text-white/80 text-sm">Win Rate:</span>
                        <span class="text-white font-bold ml-2">{{ $winRate }}%</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Total Bets -->
            <div class="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-blue-500/20">
                        <span class="text-2xl">🎯</span>
                    </div>
                    <div class="ml-4">
                        <p class="text-white/80 text-sm font-medium">Total Bets</p>
                        <p class="text-2xl font-bold text-white">{{ $totalBets }}</p>
                    </div>
                </div>
            </div>

            <!-- Total Wagered -->
            <div class="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-yellow-500/20">
                        <span class="text-2xl">💰</span>
                    </div>
                    <div class="ml-4">
                        <p class="text-white/80 text-sm font-medium">Total Wagered</p>
                        <p class="text-2xl font-bold text-white">{{ $this->formatCurrency($totalWagered) }}</p>
                    </div>
                </div>
            </div>

            <!-- Total Winnings -->
            <div class="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-green-500/20">
                        <span class="text-2xl">🏆</span>
                    </div>
                    <div class="ml-4">
                        <p class="text-white/80 text-sm font-medium">Total Winnings</p>
                        <p class="text-2xl font-bold text-white">{{ $this->formatCurrency($totalWinnings) }}</p>
                    </div>
                </div>
            </div>

            <!-- Profit/Loss -->
            <div class="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                <div class="flex items-center">
                    <div class="p-3 rounded-full {{ $profitLoss >= 0 ? 'bg-green-500/20' : 'bg-red-500/20' }}">
                        <span class="text-2xl">{{ $profitLoss >= 0 ? '📈' : '📉' }}</span>
                    </div>
                    <div class="ml-4">
                        <p class="text-white/80 text-sm font-medium">Profit/Loss</p>
                        <p class="text-2xl font-bold {{ $this->getProfitLossClass() }}">
                            {{ $profitLoss >= 0 ? '+' : '' }}{{ $this->formatCurrency($profitLoss) }}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filters Section -->
        <div class="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30 mb-8">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                <h3 class="text-lg font-semibold text-white mb-4 lg:mb-0">Filter Bets</h3>
                <button
                    wire:click="clearFilters"
                    class="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    Clear All Filters
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Status Filter -->
                <div>
                    <label class="block text-sm font-medium text-white/80 mb-2">Status</label>
                    <select wire:model.live="selectedStatus" class="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50">
                        <option value="all">All Statuses</option>
                        @foreach($statusOptions as $value => $label)
                            <option value="{{ $value }}">{{ $label }}</option>
                        @endforeach
                    </select>
                </div>

                <!-- Bet Type Filter -->
                <div>
                    <label class="block text-sm font-medium text-white/80 mb-2">Bet Type</label>
                    <select wire:model.live="selectedBetType" class="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50">
                        <option value="all">All Types</option>
                        @foreach($betTypeOptions as $value => $label)
                            <option value="{{ $value }}">{{ $label }}</option>
                        @endforeach
                    </select>
                </div>

                <!-- Team Filter -->
                <div>
                    <label class="block text-sm font-medium text-white/80 mb-2">Team</label>
                    <select wire:model.live="selectedTeam" class="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50">
                        <option value="">All Teams</option>
                        @foreach($teams as $team)
                            <option value="{{ $team->id }}">{{ $team->name }}</option>
                        @endforeach
                    </select>
                </div>

                <!-- Gameweek Filter -->
                <div>
                    <label class="block text-sm font-medium text-white/80 mb-2">Gameweek</label>
                    <select wire:model.live="selectedGameweek" class="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50">
                        <option value="">All Gameweeks</option>
                        @foreach($gameweeks as $gameweek)
                            <option value="{{ $gameweek->id }}">{{ $gameweek->name }}</option>
                        @endforeach
                    </select>
                </div>
            </div>

            <!-- Date Range and Search -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                    <label class="block text-sm font-medium text-white/80 mb-2">From Date</label>
                    <input
                        type="date"
                        wire:model.live="dateFrom"
                        class="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                </div>
                <div>
                    <label class="block text-sm font-medium text-white/80 mb-2">To Date</label>
                    <input
                        type="date"
                        wire:model.live="dateTo"
                        class="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                </div>
                <div>
                    <label class="block text-sm font-medium text-white/80 mb-2">Search Teams</label>
                    <input
                        type="text"
                        wire:model.live.debounce.300ms="searchTerm"
                        placeholder="Search by team name..."
                        class="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                </div>
            </div>
        </div>

        <!-- Betting History Table -->
        <div class="bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 overflow-hidden">
            <div class="px-6 py-4 border-b border-white/20">
                <h3 class="text-lg font-semibold text-white">Bet History</h3>
            </div>

            @if($bets->count() > 0)
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-white/20">
                        <thead class="bg-white/10">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Match</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Bet</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Amount</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Odds</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Potential Win</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Result</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-white/10">
                            @foreach($bets as $bet)
                                <tr class="hover:bg-white/5 transition-colors">
                                    <!-- Match -->
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="flex items-center space-x-2">
                                            <div class="flex items-center space-x-1">
                                                <img src="{{ $bet->match->homeTeam->logo_url }}" alt="{{ $bet->match->homeTeam->name }}" class="w-6 h-6">
                                                <span class="text-white text-sm font-medium">{{ $bet->match->homeTeam->short_name }}</span>
                                            </div>
                                            <span class="text-white/60 text-xs">vs</span>
                                            <div class="flex items-center space-x-1">
                                                <span class="text-white text-sm font-medium">{{ $bet->match->awayTeam->short_name }}</span>
                                                <img src="{{ $bet->match->awayTeam->logo_url }}" alt="{{ $bet->match->awayTeam->name }}" class="w-6 h-6">
                                            </div>
                                        </div>
                                        <div class="text-xs text-white/60 mt-1">
                                            {{ $bet->match->gameweek->name }}
                                        </div>
                                    </td>

                                    <!-- Bet Type -->
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="text-white font-medium">{{ $this->getBetTypeDisplay($bet->bet_type) }}</span>
                                    </td>

                                    <!-- Amount -->
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="text-white font-semibold">{{ $this->formatCurrency($bet->amount) }}</span>
                                    </td>

                                    <!-- Odds -->
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="text-white">{{ number_format($bet->odds, 2) }}</span>
                                    </td>

                                    <!-- Potential Win -->
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="text-green-400 font-semibold">{{ $this->formatCurrency($bet->potential_winnings) }}</span>
                                    </td>

                                    <!-- Status -->
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full border {{ $this->getBetStatusClass($bet->status) }}">
                                            {{ ucfirst($bet->status) }}
                                        </span>
                                    </td>

                                    <!-- Result -->
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        @if($bet->status === 'won')
                                            <span class="text-green-400 font-semibold">+{{ $this->formatCurrency($bet->winnings) }}</span>
                                        @elseif($bet->status === 'lost')
                                            <span class="text-red-400 font-semibold">-{{ $this->formatCurrency($bet->amount) }}</span>
                                        @else
                                            <span class="text-white/60">-</span>
                                        @endif
                                    </td>

                                    <!-- Date -->
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                                        {{ $bet->created_at->setTimezone('Europe/Madrid')->format('M d, Y') }}
                                        <div class="text-xs text-white/60">
                                            {{ $bet->created_at->setTimezone('Europe/Madrid')->format('H:i') }}
                                        </div>
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <div class="px-6 py-4 border-t border-white/20">
                    {{ $bets->links() }}
                </div>
            @else
                <div class="px-6 py-12 text-center">
                    <div class="text-6xl mb-4">📊</div>
                    <h3 class="text-lg font-semibold text-white mb-2">No Betting History Found</h3>
                    <p class="text-white/60 mb-6">
                        @if($selectedStatus !== 'all' || $selectedBetType !== 'all' || $selectedTeam || $selectedGameweek || $dateFrom || $dateTo || $searchTerm)
                            No bets match your current filters. Try adjusting your search criteria.
                        @else
                            You haven't placed any bets yet. Start betting on matches to see your history here!
                        @endif
                    </p>
                    @if($selectedStatus !== 'all' || $selectedBetType !== 'all' || $selectedTeam || $selectedGameweek || $dateFrom || $dateTo || $searchTerm)
                        <button
                            wire:click="clearFilters"
                            class="bg-th-red hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                            Clear Filters
                        </button>
                    @else
                        <a href="{{ route('home') }}" class="bg-th-red hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-block">
                            Start Betting Now
                        </a>
                    @endif
                </div>
            @endif
        </div>

        <!-- Mobile Stats (Hidden on desktop) -->
        <div class="md:hidden mt-8 grid grid-cols-2 gap-4">
            <div class="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-white">{{ $totalBets }}</div>
                <div class="text-sm text-white/80">Total Bets</div>
            </div>
            <div class="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-white">{{ $winRate }}%</div>
                <div class="text-sm text-white/80">Win Rate</div>
            </div>
        </div>
    </div>
    </div>
</div>