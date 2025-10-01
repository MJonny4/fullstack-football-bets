<div>
    <x-navigation />


    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Header Section -->
        <div class="mb-8">
            <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 p-6">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">League Table</h1>
                        <p class="text-gray-600 dark:text-gray-400">{{ $seasonName }}</p>
                    </div>

                    <!-- View Toggle Buttons -->
                    <div class="mt-4 lg:mt-0 flex items-center space-x-4">

                        <div class="inline-flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
                            <button
                                wire:click="setView('full')"
                                class="px-4 py-2 text-sm font-medium rounded-md transition-colors {{ $selectedView === 'full' ? 'bg-white dark:bg-gray-600 text-th-blue dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100' }}"
                            >
                                Overall
                            </button>
                            <button
                                wire:click="setView('home')"
                                class="px-4 py-2 text-sm font-medium rounded-md transition-colors {{ $selectedView === 'home' ? 'bg-white dark:bg-gray-600 text-th-blue dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100' }}"
                            >
                                Home
                            </button>
                            <button
                                wire:click="setView('away')"
                                class="px-4 py-2 text-sm font-medium rounded-md transition-colors {{ $selectedView === 'away' ? 'bg-white dark:bg-gray-600 text-th-blue dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100' }}"
                            >
                                Away
                            </button>
                            <button
                                wire:click="setView('form')"
                                class="px-4 py-2 text-sm font-medium rounded-md transition-colors {{ $selectedView === 'form' ? 'bg-white dark:bg-gray-600 text-th-blue dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100' }}"
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
                <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden">
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
                            <thead class="bg-gray-50 dark:bg-gray-700">
                                <tr class="text-left">
                                    <th class="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Pos</th>
                                    <th class="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Team</th>
                                    <th class="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-center">MP</th>
                                    <th class="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-center">W</th>
                                    <th class="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-center">D</th>
                                    <th class="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-center">L</th>
                                    <th class="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-center">GF</th>
                                    <th class="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-center">GA</th>
                                    <th class="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-center">GD</th>
                                    <th class="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-center">Pts</th>
                                    <th class="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-center">Form</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100 dark:divide-gray-600" id="league-table-body">
                                @foreach($standings as $index => $team)
                                    <tr
                                        class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 team-row"
                                        data-team-id="{{ $team->team_id }}"
                                        data-current-position="{{ $team->consistent_position }}"
                                        data-view-position="{{ $index + 1 }}"
                                    >
                                        <!-- Position -->
                                        <td class="px-4 py-4">
                                            <div class="flex items-center">
                                                <div class="w-1 h-8 mr-3 rounded {{ $this->getPositionIndicatorClass($team->consistent_position) }}"></div>
                                                <span class="font-semibold text-gray-900 dark:text-gray-100">{{ $team->consistent_position }}</span>
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
                                                    <div class="font-medium text-gray-900 dark:text-gray-100">{{ $team->team->name }}</div>
                                                    <div class="text-xs text-gray-500 dark:text-gray-400">{{ $team->team->short_name }}</div>
                                                </div>
                                            </div>
                                        </td>

                                        <!-- Stats -->
                                        <td class="px-4 py-4 text-center text-sm text-gray-900 dark:text-gray-100 font-medium">{{ $this->getPlayed($team) }}</td>
                                        <td class="px-4 py-4 text-center text-sm text-gray-900 dark:text-gray-100 font-medium">{{ $this->getWon($team) }}</td>
                                        <td class="px-4 py-4 text-center text-sm text-gray-900 dark:text-gray-100 font-medium">{{ $this->getDrawn($team) }}</td>
                                        <td class="px-4 py-4 text-center text-sm text-gray-900 dark:text-gray-100 font-medium">{{ $this->getLost($team) }}</td>
                                        <td class="px-4 py-4 text-center text-sm text-gray-900 dark:text-gray-100 font-medium">{{ $this->getGoalsFor($team) }}</td>
                                        <td class="px-4 py-4 text-center text-sm text-gray-900 dark:text-gray-100 font-medium">{{ $this->getGoalsAgainst($team) }}</td>
                                        <td class="px-4 py-4 text-center text-sm font-medium">
                                            <span class="{{ $this->getGoalDifferenceClass($this->getGoalDifference($team)) }}">
                                                {{ $this->getGoalDifference($team) > 0 ? '+' : '' }}{{ $this->getGoalDifference($team) }}
                                            </span>
                                        </td>
                                        <td class="px-4 py-4 text-center text-sm font-bold text-gray-900 dark:text-gray-100">{{ $this->getPoints($team) }}</td>
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
                <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 p-6">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Top Goal Scorers</h3>
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
                                    <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ $team->team->short_name }}</span>
                                </div>
                                <span class="text-sm font-bold text-th-blue dark:text-th-blue">{{ $team->goals_for }}</span>
                            </div>
                        @endforeach
                    </div>
                </div>

                <!-- Season Progress -->
                @if($season)
                <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 p-6">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Season Progress</h3>
                    <div class="space-y-3">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600 dark:text-gray-400">Current Gameweek:</span>
                            <span class="font-medium text-gray-900 dark:text-gray-100">{{ $seasonProgress['current_gameweek'] }}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600 dark:text-gray-400">Total Gameweeks:</span>
                            <span class="font-medium text-gray-900 dark:text-gray-100">{{ $seasonProgress['total_gameweeks'] }}</span>
                        </div>
                        <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div class="bg-gradient-to-r from-th-red to-th-blue h-2 rounded-full transition-all duration-500" style="width: {{ $seasonProgress['progress_percentage'] }}%"></div>
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 text-center">
                            {{ $seasonProgress['progress_percentage'] }}% Complete
                        </div>
                    </div>
                </div>
                @endif
            </div>
        </div>
    </div>
    <x-footer />
</div>
