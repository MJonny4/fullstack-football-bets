<div @if($matchData['status'] === 'live') data-auto-refresh="5000" @endif>
    <x-navigation />

    <!-- Header -->
    <div class="bg-gradient-to-r from-th-blue to-th-navy text-white py-8">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <a href="{{ route('live-matches') }}"
               class="inline-flex items-center text-blue-100 hover:text-white transition-colors mb-4">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Back to Live Matches
            </a>
            <h1 class="text-3xl font-bold">Match Details</h1>
            <p class="text-blue-100 mt-2">{{ $matchData['gameweek'] }}</p>
        </div>
    </div>

    <!-- Match Container -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">

                <!-- Match Status Header -->
                <div class="text-center py-8 border-b border-gray-200 dark:border-gray-700
                    {{ $matchData['status'] === 'live' ? 'bg-red-50 dark:bg-red-900/30' : '' }}
                    {{ $matchData['status'] === 'finished' ? 'bg-green-50 dark:bg-green-900/30' : '' }}
                    {{ $matchData['status'] === 'scheduled' ? 'bg-blue-50 dark:bg-blue-900/30' : '' }}">

                    @if($matchData['status'] === 'live')
                        <div class="flex items-center justify-center mb-2">
                            <span class="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></span>
                            <span class="text-red-600 dark:text-red-400 font-bold text-lg">LIVE</span>
                        </div>
                    @elseif($matchData['status'] === 'finished')
                        <div class="text-green-600 dark:text-green-400 font-bold text-lg mb-2">FULL TIME</div>
                    @elseif($matchData['status'] === 'scheduled')
                        <div class="text-blue-600 dark:text-blue-400 font-bold text-lg mb-2">SCHEDULED</div>
                    @endif

                    <div class="text-gray-600 dark:text-gray-400 text-sm">{{ $matchData['gameweek'] }}</div>
                    <div class="text-gray-900 dark:text-gray-100 font-bold text-xl mt-1">
                        {{ $matchData['progress']['display'] }}
                    </div>
                </div>

                <!-- Teams and Score -->
                <div class="p-12">
                    <div class="flex items-center justify-between">

                        <!-- Home Team -->
                        <div class="flex flex-col items-center space-y-4 flex-1">
                            <img src="{{ $matchData['home_logo'] }}"
                                 alt="{{ $matchData['home_team'] }}"
                                 class="w-24 h-24 rounded-2xl shadow-lg">
                            <div class="text-center">
                                <div class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                                    {{ $matchData['home_team'] }}
                                </div>
                                <div class="text-gray-600 dark:text-gray-400 text-sm">Home</div>
                            </div>
                        </div>

                        <!-- Score -->
                        <div class="px-8 text-center">
                            <div class="text-8xl font-bold text-gray-900 dark:text-gray-100 leading-none">
                                {{ $matchData['home_goals'] }} - {{ $matchData['away_goals'] }}
                            </div>
                            @if($matchData['status'] === 'live')
                                <div class="text-red-600 dark:text-red-400 text-sm mt-2 font-bold animate-pulse">
                                    {{ $matchData['progress']['minute'] }}'
                                </div>
                            @endif
                        </div>

                        <!-- Away Team -->
                        <div class="flex flex-col items-center space-y-4 flex-1">
                            <img src="{{ $matchData['away_logo'] }}"
                                 alt="{{ $matchData['away_team'] }}"
                                 class="w-24 h-24 rounded-2xl shadow-lg">
                            <div class="text-center">
                                <div class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                                    {{ $matchData['away_team'] }}
                                </div>
                                <div class="text-gray-600 dark:text-gray-400 text-sm">Away</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Goal Events -->
                @if(count($matchData['events']) > 0)
                    <div class="border-t border-gray-200 dark:border-gray-700 p-8">
                        <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">Match Events</h3>
                        <div class="space-y-4">
                            @foreach($matchData['events'] as $event)
                                <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <div class="flex items-center space-x-4">
                                        <span class="text-3xl">{{ $event['icon'] }}</span>
                                        <div>
                                            <div class="text-gray-900 dark:text-gray-100 font-medium">{{ $event['player'] }}</div>
                                            <div class="text-gray-600 dark:text-gray-400 text-sm">
                                                {{ $event['team'] === 'home' ? $matchData['home_team'] : $matchData['away_team'] }}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="text-gray-900 dark:text-gray-100 font-bold text-lg">
                                        {{ $event['minute'] }}'
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    </div>
                @endif

                <!-- Match Info Footer -->
                <div class="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900/50">
                    <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        @if($matchData['status'] === 'scheduled')
                            <span>Kick-off: {{ $matchData['kickoff_time']?->format('M d, Y - H:i') }}</span>
                        @elseif($matchData['status'] === 'live')
                            <span>Started: {{ $matchData['started_at']?->format('H:i') }}</span>
                        @elseif($matchData['status'] === 'finished')
                            <span>Finished: {{ $matchData['finished_at']?->format('H:i') }}</span>
                        @endif
                        <span>Match ID: {{ $matchData['id'] }}</span>
                    </div>
                </div>

            </div>
        </div>
    </div>
    <x-footer />

</div>