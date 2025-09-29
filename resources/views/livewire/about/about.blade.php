<div>
    <x-navigation />


    <!-- Hero Section -->
    <div class="bg-gradient-to-br from-th-navy via-th-blue to-th-red py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div class="mb-8">
                <img src="{{ asset('images/goalguessers.png') }}" alt="GoalGuessers Logo" class="w-20 h-20 mx-auto mb-4">
            </div>
            <h1 class="text-4xl md:text-6xl font-bold text-white mb-6">
                About GoalGuessers
            </h1>
            <p class="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto">
                The premier virtual football betting platform that brings the excitement of the beautiful game to your fingertips
            </p>
            <div class="mt-8 text-lg text-gray-300">
                <span class="bg-white/10 px-4 py-2 rounded-full">
                    🎮 Virtual Currency Only - No Real Money Involved
                </span>
            </div>
        </div>
    </div>

    <!-- Platform Statistics -->
    <div class="py-16 bg-white dark:bg-gray-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 class="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12">Platform Statistics</h2>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                <div class="text-center">
                    <div class="text-3xl md:text-4xl font-bold text-th-blue mb-2">{{ $stats['total_teams'] }}</div>
                    <div class="text-gray-600 dark:text-gray-400">Fantasy Teams</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl md:text-4xl font-bold text-th-red mb-2">{{ $stats['total_matches'] }}</div>
                    <div class="text-gray-600 dark:text-gray-400">Total Matches</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl md:text-4xl font-bold text-th-blue mb-2">{{ $stats['total_users'] }}</div>
                    <div class="text-gray-600 dark:text-gray-400">Registered Users</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl md:text-4xl font-bold text-th-red mb-2">{{ number_format($stats['total_bets']) }}</div>
                    <div class="text-gray-600 dark:text-gray-400">Bets Placed</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl md:text-4xl font-bold text-th-blue mb-2">€{{ number_format($stats['total_virtual_balance'], 0) }}</div>
                    <div class="text-gray-600 dark:text-gray-400">Virtual Balance</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl md:text-4xl font-bold text-th-red mb-2">{{ $stats['current_season']?->name ?? 'Active' }}</div>
                    <div class="text-gray-600 dark:text-gray-400">Current Season</div>
                </div>
            </div>
        </div>
    </div>

    <!-- What is GoalGuessers -->
    <div class="py-16 bg-gray-50 dark:bg-gray-900">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-12">
                <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">What is GoalGuessers?</h2>
                <p class="text-lg text-gray-600 dark:text-gray-400">
                    A professional virtual football betting platform that simulates a complete football league experience
                </p>
            </div>

            <div class="grid md:grid-cols-2 gap-8">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                    <div class="text-2xl mb-4">⚽</div>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Complete Football League</h3>
                    <p class="text-gray-600 dark:text-gray-400">
                        Experience a full football season with {{ $stats['total_teams'] }} fantasy teams, 38 gameweeks, and {{ $stats['total_matches'] }} matches scheduled with realistic Spanish timezone integration.
                    </p>
                </div>

                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                    <div class="text-2xl mb-4">💰</div>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Virtual Betting System</h3>
                    <p class="text-gray-600 dark:text-gray-400">
                        Start with €1,000 virtual currency and place bets on match outcomes with dynamic odds, real-time calculations, and professional bet confirmation modals.
                    </p>
                </div>

                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                    <div class="text-2xl mb-4">🔴</div>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Live Match Simulations</h3>
                    <p class="text-gray-600 dark:text-gray-400">
                        Watch matches unfold in real-time with our 5-minute simulation engine that maps to 90 minutes of match time, complete with realistic goal probability algorithms.
                    </p>
                </div>

                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                    <div class="text-2xl mb-4">🏆</div>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">League Management</h3>
                    <p class="text-gray-600 dark:text-gray-400">
                        Follow real-time league standings with position tracking, form analysis, goal differences, and color-coded qualification zones just like the real thing.
                    </p>
                </div>
            </div>
        </div>
    </div>

    <!-- Key Features -->
    <div class="py-16 bg-white dark:bg-gray-800">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 class="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12">Key Features</h2>

            <div class="space-y-8">
                <div class="flex flex-col md:flex-row items-start gap-6">
                    <div class="w-full md:w-1/3">
                        <h3 class="text-xl font-semibold text-th-blue mb-3">🎮 Professional Authentication</h3>
                    </div>
                    <div class="w-full md:w-2/3">
                        <p class="text-gray-600 dark:text-gray-400">
                            Secure registration with age verification (18+ required), professional login system, and comprehensive virtual balance management with €1,000 starting funds.
                        </p>
                    </div>
                </div>

                <div class="flex flex-col md:flex-row items-start gap-6">
                    <div class="w-full md:w-1/3">
                        <h3 class="text-xl font-semibold text-th-red mb-3">💸 Advanced Betting System</h3>
                    </div>
                    <div class="w-full md:w-2/3">
                        <p class="text-gray-600 dark:text-gray-400">
                            Custom bet amounts from €5 to €1,000, professional confirmation modals with real-time calculations, dynamic odds based on team strength, and comprehensive bet tracking with detailed history.
                        </p>
                    </div>
                </div>

                <div class="flex flex-col md:flex-row items-start gap-6">
                    <div class="w-full md:w-1/3">
                        <h3 class="text-xl font-semibold text-th-blue mb-3">📊 Real-time Analytics</h3>
                    </div>
                    <div class="w-full md:w-2/3">
                        <p class="text-gray-600 dark:text-gray-400">
                            Personal dashboards with betting statistics, win rate calculations, profit/loss tracking, recent activity insights, and global leaderboards with achievement systems.
                        </p>
                    </div>
                </div>

                <div class="flex flex-col md:flex-row items-start gap-6">
                    <div class="w-full md:w-1/3">
                        <h3 class="text-xl font-semibold text-th-red mb-3">🎨 Professional UI/UX</h3>
                    </div>
                    <div class="w-full md:w-2/3">
                        <p class="text-gray-600 dark:text-gray-400">
                            Tommy Hilfiger color scheme for premium feel, fully responsive design optimized for all devices, complete dark mode support, professional animations, and intuitive navigation with context awareness.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Technology Stack -->
    <div class="py-16 bg-gray-50 dark:bg-gray-900">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 class="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12">Technology Stack</h2>

            <div class="grid md:grid-cols-2 gap-8">
                <div>
                    <h3 class="text-xl font-semibold text-th-blue mb-4">Backend Technologies</h3>
                    <ul class="space-y-3">
                        <li class="flex items-center">
                            <span class="w-2 h-2 bg-th-red rounded-full mr-3"></span>
                            <span class="text-gray-600 dark:text-gray-400">Laravel 12.30.1 - PHP Framework</span>
                        </li>
                        <li class="flex items-center">
                            <span class="w-2 h-2 bg-th-red rounded-full mr-3"></span>
                            <span class="text-gray-600 dark:text-gray-400">Livewire 3.x - Full-stack Framework</span>
                        </li>
                        <li class="flex items-center">
                            <span class="w-2 h-2 bg-th-red rounded-full mr-3"></span>
                            <span class="text-gray-600 dark:text-gray-400">MySQL - Database Management</span>
                        </li>
                        <li class="flex items-center">
                            <span class="w-2 h-2 bg-th-red rounded-full mr-3"></span>
                            <span class="text-gray-600 dark:text-gray-400">PHP 8.2+ - Server Language</span>
                        </li>
                    </ul>
                </div>

                <div>
                    <h3 class="text-xl font-semibold text-th-blue mb-4">Frontend Technologies</h3>
                    <ul class="space-y-3">
                        <li class="flex items-center">
                            <span class="w-2 h-2 bg-th-red rounded-full mr-3"></span>
                            <span class="text-gray-600 dark:text-gray-400">TailwindCSS - Utility-first Styling</span>
                        </li>
                        <li class="flex items-center">
                            <span class="w-2 h-2 bg-th-red rounded-full mr-3"></span>
                            <span class="text-gray-600 dark:text-gray-400">Alpine.js - JavaScript Reactivity</span>
                        </li>
                        <li class="flex items-center">
                            <span class="w-2 h-2 bg-th-red rounded-full mr-3"></span>
                            <span class="text-gray-600 dark:text-gray-400">Blade Templates - Server-side Templating</span>
                        </li>
                        <li class="flex items-center">
                            <span class="w-2 h-2 bg-th-red rounded-full mr-3"></span>
                            <span class="text-gray-600 dark:text-gray-400">Vite - Asset Bundling</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <!-- Safety & Responsibility -->
    <div class="py-16 bg-white dark:bg-gray-800">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Safety & Responsibility</h2>

            <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-8 mb-8">
                <div class="text-4xl mb-4">🛡️</div>
                <h3 class="text-xl font-semibold text-green-800 dark:text-green-400 mb-4">Virtual Currency Only</h3>
                <p class="text-green-700 dark:text-green-300 text-lg">
                    GoalGuessers uses exclusively virtual currency. No real money is involved, exchanged, or at risk. This platform is designed for entertainment and educational purposes only.
                </p>
            </div>

            <div class="grid md:grid-cols-3 gap-6">
                <div class="text-center">
                    <div class="text-2xl mb-3">🔞</div>
                    <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">Age Verification</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Must be 18+ to register</p>
                </div>
                <div class="text-center">
                    <div class="text-2xl mb-3">🎮</div>
                    <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">Educational Purpose</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Learn about odds & probability</p>
                </div>
                <div class="text-center">
                    <div class="text-2xl mb-3">🔒</div>
                    <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">Secure Platform</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">No financial data collection</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer CTA -->
    <div class="py-16 bg-gradient-to-r from-th-blue to-th-red">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 class="text-3xl font-bold text-white mb-4">Ready to Start Your Journey?</h2>
            <p class="text-xl text-gray-200 mb-8">
                Join thousands of users experiencing the thrill of virtual football betting
            </p>
            @guest
                <div class="space-x-4">
                    <a href="{{ route('register') }}"
                       class="bg-white text-th-blue px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block">
                        Get Started - Free €1,000
                    </a>
                    <a href="{{ route('login') }}"
                       class="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-th-blue transition-colors inline-block">
                        Sign In
                    </a>
                </div>
            @else
                <a href="{{ route('home') }}"
                   class="bg-white text-th-blue px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block">
                    Back to Betting
                </a>
            @endguest
        </div>
    </div>
    <x-footer />

</div>