<div>
    <!-- Modal Backdrop -->
    @if($isOpen)
        <div class="fixed inset-0 z-50 overflow-y-auto" wire:keydown.escape="closeModal">
            <!-- Background overlay -->
            <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
                 wire:click="closeModal"></div>

            <!-- Modal container -->
            <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transform transition-all sm:max-w-lg sm:w-full">

                    <!-- Modal Header -->
                    <div class="bg-gradient-to-r from-th-red to-th-blue px-6 py-4 rounded-t-2xl">
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-bold text-white flex items-center">
                                <span class="w-2 h-2 bg-white rounded-full mr-3 animate-pulse"></span>
                                Confirm Your Bet
                            </h3>
                            <button wire:click="closeModal"
                                    class="text-white hover:text-gray-200 transition-colors">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                    </div>

                    @if($match)
                        <div class="px-6 py-6">
                            <!-- Match Info -->
                            <div class="text-center mb-6">
                                <div class="text-sm text-gray-500 mb-2">{{ $match->gameweek->name }}</div>
                                <div class="flex items-center justify-center space-x-4">
                                    <div class="flex items-center space-x-2">
                                        <img src="{{ $match->homeTeam->logo_url }}"
                                             alt="{{ $match->homeTeam->name }}"
                                             class="w-8 h-8 rounded">
                                        <span class="font-medium text-gray-800 dark:text-gray-200">{{ $match->homeTeam->name }}</span>
                                    </div>
                                    <span class="text-gray-400 font-bold">vs</span>
                                    <div class="flex items-center space-x-2">
                                        <span class="font-medium text-gray-800 dark:text-gray-200">{{ $match->awayTeam->name }}</span>
                                        <img src="{{ $match->awayTeam->logo_url }}"
                                             alt="{{ $match->awayTeam->name }}"
                                             class="w-8 h-8 rounded">
                                    </div>
                                </div>
                                <div class="text-sm text-gray-500 mt-2">
                                    {{ $match->getFormattedKickoffDate() }} - {{ $match->getFormattedKickoffTime() }}
                                </div>
                            </div>

                            <!-- Bet Details -->
                            <div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
                                <div class="text-center">
                                    <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">Your Selection</div>
                                    <div class="text-xl font-bold {{ $this->getBetTypeColor() }} mb-2">
                                        {{ $this->getBetTypeDisplay() }}
                                    </div>
                                    <div class="text-sm text-gray-600 dark:text-gray-300">
                                        Odds: <span class="font-bold text-th-red">{{ $odds }}</span>
                                        <span class="text-gray-400 ml-2">({{ $this->getImpliedProbability() }}% chance)</span>
                                    </div>
                                </div>
                            </div>

                            <!-- User Betting Insights -->
                            @php $userStats = $this->getUserBettingStats() @endphp
                            @if($userStats)
                                <div class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4">
                                    <div class="flex items-center mb-2">
                                        <svg class="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                                        </svg>
                                        <span class="text-blue-800 dark:text-blue-300 text-sm font-medium">Today's Activity</span>
                                    </div>
                                    <div class="grid grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <span class="text-blue-600 dark:text-blue-400">Bets Today:</span>
                                            <span class="font-medium text-blue-800 dark:text-blue-300">{{ $userStats['total_bets_today'] }}</span>
                                        </div>
                                        <div>
                                            <span class="text-blue-600 dark:text-blue-400">Wagered:</span>
                                            <span class="font-medium text-blue-800 dark:text-blue-300">€{{ number_format($userStats['wagered_today'], 2) }}</span>
                                        </div>
                                        @if($userStats['recent_streak']['count'] > 1)
                                            <div class="col-span-2">
                                                <span class="text-blue-600 dark:text-blue-400">Recent Streak:</span>
                                                <span class="font-medium {{ $userStats['recent_streak']['type'] === 'won' ? 'text-green-600' : 'text-red-600' }}">
                                                    {{ $userStats['recent_streak']['count'] }} {{ $userStats['recent_streak']['type'] === 'won' ? 'wins' : 'losses' }}
                                                </span>
                                            </div>
                                        @endif
                                    </div>
                                </div>
                            @endif

                            <!-- Bet Amount Input -->
                            <div class="mb-6">
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Bet Amount (€{{ number_format(self::MIN_BET_AMOUNT, 0) }} - €{{ number_format(self::MAX_BET_AMOUNT, 0) }})
                                </label>

                                <!-- Quick Amount Buttons -->
                                <div class="grid grid-cols-5 gap-2 mb-3">
                                    <button wire:click="setQuickAmount(5)"
                                            class="py-2 px-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors
                                                   {{ $betAmount == 5 ? 'bg-th-blue text-white border-th-blue' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300' }}">
                                        €5
                                    </button>
                                    <button wire:click="setQuickAmount(10)"
                                            class="py-2 px-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors
                                                   {{ $betAmount == 10 ? 'bg-th-blue text-white border-th-blue' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300' }}">
                                        €10
                                    </button>
                                    <button wire:click="setQuickAmount(25)"
                                            class="py-2 px-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors
                                                   {{ $betAmount == 25 ? 'bg-th-blue text-white border-th-blue' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300' }}">
                                        €25
                                    </button>
                                    <button wire:click="setQuickAmount(50)"
                                            class="py-2 px-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors
                                                   {{ $betAmount == 50 ? 'bg-th-blue text-white border-th-blue' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300' }}">
                                        €50
                                    </button>
                                    <button wire:click="setMaxBet"
                                            class="py-2 px-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors
                                                   {{ $betAmount == $maxBetForBalance ? 'bg-th-red text-white border-th-red' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300' }}">
                                        MAX
                                    </button>
                                </div>

                                <!-- Custom Amount Input -->
                                <div class="relative">
                                    <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">€</span>
                                    <input type="number"
                                           wire:model.live="betAmount"
                                           min="{{ self::MIN_BET_AMOUNT }}"
                                           max="{{ self::MAX_BET_AMOUNT }}"
                                           step="0.01"
                                           class="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-th-blue focus:border-transparent text-lg font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                           placeholder="Enter amount">
                                </div>

                                @error('betAmount')
                                    <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                                @enderror
                            </div>

                            <!-- Bet Summary -->
                            <div class="bg-th-navy text-white rounded-xl p-4 mb-6">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-sm opacity-80">Your Bet:</span>
                                    <span class="font-bold">€{{ number_format($betAmount, 2) }}</span>
                                </div>
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-sm opacity-80">Potential Return:</span>
                                    <span class="font-bold text-green-400">€{{ number_format($potentialWinnings, 2) }}</span>
                                </div>
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-sm opacity-80">Net Profit:</span>
                                    <span class="font-bold text-green-300">€{{ number_format($netProfit, 2) }}</span>
                                </div>
                                <hr class="border-white/20 my-3">
                                <div class="flex justify-between items-center">
                                    <span class="text-sm opacity-80">Your Balance:</span>
                                    <span class="font-bold">€{{ number_format($userBalance, 2) }}</span>
                                </div>

                                <!-- Advanced Calculations Toggle -->
                                <button wire:click="toggleAdvancedCalculations"
                                        class="w-full mt-3 py-2 text-xs text-white/60 hover:text-white transition-colors border-t border-white/20 pt-3">
                                    {{ $showAdvancedCalculations ? '▼ Hide Details' : '▶ Show Advanced Info' }}
                                </button>

                                @if($showAdvancedCalculations)
                                    <div class="mt-3 pt-3 border-t border-white/20 space-y-2">
                                        <div class="flex justify-between items-center">
                                            <span class="text-xs opacity-70">Implied Probability:</span>
                                            <span class="text-xs font-medium">{{ $this->getImpliedProbability() }}%</span>
                                        </div>
                                        <div class="flex justify-between items-center">
                                            <span class="text-xs opacity-70">Balance After Bet:</span>
                                            <span class="text-xs font-medium">€{{ number_format($userBalance - $betAmount, 2) }}</span>
                                        </div>
                                        @if($maxBetForBalance > 0)
                                            <div class="flex justify-between items-center">
                                                <span class="text-xs opacity-70">Max Possible Bet:</span>
                                                <span class="text-xs font-medium">€{{ number_format($maxBetForBalance, 2) }}</span>
                                            </div>
                                        @endif
                                    </div>
                                @endif
                            </div>

                            <!-- Balance Warning -->
                            @if($userBalance < $betAmount)
                                <div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3 mb-4">
                                    <div class="flex items-center">
                                        <svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                                        </svg>
                                        <span class="text-red-700 dark:text-red-300 text-sm font-medium">
                                            Insufficient balance. You need €{{ number_format($betAmount - $userBalance, 2) }} more.
                                        </span>
                                    </div>
                                </div>
                            @endif

                            <!-- Action Buttons -->
                            <div class="flex space-x-3">
                                <button wire:click="closeModal"
                                        class="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 transition-all duration-200 transform hover:scale-105">
                                    Cancel
                                </button>
                                <button wire:click="confirmBet"
                                        @if(!$this->isBettingAvailable() || $userBalance < $betAmount) disabled @endif
                                        class="flex-1 py-3 px-4 bg-gradient-to-r from-th-red to-red-600 text-white font-bold rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg">
                                    @if(!$this->isBettingAvailable())
                                        🔒 Betting Closed
                                    @elseif($userBalance < $betAmount)
                                        💰 Insufficient Balance
                                    @else
                                        🎯 Place Bet - €{{ number_format($betAmount, 2) }}
                                    @endif
                                </button>
                            </div>

                            <!-- Additional Info -->
                            <div class="mt-4 text-center">
                                <p class="text-xs text-gray-500 dark:text-gray-400">
                                    💡 By placing this bet, €{{ number_format($betAmount, 2) }} will be deducted from your balance
                                </p>
                            </div>
                        </div>
                    @endif
                </div>
            </div>
        </div>
    @endif
</div>