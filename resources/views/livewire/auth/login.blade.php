<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-th-navy via-th-blue to-th-red py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
        <!-- Logo and Header -->
        <div class="text-center">
            <div class="mx-auto h-16 w-16 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-lg overflow-hidden">
                <img src="{{ asset('images/goalguessers.png') }}" alt="GoalGuessers Logo" class="w-12 h-12 object-contain">
            </div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-white">
                Welcome back to GoalGuessers
            </h2>
            <p class="mt-2 text-center text-sm text-gray-200">
                Sign in to your virtual betting account
            </p>
        </div>

        <!-- Login Form -->
        <form wire:submit="login" class="mt-8 space-y-6">
            <div class="bg-white/10 dark:bg-gray-800/20 backdrop-blur-sm rounded-xl p-8 shadow-xl border border-white/20 dark:border-gray-600/30">
                <div class="space-y-6">
                    <!-- Email Field -->
                    <div>
                        <label for="email" class="block text-sm font-medium text-white">
                            Email Address
                        </label>
                        <div class="mt-1">
                            <input
                                wire:model="email"
                                id="email"
                                name="email"
                                type="email"
                                autocomplete="email"
                                required
                                class="appearance-none relative block w-full px-3 py-3 border border-white/30 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-th-red focus:border-th-red focus:z-10 sm:text-sm bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm"
                                placeholder="Enter your email"
                            >
                        </div>
                        @error('email')
                            <p class="mt-2 text-sm text-red-200 bg-red-500/20 rounded-md px-3 py-1">
                                {{ $message }}
                            </p>
                        @enderror
                    </div>

                    <!-- Password Field -->
                    <div>
                        <label for="password" class="block text-sm font-medium text-white">
                            Password
                        </label>
                        <div class="mt-1">
                            <input
                                wire:model="password"
                                id="password"
                                name="password"
                                type="password"
                                autocomplete="current-password"
                                required
                                class="appearance-none relative block w-full px-3 py-3 border border-white/30 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-th-red focus:border-th-red focus:z-10 sm:text-sm bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm"
                                placeholder="Enter your password"
                            >
                        </div>
                        @error('password')
                            <p class="mt-2 text-sm text-red-200 bg-red-500/20 rounded-md px-3 py-1">
                                {{ $message }}
                            </p>
                        @enderror
                    </div>

                    <!-- Remember Me -->
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <input
                                wire:model="remember"
                                id="remember"
                                name="remember"
                                type="checkbox"
                                class="h-4 w-4 text-th-red focus:ring-th-red border-white/30 dark:border-gray-600 rounded bg-white/90 dark:bg-gray-700/90"
                            >
                            <label for="remember" class="ml-2 block text-sm text-white">
                                Remember me
                            </label>
                        </div>

                        <div class="text-sm">
                            <a href="#" class="font-medium text-white hover:text-gray-200 transition-colors">
                                Forgot your password?
                            </a>
                        </div>
                    </div>

                    <!-- Submit Button -->
                    <div>
                        <button
                            type="submit"
                            class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-th-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-th-red transition-all duration-200 transform hover:scale-105 shadow-lg"
                            wire:loading.attr="disabled"
                        >
                            <span wire:loading.remove>Sign In</span>
                            <span wire:loading class="flex items-center">
                                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Signing in...
                            </span>
                        </button>
                    </div>

                    <!-- Register Link -->
                    <div class="text-center">
                        <p class="text-white">
                            Don't have an account?
                            <a href="/register" class="font-medium text-white hover:text-gray-200 underline transition-colors">
                                Create one now
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </form>

        <!-- Virtual Money Disclaimer -->
        <div class="text-center">
            <p class="text-xs text-gray-300 bg-black/20 rounded-lg px-4 py-2">
                🎮 Virtual football betting with fake money - No real gambling involved
            </p>
        </div>
    </div>
</div>