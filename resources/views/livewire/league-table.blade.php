<div class="min-h-screen bg-gray-50">
    <!-- Professional Navigation -->
    <x-navigation />

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Header Section -->
        <div class="mb-8">
            <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900 mb-2">League Table</h1>
                        <p class="text-gray-600">{{ $seasonName }}</p>
                    </div>

                    <!-- View Toggle Buttons -->
                    <div class="mt-4 lg:mt-0">
                        <div class="inline-flex rounded-lg bg-gray-100 p-1">
                            <button
                                wire:click="setView('full')"
                                class="px-4 py-2 text-sm font-medium rounded-md transition-colors {{ $selectedView === 'full' ? 'bg-white text-th-blue shadow-sm' : 'text-gray-600 hover:text-gray-900' }}"
                            >
                                Overall
                            </button>
                            <button
                                wire:click="setView('home')"
                                class="px-4 py-2 text-sm font-medium rounded-md transition-colors {{ $selectedView === 'home' ? 'bg-white text-th-blue shadow-sm' : 'text-gray-600 hover:text-gray-900' }}"
                            >
                                Home
                            </button>
                            <button
                                wire:click="setView('away')"
                                class="px-4 py-2 text-sm font-medium rounded-md transition-colors {{ $selectedView === 'away' ? 'bg-white text-th-blue shadow-sm' : 'text-gray-600 hover:text-gray-900' }}"
                            >
                                Away
                            </button>
                            <button
                                wire:click="setView('form')"
                                class="px-4 py-2 text-sm font-medium rounded-md transition-colors {{ $selectedView === 'form' ? 'bg-white text-th-blue shadow-sm' : 'text-gray-600 hover:text-gray-900' }}"
                            >
                                Form
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-4 gap-8">
            <!-- Main League Table -->
            <div class="xl:col-span-3">
                <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
                    <!-- Legend -->
                    <div class="bg-gradient-to-r from-th-blue to-th-red p-4">
                        <div class="flex flex-wrap gap-4 text-sm text-white">
                            <div class="flex items-center">
                                <div class="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
                                <span>Champions League (1-4)</span>
                            </div>
                            <div class="flex items-center">
                                <div class="w-3 h-3 bg-orange-400 rounded-full mr-2"></div>
                                <span>Europa League (5-6)</span>
                            </div>
                            <div class="flex items-center">
                                <div class="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                                <span>Relegation (18-20)</span>
                            </div>
                        </div>
                    </div>

                    <!-- Table -->
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr class="text-left">
                                    <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Pos</th>
                                    <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Team</th>
                                    <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">MP</th>
                                    <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">W</th>
                                    <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">D</th>
                                    <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">L</th>
                                    <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">GF</th>
                                    <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">GA</th>
                                    <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">GD</th>
                                    <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">Pts</th>
                                    <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">Form</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                @foreach($standings as $team)
                                    <tr class="hover:bg-gray-50 transition-colors">
                                        <!-- Position -->
                                        <td class="px-4 py-4">
                                            <div class="flex items-center">
                                                <div class="w-1 h-8 mr-3 rounded {{ $this->getPositionIndicatorClass($team->temp_position ?? $team->position) }}"></div>
                                                <span class="font-semibold text-gray-900">{{ $team->temp_position ?? $team->position }}</span>
                                            </div>
                                        </td>

                                        <!-- Team -->
                                        <td class="px-4 py-4">
                                            <div class="flex items-center">
                                                <img
                                                    src="{{ asset('images/teams/' . Str::slug($team->team->name) . '.png') }}"
                                                    alt="{{ $team->team->name }}"
                                                    class="w-8 h-8 rounded-full mr-3"
                                                    onerror="this.src='{{ asset('images/teams/default-team.png') }}'"
                                                >
                                                <div>
                                                    <div class="font-medium text-gray-900">{{ $team->team->name }}</div>
                                                    <div class="text-xs text-gray-500">{{ $team->team->short_name }}</div>
                                                </div>
                                            </div>
                                        </td>

                                        <!-- Stats -->
                                        <td class="px-4 py-4 text-center text-sm text-gray-900 font-medium">{{ $this->getPlayed($team) }}</td>
                                        <td class="px-4 py-4 text-center text-sm text-gray-900 font-medium">{{ $this->getWon($team) }}</td>
                                        <td class="px-4 py-4 text-center text-sm text-gray-900 font-medium">{{ $this->getDrawn($team) }}</td>
                                        <td class="px-4 py-4 text-center text-sm text-gray-900 font-medium">{{ $this->getLost($team) }}</td>
                                        <td class="px-4 py-4 text-center text-sm text-gray-900 font-medium">{{ $this->getGoalsFor($team) }}</td>
                                        <td class="px-4 py-4 text-center text-sm text-gray-900 font-medium">{{ $this->getGoalsAgainst($team) }}</td>
                                        <td class="px-4 py-4 text-center text-sm font-medium">
                                            <span class="{{ $this->getGoalDifferenceClass($this->getGoalDifference($team)) }}">
                                                {{ $this->getGoalDifference($team) > 0 ? '+' : '' }}{{ $this->getGoalDifference($team) }}
                                            </span>
                                        </td>
                                        <td class="px-4 py-4 text-center text-sm font-bold text-gray-900">{{ $this->getPoints($team) }}</td>
                                        <td class="px-4 py-4 text-center">
                                            <div class="flex justify-center space-x-1">
                                                {!! $this->getFormDisplay($team->form) !!}
                                            </div>
                                        </td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Sidebar -->
            <div class="space-y-6">
                <!-- Top Goal Scorers -->
                <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6">
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Top Goal Scorers</h3>
                    <div class="space-y-3">
                        @foreach($topScorers->take(5) as $team)
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <img
                                        src="{{ asset('images/teams/' . Str::slug($team->team->name) . '.png') }}"
                                        alt="{{ $team->team->name }}"
                                        class="w-6 h-6 rounded-full mr-2"
                                        onerror="this.src='{{ asset('images/teams/default-team.png') }}'"
                                    >
                                    <span class="text-sm font-medium text-gray-900">{{ $team->team->short_name }}</span>
                                </div>
                                <span class="text-sm font-bold text-th-blue">{{ $team->goals_for }}</span>
                            </div>
                        @endforeach
                    </div>
                </div>

                <!-- Season Progress -->
                @if($season)
                <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6">
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Season Progress</h3>
                    <div class="space-y-3">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Current Gameweek:</span>
                            <span class="font-medium text-gray-900">{{ $season->gameweeks()->where('active', true)->first()?->number ?? 1 }}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Total Gameweeks:</span>
                            <span class="font-medium text-gray-900">38</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-gradient-to-r from-th-red to-th-blue h-2 rounded-full" style="width: {{ (($season->gameweeks()->where('active', true)->first()?->number ?? 1) / 38) * 100 }}%"></div>
                        </div>
                        <div class="text-xs text-gray-500 text-center">
                            {{ round((($season->gameweeks()->where('active', true)->first()?->number ?? 1) / 38) * 100, 1) }}% Complete
                        </div>
                    </div>
                </div>
                @endif
            </div>
        </div>
    </div>
</div>
