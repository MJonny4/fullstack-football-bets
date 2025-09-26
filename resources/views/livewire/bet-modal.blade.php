<div>
    <!-- Modal Backdrop -->
    @if($isOpen)
        <div class="fixed inset-0 z-50 overflow-y-auto" wire:keydown.escape="closeModal">
            <!-- Background overlay -->
            <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
                 wire:click="closeModal"></div>

            <!-- Modal container -->
            <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                <div class="relative bg-white rounded-2xl shadow-2xl transform transition-all sm:max-w-lg sm:w-full">

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
                                        <span class="font-medium text-gray-800">{{ $match->homeTeam->name }}</span>
                                    </div>
                                    <span class="text-gray-400 font-bold">vs</span>
                                    <div class="flex items-center space-x-2">
                                        <span class="font-medium text-gray-800">{{ $match->awayTeam->name }}</span>
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
                            <div class="bg-gray-50 rounded-xl p-4 mb-6">
                                <div class="text-center">
                                    <div class="text-sm text-gray-500 mb-1">Your Selection</div>
                                    <div class="text-xl font-bold {{ $this->getBetTypeColor() }} mb-2">
                                        {{ $this->getBetTypeDisplay() }}
                                    </div>
                                    <div class="text-sm text-gray-600">
                                        Odds: <span class="font-bold text-th-red">{{ $odds }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Bet Amount Input -->
                            <div class="mb-6">
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    Bet Amount (€{{ number_format(self::MIN_BET_AMOUNT, 0) }} - €{{ number_format(self::MAX_BET_AMOUNT, 0) }})
                                </label>

                                <!-- Quick Amount Buttons -->
                                <div class="flex space-x-2 mb-3">
                                    <button wire:click="setQuickAmount(5)"
                                            class="flex-1 py-2 px-3 text-sm border rounded-lg hover:bg-gray-50 transition-colors
                                                   {{ $betAmount == 5 ? 'bg-th-blue text-white border-th-blue' : 'bg-white border-gray-300 text-gray-700' }}">
                                        €5
                                    </button>
                                    <button wire:click="setQuickAmount(10)"
                                            class="flex-1 py-2 px-3 text-sm border rounded-lg hover:bg-gray-50 transition-colors
                                                   {{ $betAmount == 10 ? 'bg-th-blue text-white border-th-blue' : 'bg-white border-gray-300 text-gray-700' }}">
                                        €10
                                    </button>
                                    <button wire:click="setQuickAmount(25)"
                                            class="flex-1 py-2 px-3 text-sm border rounded-lg hover:bg-gray-50 transition-colors
                                                   {{ $betAmount == 25 ? 'bg-th-blue text-white border-th-blue' : 'bg-white border-gray-300 text-gray-700' }}">
                                        €25
                                    </button>
                                    <button wire:click="setQuickAmount(50)"
                                            class="flex-1 py-2 px-3 text-sm border rounded-lg hover:bg-gray-50 transition-colors
                                                   {{ $betAmount == 50 ? 'bg-th-blue text-white border-th-blue' : 'bg-white border-gray-300 text-gray-700' }}">
                                        €50
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
                                           class="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-th-blue focus:border-transparent text-lg font-medium"
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
                                    <span class="text-sm opacity-80">Potential Win:</span>
                                    <span class="font-bold text-green-400">€{{ number_format($potentialWinnings, 2) }}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-sm opacity-80">Your Balance:</span>
                                    <span class="font-bold">€{{ number_format($userBalance, 2) }}</span>
                                </div>
                            </div>

                            <!-- Balance Warning -->
                            @if($userBalance < $betAmount)
                                <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                    <div class="flex items-center">
                                        <svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                                        </svg>
                                        <span class="text-red-700 text-sm font-medium">
                                            Insufficient balance. You need €{{ number_format($betAmount - $userBalance, 2) }} more.
                                        </span>
                                    </div>
                                </div>
                            @endif

                            <!-- Action Buttons -->
                            <div class="flex space-x-3">
                                <button wire:click="closeModal"
                                        class="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                                <button wire:click="confirmBet"
                                        @if(!$this->isBettingAvailable() || $userBalance < $betAmount) disabled @endif
                                        class="flex-1 py-3 px-4 bg-th-red text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    @if(!$this->isBettingAvailable())
                                        Betting Closed
                                    @else
                                        Place Bet
                                    @endif
                                </button>
                            </div>
                        </div>
                    @endif
                </div>
            </div>
        </div>
    @endif
</div>