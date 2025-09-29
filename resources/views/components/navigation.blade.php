@php
    use App\Services\NavigationService;

    $currentRoute = request()->route()->getName() ?? 'home';
    $navState = NavigationService::getNavigationState($currentRoute);
    $nav = $navState['navigation'];
    $bettingStatus = $navState['betting_status'];
    $timeInfo = $navState['time_info'];
@endphp

<header class="relative z-50 shadow-md bg-gradient-to-b from-th-red to-th-blue">
    <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
            <!-- Logo -->
            <div class="flex items-center">
                <a href="{{ route('home') }}" class="flex items-center text-white font-bold text-xl hover:text-gray-200 transition-colors">
                    <img src="{{ asset('images/goalguessers.png') }}" alt="GoalGuessers Logo" class="w-16 h-16 object-contain">
                    <span class="hidden sm:block">GoalGuessers</span>
                </a>
            </div>

            <!-- Main Navigation (Centered) -->
            <div class="hidden lg:flex items-center space-x-1">
                @foreach($nav['public'] as $item)
                    @if(isset($item['dropdown']) && $item['dropdown'])
                        <!-- Dropdown Navigation Item -->
                        <div class="relative group">
                            <button class="text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center
                                {{ in_array($currentRoute, $item['active_routes']) ? 'bg-white/20' : 'hover:bg-white/20' }}">
                                <span class="mr-1">{{ $item['icon'] }}</span>
                                {{ $item['name'] }}
                                <svg class="ml-1 w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </button>

                            <!-- Dropdown Menu -->
                            <div class="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                <div class="py-1">
                                    @foreach($item['items'] as $subItem)
                                        @if($subItem === 'separator')
                                            <div class="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                                        @else
                                            @php
                                                $showItem = true;
                                                if (isset($subItem['auth_required']) && !auth()->check()) {
                                                    $showItem = false;
                                                }
                                                if (isset($subItem['show_when_live']) && !$timeInfo['is_match_time']) {
                                                    $showItem = false;
                                                }
                                            @endphp

                                            @if($showItem)
                                                <a href="{{ route($subItem['route']) }}"
                                                   class="group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors
                                                   {{ in_array($currentRoute, $subItem['active_routes']) ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : '' }}">
                                                    <span class="mr-3">{{ $subItem['icon'] }}</span>
                                                    {{ $subItem['name'] }}
                                                    @if(isset($subItem['show_when_live']) && $timeInfo['is_match_time'])
                                                        <span class="ml-auto">
                                                            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                                                                LIVE
                                                            </span>
                                                        </span>
                                                    @endif
                                                </a>
                                            @endif
                                        @endif
                                    @endforeach
                                </div>
                            </div>
                        </div>
                    @else
                        <!-- Regular Navigation Item -->
                        <a href="{{ route($item['route']) }}"
                           class="text-white px-4 py-2 rounded-md text-sm font-medium transition-colors
                           {{ in_array($currentRoute, $item['active_routes']) ? 'bg-white/20' : 'hover:bg-white/20' }}">
                            <span class="mr-1">{{ $item['icon'] }}</span>
                            {{ $item['name'] }}
                        </a>
                    @endif
                @endforeach
            </div>

            <!-- Right Side - User Menu / Auth -->
            <div class="flex items-center space-x-4">
                <!-- Theme Toggle -->
                <x-theme-toggle />

                @auth
                    <!-- User Balance (Desktop) -->
                    <div class="hidden lg:flex items-center text-white text-sm">
                        <span class="bg-white/20 px-3 py-1 rounded-full">
                            💰 €{{ number_format(auth()->user()->virtual_balance, 2) }}
                        </span>
                    </div>

                    <!-- User Dropdown -->
                    @foreach($nav['authenticated'] as $item)
                        @if(isset($item['user_dropdown']) && $item['user_dropdown'])
                            <div class="relative group">
                                <button class="flex items-center text-white px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-white/20
                                    {{ in_array($currentRoute, $item['active_routes']) ? 'bg-white/20' : '' }}">
                                    <span class="mr-1">{{ $item['icon'] }}</span>
                                    <span class="hidden sm:block mr-1">{{ auth()->user()->name }}</span>
                                    <svg class="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </button>

                                <!-- User Dropdown Menu -->
                                <div class="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                    <div class="py-1">
                                        <!-- User Info Header -->
                                        <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                                            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ auth()->user()->name }}</p>
                                            <p class="text-xs text-gray-500 dark:text-gray-400">Balance: €{{ number_format(auth()->user()->virtual_balance, 2) }}</p>
                                        </div>

                                        @foreach($item['items'] as $subItem)
                                            @if($subItem === 'separator')
                                                <div class="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                                            @else
                                                @if(isset($subItem['is_logout']) && $subItem['is_logout'])
                                                    <form method="POST" action="{{ route('logout') }}">
                                                        @csrf
                                                        <button type="submit" class="group flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                                                            <span class="mr-3">{{ $subItem['icon'] }}</span>
                                                            {{ $subItem['name'] }}
                                                        </button>
                                                    </form>
                                                @else
                                                    <a href="{{ route($subItem['route']) }}"
                                                       class="group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors
                                                       {{ in_array($currentRoute, $subItem['active_routes']) ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : '' }}">
                                                        <span class="mr-3">{{ $subItem['icon'] }}</span>
                                                        {{ $subItem['name'] }}
                                                    </a>
                                                @endif
                                            @endif
                                        @endforeach
                                    </div>
                                </div>
                            </div>
                        @endif
                    @endforeach
                @else
                    <!-- Login/Register for Guests -->
                    <div class="hidden sm:flex items-center space-x-2">
                        <a href="{{ route('login') }}" class="text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-white/20 transition-colors">
                            Sign In
                        </a>
                        <a href="{{ route('register') }}" class="bg-white text-th-blue px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors">
                            Get Started
                        </a>
                    </div>
                @endauth

                <!-- Mobile menu button -->
                <button
                    type="button"
                    class="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-white/20 transition-colors"
                    onclick="toggleMobileMenu()"
                >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                </button>
            </div>
        </div>
    </nav>

    <!-- Mobile menu (hidden by default) -->
    <div id="mobile-menu" class="lg:hidden hidden bg-gradient-to-b from-th-blue to-th-red border-t border-white/20">
        <div class="px-2 pt-2 pb-3 space-y-1">
            @foreach($nav['public'] as $item)
                @if(isset($item['dropdown']) && $item['dropdown'])
                    <!-- Mobile Dropdown Header -->
                    <div class="text-white px-3 py-2 text-sm font-medium">
                        <span class="mr-1">{{ $item['icon'] }}</span>
                        {{ $item['name'] }}
                    </div>
                    <!-- Mobile Dropdown Items -->
                    @foreach($item['items'] as $subItem)
                        @if($subItem !== 'separator')
                            @php
                                $showItem = true;
                                if (isset($subItem['auth_required']) && !auth()->check()) {
                                    $showItem = false;
                                }
                                if (isset($subItem['show_when_live']) && !$timeInfo['is_match_time']) {
                                    $showItem = false;
                                }
                            @endphp

                            @if($showItem)
                                <a href="{{ route($subItem['route']) }}"
                                   class="text-white/80 block px-6 py-2 text-sm font-medium hover:bg-white/20 hover:text-white transition-colors
                                   {{ in_array($currentRoute, $subItem['active_routes']) ? 'bg-white/20 text-white' : '' }}">
                                    <span class="mr-2">{{ $subItem['icon'] }}</span>
                                    {{ $subItem['name'] }}
                                    @if(isset($subItem['show_when_live']) && $timeInfo['is_match_time'])
                                        <span class="ml-2 text-xs bg-red-500 px-2 py-0.5 rounded">LIVE</span>
                                    @endif
                                </a>
                            @endif
                        @endif
                    @endforeach
                @else
                    <a href="{{ route($item['route']) }}"
                       class="text-white block px-3 py-2 text-sm font-medium hover:bg-white/20 transition-colors
                       {{ in_array($currentRoute, $item['active_routes']) ? 'bg-white/20' : '' }}">
                        <span class="mr-1">{{ $item['icon'] }}</span>
                        {{ $item['name'] }}
                    </a>
                @endif
            @endforeach

            @auth
                <!-- Mobile User Menu -->
                <div class="border-t border-white/20 mt-4 pt-4">
                    <div class="text-white px-3 py-2 text-sm">
                        <div class="font-medium">{{ auth()->user()->name }}</div>
                        <div class="text-xs text-white/70">€{{ number_format(auth()->user()->virtual_balance, 2) }}</div>
                    </div>
                    @foreach($nav['authenticated'] as $item)
                        @if(isset($item['user_dropdown']))
                            @foreach($item['items'] as $subItem)
                                @if($subItem !== 'separator')
                                    @if(isset($subItem['is_logout']) && $subItem['is_logout'])
                                        <form method="POST" action="{{ route('logout') }}">
                                            @csrf
                                            <button type="submit" class="text-white/80 block w-full text-left px-6 py-2 text-sm font-medium hover:bg-white/20 hover:text-white transition-colors">
                                                <span class="mr-2">{{ $subItem['icon'] }}</span>
                                                {{ $subItem['name'] }}
                                            </button>
                                        </form>
                                    @else
                                        <a href="{{ route($subItem['route']) }}"
                                           class="text-white/80 block px-6 py-2 text-sm font-medium hover:bg-white/20 hover:text-white transition-colors
                                           {{ in_array($currentRoute, $subItem['active_routes']) ? 'bg-white/20 text-white' : '' }}">
                                            <span class="mr-2">{{ $subItem['icon'] }}</span>
                                            {{ $subItem['name'] }}
                                        </a>
                                    @endif
                                @endif
                            @endforeach
                        @endif
                    @endforeach
                </div>
            @else
                <!-- Mobile Auth Links -->
                <div class="border-t border-white/20 mt-4 pt-4 space-y-1">
                    <a href="{{ route('login') }}" class="text-white block px-3 py-2 text-sm font-medium hover:bg-white/20 transition-colors">
                        Sign In
                    </a>
                    <a href="{{ route('register') }}" class="text-white block px-3 py-2 text-sm font-medium hover:bg-white/20 transition-colors">
                        Get Started - Free €1,000
                    </a>
                </div>
            @endauth
        </div>
    </div>

</header>
