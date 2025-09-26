@php
    use App\Services\NavigationService;

    $currentRoute = request()->route()->getName() ?? 'home';
    $navState = NavigationService::getNavigationState($currentRoute);
    $nav = $navState['navigation'];
    $bettingStatus = $navState['betting_status'];
@endphp

<nav class="shadow-lg bg-gradient-to-br from-th-red to-th-blue">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
            <!-- Logo -->
            <div class="flex items-center">
                <a href="{{ route('home') }}" class="flex items-center text-white font-bold text-xl hover:text-gray-200 transition-colors">
                    <img src="{{ asset('images/goalguessers.png') }}" alt="GoalGuessers Logo" class="w-8 h-8 mr-2 object-contain">
                    GoalGuessers
                </a>
            </div>

            <!-- Desktop Navigation Links -->
            <div class="hidden lg:block">
                <div class="ml-10 flex items-baseline space-x-4">
                    {{-- Public Navigation --}}
                    @foreach($nav['public'] as $item)
                        <a
                            href="{{ $item['placeholder'] ?? false ? '#' : route($item['route']) }}"
                            class="text-white px-3 py-2 rounded-md text-sm font-medium transition-colors
                                {{ in_array($currentRoute, $item['active_routes']) ? 'bg-white/20 hover:bg-white/30' : 'hover:bg-white/20' }}
                                {{ $item['placeholder'] ?? false ? 'opacity-75 cursor-not-allowed' : '' }}"
                            {{ $item['placeholder'] ?? false ? 'onclick="event.preventDefault(); showComingSoon()"' : '' }}
                        >
                            <span class="mr-1">{{ $item['icon'] }}</span>
                            {{ $item['name'] }}
                        </a>
                    @endforeach

                    {{-- Authenticated Navigation --}}
                    @auth
                        @foreach($nav['authenticated'] as $item)
                            <a
                                href="{{ $item['placeholder'] ?? false ? '#' : route($item['route']) }}"
                                class="text-white px-3 py-2 rounded-md text-sm font-medium transition-colors relative
                                    {{ in_array($currentRoute, $item['active_routes']) ? 'bg-white/20 hover:bg-white/30' : 'hover:bg-white/20' }}
                                    {{ $item['placeholder'] ?? false ? 'opacity-75' : '' }}
                                    {{ $item['highlight'] ?? false ? 'bg-green-500/20 hover:bg-green-500/30 border border-green-400/30' : '' }}"
                                {{ $item['placeholder'] ?? false ? 'onclick="event.preventDefault(); showComingSoon()"' : '' }}
                            >
                                <span class="mr-1">{{ $item['icon'] }}</span>
                                {{ $item['name'] }}
                                @if($item['highlight'] ?? false)
                                    <span class="absolute -top-1 -right-1 bg-green-400 text-xs text-white px-1 rounded-full animate-pulse">
                                        ●
                                    </span>
                                @endif
                            </a>
                        @endforeach
                    @endauth

                    {{-- Conditional Navigation --}}
                    @foreach($nav['conditional'] as $item)
                        <a
                            href="{{ $item['placeholder'] ?? false ? '#' : route($item['route']) }}"
                            class="text-white px-3 py-2 rounded-md text-sm font-medium transition-colors relative
                                {{ in_array($currentRoute, $item['active_routes']) ? 'bg-white/20 hover:bg-white/30' : 'hover:bg-white/20' }}
                                {{ $item['placeholder'] ?? false ? 'opacity-75' : '' }}
                                {{ isset($item['badge']) ? 'pr-8' : '' }}"
                            {{ $item['placeholder'] ?? false ? 'onclick="event.preventDefault(); showComingSoon()"' : '' }}
                        >
                            <span class="mr-1">{{ $item['icon'] }}</span>
                            {{ $item['name'] }}
                            @if(isset($item['badge']))
                                <span class="absolute -top-1 -right-1 {{ $item['badge_class'] ?? 'bg-red-500 text-white' }} text-xs px-1 rounded-full text-[10px] font-bold">
                                    {{ $item['badge'] }}
                                </span>
                            @endif
                            @if($item['coming_soon'] ?? false)
                                <span class="absolute -top-1 -right-1 bg-yellow-400 text-black text-[8px] px-1 rounded-full font-bold">
                                    SOON
                                </span>
                            @endif
                        </a>
                    @endforeach
                </div>
            </div>

            <!-- Mobile menu button -->
            <div class="lg:hidden">
                <button
                    type="button"
                    class="text-white hover:text-gray-200 focus:outline-none focus:text-gray-200"
                    onclick="toggleMobileMenu()"
                    id="mobile-menu-button"
                >
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                </button>
            </div>

            <!-- User Info / Auth Buttons -->
            <div class="hidden lg:flex items-center space-x-4">
                @auth
                    <!-- Betting Status Indicator -->
                    @if($bettingStatus['is_open'])
                        <div class="bg-green-500/20 backdrop-blur-sm rounded-lg px-3 py-1 border border-green-400/30">
                            <div class="flex items-center text-white text-xs">
                                <span class="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                                <span class="font-medium">Betting Open</span>
                            </div>
                            <div class="text-green-200 text-[10px]">
                                {{ $bettingStatus['message'] }}
                            </div>
                        </div>
                    @else
                        <div class="bg-red-500/20 backdrop-blur-sm rounded-lg px-3 py-1 border border-red-400/30">
                            <div class="flex items-center text-white text-xs">
                                <span class="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                                <span class="font-medium">Betting Closed</span>
                            </div>
                        </div>
                    @endif

                    <!-- Virtual Balance -->
                    <div class="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                        <span class="text-white text-sm font-medium">Balance:</span>
                        <span class="text-white font-bold text-lg">€{{ number_format(auth()->user()->virtual_balance ?? 0, 2) }}</span>
                    </div>

                    <!-- User Menu -->
                    <div class="flex items-center space-x-2">
                        <span class="text-white text-sm">{{ auth()->user()->name }}</span>
                        <form action="{{ route('logout') }}" method="POST" class="inline">
                            @csrf
                            <button type="submit" class="bg-white text-th-red hover:bg-gray-100 px-4 py-2 rounded-lg font-medium transition-colors">
                                Logout
                            </button>
                        </form>
                    </div>
                @else
                    <a href="{{ route('login') }}" class="bg-white text-th-red hover:bg-gray-100 px-4 py-2 rounded-lg font-medium transition-colors">
                        Login
                    </a>
                    <a href="{{ route('register') }}" class="bg-th-red text-white hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition-colors">
                        Register
                    </a>
                @endauth
            </div>
        </div>

        <!-- Mobile Navigation Menu (hidden by default) -->
        <div class="lg:hidden hidden" id="mobile-menu">
            <div class="px-2 pt-2 pb-3 space-y-1 bg-black/20 backdrop-blur-sm rounded-lg mt-2">
                {{-- Mobile Public Navigation --}}
                @foreach($nav['public'] as $item)
                    <a
                        href="{{ $item['placeholder'] ?? false ? '#' : route($item['route']) }}"
                        class="text-white block px-3 py-2 rounded-md text-base font-medium
                            {{ in_array($currentRoute, $item['active_routes']) ? 'bg-white/20' : 'hover:bg-white/20' }}
                            {{ $item['placeholder'] ?? false ? 'opacity-75' : '' }}"
                        {{ $item['placeholder'] ?? false ? 'onclick="event.preventDefault(); showComingSoon()"' : '' }}
                    >
                        <span class="mr-2">{{ $item['icon'] }}</span>
                        {{ $item['name'] }}
                    </a>
                @endforeach

                {{-- Mobile Authenticated Navigation --}}
                @auth
                    <div class="border-t border-white/10 my-2 pt-2">
                        @foreach($nav['authenticated'] as $item)
                            <a
                                href="{{ $item['placeholder'] ?? false ? '#' : route($item['route']) }}"
                                class="text-white block px-3 py-2 rounded-md text-base font-medium
                                    {{ in_array($currentRoute, $item['active_routes']) ? 'bg-white/20' : 'hover:bg-white/20' }}
                                    {{ $item['placeholder'] ?? false ? 'opacity-75' : '' }}"
                                {{ $item['placeholder'] ?? false ? 'onclick="event.preventDefault(); showComingSoon()"' : '' }}
                            >
                                <span class="mr-2">{{ $item['icon'] }}</span>
                                {{ $item['name'] }}
                                @if($item['highlight'] ?? false)
                                    <span class="ml-2 bg-green-400 text-xs text-black px-1 rounded">NEW</span>
                                @endif
                            </a>
                        @endforeach
                    </div>
                @endauth

                {{-- Mobile User Info --}}
                @auth
                    <div class="border-t border-white/10 mt-2 pt-2">
                        <div class="px-3 py-2 text-white text-sm">
                            <div>{{ auth()->user()->name }}</div>
                            <div class="text-green-200">€{{ number_format(auth()->user()->virtual_balance ?? 0, 2) }}</div>
                        </div>
                        <form action="{{ route('logout') }}" method="POST" class="px-3">
                            @csrf
                            <button type="submit" class="w-full bg-white text-th-red hover:bg-gray-100 px-4 py-2 rounded-lg font-medium transition-colors">
                                Logout
                            </button>
                        </form>
                    </div>
                @else
                    <div class="border-t border-white/10 mt-2 pt-2 space-y-2 px-3">
                        <a href="{{ route('login') }}" class="block w-full text-center bg-white text-th-red hover:bg-gray-100 px-4 py-2 rounded-lg font-medium transition-colors">
                            Login
                        </a>
                        <a href="{{ route('register') }}" class="block w-full text-center bg-th-red text-white hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition-colors">
                            Register
                        </a>
                    </div>
                @endauth
            </div>
        </div>
    </div>
</nav>

<script>
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden');
}

function showComingSoon() {
    alert('🚧 This feature is coming soon!\n\nWe\'re working hard to bring you the best betting experience. Stay tuned!');
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
    const menu = document.getElementById('mobile-menu');
    const button = document.getElementById('mobile-menu-button');

    if (!menu.contains(event.target) && !button.contains(event.target)) {
        menu.classList.add('hidden');
    }
});
</script>