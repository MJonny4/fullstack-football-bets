<div @if($matchData['status'] === 'live') data-auto-refresh="5000" @endif>
    <x-navigation />


    <div class="min-h-screen bg-gradient-to-br from-th-blue via-th-navy to-th-red">
        <!-- Back Button -->
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <a href="{{ route('live-matches') }}"
               class="inline-flex items-center text-white/80 hover:text-white transition-colors">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Back to Live Matches
            </a>
        </div>

        <!-- Match Container -->
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div class="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 overflow-hidden">

                <!-- Match Status Header -->
                <div class="text-center py-8
                    {{ $matchData['status'] === 'live' ? 'bg-red-500/20 border-b border-red-500/30' : '' }}
                    {{ $matchData['status'] === 'finished' ? 'bg-green-500/20 border-b border-green-500/30' : '' }}
                    {{ $matchData['status'] === 'scheduled' ? 'bg-blue-500/20 border-b border-blue-500/30' : '' }}">

                    @if($matchData['status'] === 'live')
                        <div class="flex items-center justify-center mb-2">
                            <span class="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></span>
                            <span class="text-red-400 font-bold text-lg">LIVE</span>
                        </div>
                    @elseif($matchData['status'] === 'finished')
                        <div class="text-green-400 font-bold text-lg mb-2">FULL TIME</div>
                    @elseif($matchData['status'] === 'scheduled')
                        <div class="text-blue-400 font-bold text-lg mb-2">SCHEDULED</div>
                    @endif

                    <div class="text-white/80 text-sm">{{ $matchData['gameweek'] }}</div>
                    <div class="text-white font-bold text-xl">
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
                                <div class="text-2xl font-bold text-white mb-1">
                                    {{ $matchData['home_team'] }}
                                </div>
                                <div class="text-white/60 text-sm">Home</div>
                            </div>
                        </div>

                        <!-- Score -->
                        <div class="px-8 text-center">
                            <div class="text-8xl font-bold text-white leading-none">
                                {{ $matchData['home_goals'] }} - {{ $matchData['away_goals'] }}
                            </div>
                            @if($matchData['status'] === 'live')
                                <div class="text-white/60 text-sm mt-2">
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
                                <div class="text-2xl font-bold text-white mb-1">
                                    {{ $matchData['away_team'] }}
                                </div>
                                <div class="text-white/60 text-sm">Away</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Goal Events -->
                @if(count($matchData['events']) > 0)
                    <div class="border-t border-white/20 p-8">
                        <h3 class="text-xl font-bold text-white mb-6 text-center">Match Events</h3>
                        <div class="space-y-4">
                            @foreach($matchData['events'] as $event)
                                <div class="flex items-center justify-between bg-white/5 rounded-xl p-4">
                                    <div class="flex items-center space-x-4">
                                        <span class="text-3xl">{{ $event['icon'] }}</span>
                                        <div>
                                            <div class="text-white font-medium">{{ $event['player'] }}</div>
                                            <div class="text-white/60 text-sm">
                                                {{ $event['team'] === 'home' ? $matchData['home_team'] : $matchData['away_team'] }}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="text-white font-bold text-lg">
                                        {{ $event['minute'] }}'
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    </div>
                @endif

                <!-- Match Info Footer -->
                <div class="border-t border-white/20 p-6 bg-white/5">
                    <div class="flex justify-between text-sm text-white/60">
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

    
    @if($matchData['status'] === 'live')
    @endif
    <x-footer />

</div>