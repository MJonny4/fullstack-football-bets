<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-th-navy via-th-blue to-th-red py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
        <!-- Logo and Header -->
        <div class="text-center">
            <div class="mx-auto h-16 w-16 flex items-center justify-center bg-white rounded-full shadow-lg overflow-hidden">
                <img src="{{ asset('images/goalguessers.png') }}" alt="GoalGuessers Logo" class="w-12 h-12 object-contain">
            </div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-white">
                Join GoalGuessers
            </h2>
            <p class="mt-2 text-center text-sm text-gray-200">
                Create your virtual betting account and get €1,000 to start
            </p>
        </div>

        <!-- Registration Form -->
        <form wire:submit="register" class="mt-8 space-y-6">
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-xl border border-white/20">
                <div class="space-y-6">
                    <!-- Name Field -->
                    <div>
                        <label for="name" class="block text-sm font-medium text-white">
                            Full Name
                        </label>
                        <div class="mt-1">
                            <input
                                wire:model="name"
                                id="name"
                                name="name"
                                type="text"
                                autocomplete="name"
                                required
                                class="appearance-none relative block w-full px-3 py-3 border border-white/30 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-th-red focus:border-th-red focus:z-10 sm:text-sm bg-white/90 backdrop-blur-sm"
                                placeholder="Enter your full name"
                            >
                        </div>
                        @error('name')
                            <p class="mt-2 text-sm text-red-200 bg-red-500/20 rounded-md px-3 py-1">
                                {{ $message }}
                            </p>
                        @enderror
                    </div>

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
                                class="appearance-none relative block w-full px-3 py-3 border border-white/30 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-th-red focus:border-th-red focus:z-10 sm:text-sm bg-white/90 backdrop-blur-sm"
                                placeholder="Enter your email"
                            >
                        </div>
                        @error('email')
                            <p class="mt-2 text-sm text-red-200 bg-red-500/20 rounded-md px-3 py-1">
                                {{ $message }}
                            </p>
                        @enderror
                    </div>

                    <!-- Date of Birth Field -->
                    <div>
                        <label for="date_of_birth" class="block text-sm font-medium text-white">
                            Date of Birth
                        </label>
                        <div class="mt-1">
                            <input
                                wire:model="date_of_birth"
                                id="date_of_birth"
                                name="date_of_birth"
                                type="date"
                                required
                                max="{{ now()->subYears(18)->format('Y-m-d') }}"
                                class="appearance-none relative block w-full px-3 py-3 border border-white/30 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-th-red focus:border-th-red focus:z-10 sm:text-sm bg-white/90 backdrop-blur-sm"
                            >
                        </div>
                        <p class="mt-1 text-xs text-gray-300">You must be at least 18 years old to register</p>
                        @error('date_of_birth')
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
                                autocomplete="new-password"
                                required
                                class="appearance-none relative block w-full px-3 py-3 border border-white/30 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-th-red focus:border-th-red focus:z-10 sm:text-sm bg-white/90 backdrop-blur-sm"
                                placeholder="Create a password (min. 8 characters)"
                            >
                        </div>
                        @error('password')
                            <p class="mt-2 text-sm text-red-200 bg-red-500/20 rounded-md px-3 py-1">
                                {{ $message }}
                            </p>
                        @enderror
                    </div>

                    <!-- Confirm Password Field -->
                    <div>
                        <label for="password_confirmation" class="block text-sm font-medium text-white">
                            Confirm Password
                        </label>
                        <div class="mt-1">
                            <input
                                wire:model="password_confirmation"
                                id="password_confirmation"
                                name="password_confirmation"
                                type="password"
                                autocomplete="new-password"
                                required
                                class="appearance-none relative block w-full px-3 py-3 border border-white/30 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-th-red focus:border-th-red focus:z-10 sm:text-sm bg-white/90 backdrop-blur-sm"
                                placeholder="Confirm your password"
                            >
                        </div>
                        @error('password_confirmation')
                            <p class="mt-2 text-sm text-red-200 bg-red-500/20 rounded-md px-3 py-1">
                                {{ $message }}
                            </p>
                        @enderror
                    </div>

                    <!-- Terms and Conditions -->
                    <div class="flex items-start">
                        <div class="flex items-center h-5">
                            <input
                                wire:model="terms_accepted"
                                id="terms_accepted"
                                name="terms_accepted"
                                type="checkbox"
                                required
                                class="h-4 w-4 text-th-red focus:ring-th-red border-white/30 rounded bg-white/90"
                            >
                        </div>
                        <div class="ml-3 text-sm">
                            <label for="terms_accepted" class="text-white">
                                I agree to the
                                <a href="#" class="font-medium text-white hover:text-gray-200 underline">
                                    Terms and Conditions
                                </a>
                                and confirm I am 18+ years old
                            </label>
                        </div>
                    </div>
                    @error('terms_accepted')
                        <p class="mt-2 text-sm text-red-200 bg-red-500/20 rounded-md px-3 py-1">
                            {{ $message }}
                        </p>
                    @enderror

                    <!-- Welcome Bonus Info -->
                    <div class="bg-green-500/20 border border-green-400/30 rounded-lg p-4">
                        <div class="flex items-center">
                            <div class="text-green-300 text-xl mr-3">🎁</div>
                            <div>
                                <p class="text-green-200 font-medium">Welcome Bonus</p>
                                <p class="text-green-300 text-sm">Get €1,000 virtual money to start betting!</p>
                            </div>
                        </div>
                    </div>

                    <!-- Submit Button -->
                    <div>
                        <button
                            type="submit"
                            class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-th-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-th-red transition-all duration-200 transform hover:scale-105 shadow-lg"
                            wire:loading.attr="disabled"
                        >
                            <span wire:loading.remove>Create Account</span>
                            <span wire:loading class="flex items-center">
                                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating account...
                            </span>
                        </button>
                    </div>

                    <!-- Login Link -->
                    <div class="text-center">
                        <p class="text-white">
                            Already have an account?
                            <a href="/login" class="font-medium text-white hover:text-gray-200 underline transition-colors">
                                Sign in here
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