<div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
    <!-- Professional Navigation -->
    <x-navigation />

    <!-- Page Header -->
    <div class="bg-gradient-to-br from-th-navy to-th-blue text-white py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold">Betting & Transactions</h1>
                    <p class="text-gray-300 mt-2">Complete view of your betting activity, performance, and virtual money flow</p>
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold text-th-red">{{ $this->formatCurrency($user->virtual_balance) }}</div>
                    <div class="text-sm text-gray-300">Current Balance</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Enhanced Statistics Dashboard -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
                <div class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ $transactionStats['total_transactions'] }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">Total Bets</div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {{ $transactionStats['won_bets'] }}W • {{ $transactionStats['lost_bets'] }}L
                </div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
                <div class="text-2xl font-bold text-red-600">{{ $this->formatCurrency($transactionStats['total_wagered']) }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">Total Wagered</div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Money spent on bets</div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
                <div class="text-2xl font-bold text-green-600">{{ $this->formatCurrency($transactionStats['total_winnings']) }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">Total Winnings</div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Money earned from wins</div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
                <div class="text-2xl font-bold {{ $transactionStats['net_change'] >= 0 ? 'text-green-600' : 'text-red-600' }}">
                    {{ $transactionStats['net_change'] >= 0 ? '+' : '' }}{{ $this->formatCurrency($transactionStats['net_change']) }}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">Net Profit/Loss</div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {{ $transactionStats['win_rate'] }}% Win Rate
                </div>
            </div>
        </div>

        <!-- Advanced Filters -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors mb-8">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 lg:mb-0">Filter & Search</h2>
                <button
                    wire:click="clearFilters"
                    class="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    Clear All Filters
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <!-- Status Filter -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                    <select wire:model.live="selectedStatus" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-th-blue focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                        <option value="all">All Status</option>
                        @foreach($statusOptions as $value => $label)
                            <option value="{{ $value }}">{{ $label }}</option>
                        @endforeach
                    </select>
                </div>

                <!-- Bet Type Filter -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bet Type</label>
                    <select wire:model.live="selectedBetType" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-th-blue focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                        <option value="all">All Types</option>
                        @foreach($betTypeOptions as $value => $label)
                            <option value="{{ $value }}">{{ $label }}</option>
                        @endforeach
                    </select>
                </div>

                <!-- Team Filter -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Team</label>
                    <select wire:model.live="selectedTeam" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-th-blue focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                        <option value="">All Teams</option>
                        @foreach($teams as $team)
                            <option value="{{ $team->id }}">{{ $team->name }}</option>
                        @endforeach
                    </select>
                </div>

                <!-- Gameweek Filter -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gameweek</label>
                    <select wire:model.live="selectedGameweek" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-th-blue focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                        <option value="">All Gameweeks</option>
                        @foreach($gameweeks as $gameweek)
                            <option value="{{ $gameweek->id }}">{{ $gameweek->name }}</option>
                        @endforeach
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Date From -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">From Date</label>
                    <input
                        type="date"
                        wire:model.live="dateFrom"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-th-blue focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                </div>

                <!-- Date To -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To Date</label>
                    <input
                        type="date"
                        wire:model.live="dateTo"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-th-blue focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                </div>

                <!-- Search -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Teams</label>
                    <input
                        type="text"
                        wire:model.live.debounce.300ms="searchTerm"
                        placeholder="Search by team name..."
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-th-blue focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

            <!-- Transaction/Betting List -->
            <div class="lg:col-span-2">
                <div class="bg-white rounded-xl shadow-lg">
                    <!-- Header with Results Count -->
                    <div class="p-6 border-b border-gray-200">
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">
                                Betting Activity
                                <span class="text-sm font-normal text-gray-500">
                                    ({{ $transactions->total() }} results)
                                </span>
                            </h3>
                        </div>
                    </div>

                    <!-- Transaction List -->
                    <div class="divide-y divide-gray-200">
                        @forelse($transactions as $bet)
                            <div class="p-6 hover:bg-gray-50 transition-colors">
                                <div class="flex items-start justify-between">
                                    <div class="flex items-start space-x-4 flex-1">
                                        <!-- Status Icon -->
                                        <div class="w-10 h-10 rounded-full flex items-center justify-center {{ $this->getBetStatusClass($bet->status) }} border">
                                            @if($bet->status === 'won')
                                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                                </svg>
                                            @elseif($bet->status === 'lost')
                                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                                                </svg>
                                            @else
                                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
                                                </svg>
                                            @endif
                                        </div>

                                        <!-- Bet Details -->
                                        <div class="flex-1 min-w-0">
                                            <div class="flex items-center space-x-2 mb-2">
                                                <h4 class="font-semibold text-gray-900 dark:text-gray-100">
                                                    {{ $bet->match->homeTeam->name }} vs {{ $bet->match->awayTeam->name }}
                                                </h4>
                                                <span class="px-2 py-1 text-xs rounded-full {{ $this->getBetStatusClass($bet->status) }}">
                                                    {{ ucfirst($bet->status) }}
                                                </span>
                                            </div>

                                            <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                <span class="font-medium">{{ $this->getBetTypeDisplay($bet->bet_type) }}</span>
                                                @ {{ $bet->odds }} odds •
                                                {{ $bet->match->gameweek->name ?? 'Unknown Gameweek' }}
                                            </div>

                                            <div class="text-xs text-gray-500 dark:text-gray-400">
                                                {{ $bet->created_at->format('M d, Y H:i') }}
                                                @if($bet->updated_at != $bet->created_at && in_array($bet->status, ['won', 'lost']))
                                                    • Settled: {{ $bet->updated_at->format('M d, H:i') }}
                                                @endif
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Financial Details -->
                                    <div class="text-right ml-4">
                                        <div class="font-bold text-lg text-red-600 mb-1">
                                            -{{ $this->formatCurrency($bet->amount) }}
                                        </div>
                                        @if($bet->status === 'won')
                                            <div class="font-bold text-lg text-green-600">
                                                +{{ $this->formatCurrency($bet->actual_winnings) }}
                                            </div>
                                            <div class="text-sm text-green-600">
                                                Net: +{{ $this->formatCurrency($bet->actual_winnings - $bet->amount) }}
                                            </div>
                                        @elseif($bet->status === 'pending')
                                            <div class="text-sm text-orange-600">
                                                Potential: {{ $this->formatCurrency($bet->potential_winnings) }}
                                            </div>
                                            <div class="text-xs text-gray-500 dark:text-gray-400">
                                                If wins: +{{ $this->formatCurrency($bet->potential_winnings - $bet->amount) }}
                                            </div>
                                        @else
                                            <div class="text-sm text-gray-500">
                                                Lost: {{ $this->formatCurrency($bet->amount) }}
                                            </div>
                                        @endif
                                    </div>
                                </div>
                            </div>
                        @empty
                            <div class="p-12 text-center">
                                <div class="text-6xl mb-4">🎯</div>
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No bets found</h3>
                                <p class="text-gray-600 mb-6">
                                    @if($searchTerm || $selectedStatus !== 'all' || $selectedBetType !== 'all' || $selectedTeam || $selectedGameweek || $dateFrom || $dateTo)
                                        No bets match your current filters. Try adjusting your search criteria.
                                    @else
                                        Start betting to see your transaction history here!
                                    @endif
                                </p>
                                @if(!$searchTerm && $selectedStatus === 'all')
                                    <a href="{{ route('home') }}" class="bg-th-blue hover:bg-th-red text-white px-6 py-3 rounded-lg font-medium transition-colors">
                                        Start Betting
                                    </a>
                                @else
                                    <button
                                        wire:click="clearFilters"
                                        class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                                    >
                                        Clear Filters
                                    </button>
                                @endif
                            </div>
                        @endforelse
                    </div>

                    <!-- Pagination -->
                    @if($transactions->hasPages())
                        <div class="p-6 border-t border-gray-200">
                            {{ $transactions->links() }}
                        </div>
                    @endif
                </div>
            </div>

            <!-- Sidebar -->
            <div class="space-y-6">

                <!-- Quick Actions -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h3>
                    <div class="space-y-3">
                        <a href="{{ route('home') }}" class="block w-full text-center bg-th-blue hover:bg-th-red text-white py-3 rounded-lg font-medium transition-colors">
                            Place New Bet
                        </a>
                        <a href="{{ route('dashboard') }}" class="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium transition-colors">
                            Dashboard
                        </a>
                        <a href="{{ route('profile') }}" class="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium transition-colors">
                            Profile Settings
                        </a>
                    </div>
                </div>

                <!-- Performance Summary -->
                @if($transactionStats['total_transactions'] > 0)
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
                        <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Performance Summary</h3>
                        <div class="space-y-4">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Win Rate</span>
                                <span class="font-semibold {{ $transactionStats['win_rate'] >= 50 ? 'text-green-600' : 'text-red-600' }}">
                                    {{ $transactionStats['win_rate'] }}%
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Total Profit/Loss</span>
                                <span class="font-semibold {{ $transactionStats['net_change'] >= 0 ? 'text-green-600' : 'text-red-600' }}">
                                    {{ $transactionStats['net_change'] >= 0 ? '+' : '' }}{{ $this->formatCurrency($transactionStats['net_change']) }}
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Avg Bet Amount</span>
                                <span class="font-semibold">
                                    {{ $this->formatCurrency($transactionStats['total_wagered'] / $transactionStats['total_transactions']) }}
                                </span>
                            </div>
                            @if($transactionStats['pending_amount'] > 0)
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Pending Amount</span>
                                    <span class="font-semibold text-orange-600">
                                        {{ $this->formatCurrency($transactionStats['pending_amount']) }}
                                    </span>
                                </div>
                            @endif
                        </div>
                    </div>
                @endif

                <!-- Recent Balance Changes -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Recent Balance Changes</h3>
                    <div class="space-y-3 max-h-80 overflow-y-auto">
                        @foreach($balanceHistory as $entry)
                            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div class="flex-1 min-w-0">
                                    <div class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ $entry['description'] }}</div>
                                    <div class="text-xs text-gray-500 dark:text-gray-400">{{ $entry['date'] }}</div>
                                </div>
                                <div class="text-right ml-2">
                                    <div class="font-semibold {{ ($entry['change'] ?? 0) >= 0 ? 'text-green-600' : 'text-red-600' }}">
                                        {{ ($entry['change'] ?? 0) >= 0 ? '+' : '' }}{{ $this->formatCurrency($entry['change'] ?? 0) }}
                                    </div>
                                    <div class="text-xs text-gray-500 dark:text-gray-400">{{ $this->formatCurrency($entry['balance']) }}</div>
                                </div>
                            </div>
                        @endforeach
                    </div>
                </div>

                <!-- Export Options -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Export Data</h3>
                    <div class="space-y-3">
                        <button class="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium transition-colors" onclick="alert('CSV export coming soon!')">
                            📊 Export to CSV
                        </button>
                        <button class="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium transition-colors" onclick="alert('PDF export coming soon!')">
                            📄 Export to PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>