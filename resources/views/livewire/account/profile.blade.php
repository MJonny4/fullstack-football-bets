<div>
    <x-navigation />


    <!-- Page Header -->
    <div class="bg-gradient-to-br from-th-navy to-th-blue text-white py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold">My Profile</h1>
                    <p class="text-gray-300 mt-2">Manage your account settings and preferences</p>
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold text-th-red">{{ $this->formatCurrency($user->virtual_balance) }}</div>
                    <div class="text-sm text-gray-300">Current Balance</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Flash Messages -->
    @if (session()->has('message'))
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div class="bg-green-100 dark:bg-green-800 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-100 px-4 py-3 rounded-lg">
                {{ session('message') }}
            </div>
        </div>
    @endif

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

            <!-- Profile Settings -->
            <div class="lg:col-span-2 space-y-8">

                <!-- Personal Information -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                    <div class="p-6 border-b border-gray-200 dark:border-gray-600">
                        <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">Personal Information</h2>
                        <p class="text-gray-600 dark:text-gray-400">Update your basic account information</p>
                    </div>
                    <div class="p-6">
                        <form wire:submit.prevent="updateProfile" class="space-y-6">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        wire:model="name"
                                        class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-th-blue focus:border-transparent"
                                        placeholder="Enter your full name"
                                    >
                                    @error('name') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
                                </div>
                                <div>
                                    <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        wire:model="email"
                                        class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-th-blue focus:border-transparent"
                                        placeholder="Enter your email"
                                    >
                                    @error('email') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
                                </div>
                            </div>
                            <div>
                                <label for="birth_date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Date of Birth
                                </label>
                                <input
                                    type="date"
                                    id="birth_date"
                                    wire:model="birth_date"
                                    class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-th-blue focus:border-transparent"
                                >
                                @error('birth_date') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
                                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Must be 18+ to use this platform</p>
                            </div>
                            <div class="flex justify-end">
                                <button
                                    type="submit"
                                    class="bg-th-blue hover:bg-th-red text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                >
                                    Update Profile
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Password Security -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                    <div class="p-6 border-b border-gray-200 dark:border-gray-600">
                        <div class="flex items-center justify-between">
                            <div>
                                <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">Password & Security</h2>
                                <p class="text-gray-600 dark:text-gray-400">Keep your account secure</p>
                            </div>
                            <button
                                wire:click="togglePasswordForm"
                                class="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                {{ $showPasswordForm ? 'Cancel' : 'Change Password' }}
                            </button>
                        </div>
                    </div>
                    @if($showPasswordForm)
                        <div class="p-6">
                            <form wire:submit.prevent="updatePassword" class="space-y-6">
                                <div>
                                    <label for="currentPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        id="currentPassword"
                                        wire:model="currentPassword"
                                        class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-th-blue focus:border-transparent"
                                        placeholder="Enter current password"
                                    >
                                    @error('currentPassword') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label for="newPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            id="newPassword"
                                            wire:model="newPassword"
                                            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-th-blue focus:border-transparent"
                                            placeholder="Enter new password"
                                        >
                                        @error('newPassword') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
                                    </div>
                                    <div>
                                        <label for="newPasswordConfirmation" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            id="newPasswordConfirmation"
                                            wire:model="newPasswordConfirmation"
                                            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-th-blue focus:border-transparent"
                                            placeholder="Confirm new password"
                                        >
                                    </div>
                                </div>
                                <div class="flex justify-end space-x-4">
                                    <button
                                        type="button"
                                        wire:click="togglePasswordForm"
                                        class="bg-gray-200 hover:bg-gray-300 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        class="bg-th-blue hover:bg-th-red text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                    >
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    @else
                        <div class="p-6">
                            <div class="flex items-center space-x-3">
                                <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span class="text-gray-600 dark:text-gray-400">Password last changed: {{ $user->updated_at->format('M d, Y') }}</span>
                            </div>
                        </div>
                    @endif
                </div>

                <!-- Virtual Balance Management -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                    <div class="p-6 border-b border-gray-200 dark:border-gray-600">
                        <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">Virtual Balance Management</h2>
                        <p class="text-gray-600 dark:text-gray-400">Manage your virtual betting balance</p>
                    </div>
                    <div class="p-6">
                        <div class="bg-gradient-to-r from-th-red/10 to-th-blue/10 rounded-lg p-6 mb-6">
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="text-3xl font-bold text-th-navy">{{ $this->formatCurrency($user->virtual_balance) }}</div>
                                    <div class="text-sm text-gray-600 dark:text-gray-400">Current Virtual Balance</div>
                                </div>
                                <div class="text-4xl">💰</div>
                            </div>
                        </div>

                        <div class="border border-orange-200 bg-orange-50 rounded-lg p-4 mb-6">
                            <div class="flex items-start space-x-3">
                                <div class="text-orange-500 text-xl">⚠️</div>
                                <div>
                                    <h4 class="font-medium text-orange-800">Reset Virtual Balance</h4>
                                    <p class="text-sm text-orange-700 mt-1">
                                        This will reset your balance to €1,000 and cannot be undone. Use this if you want to start fresh.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center space-x-3 mb-4">
                            <input
                                type="checkbox"
                                id="resetBalanceConfirmation"
                                wire:model="resetBalanceConfirmation"
                                class="w-5 h-5 text-th-blue border-gray-300 dark:border-gray-600 rounded focus:ring-th-blue"
                            >
                            <label for="resetBalanceConfirmation" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                                I understand this will reset my balance to €1,000
                            </label>
                        </div>
                        @error('resetBalanceConfirmation') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror

                        <button
                            wire:click="resetVirtualBalance"
                            class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                            {{ !$resetBalanceConfirmation ? 'disabled' : '' }}
                        >
                            Reset to €1,000
                        </button>
                    </div>
                </div>

                <!-- Account Preferences -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                    <div class="p-6 border-b border-gray-200 dark:border-gray-600">
                        <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">Preferences</h2>
                        <p class="text-gray-600 dark:text-gray-400">Customize your experience</p>
                    </div>
                    <div class="p-6">
                        <form wire:submit.prevent="updatePreferences" class="space-y-6">
                            <div class="space-y-4">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <label class="font-medium text-gray-700 dark:text-gray-300">Email Notifications</label>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">Receive updates about your bets via email</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        wire:model="emailNotifications"
                                        class="w-5 h-5 text-th-blue border-gray-300 dark:border-gray-600 rounded focus:ring-th-blue"
                                    >
                                </div>
                                <div class="flex items-center justify-between">
                                    <div>
                                        <label class="font-medium text-gray-700 dark:text-gray-300">Bet Confirmations</label>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">Show confirmation modal before placing bets</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        wire:model="betConfirmations"
                                        class="w-5 h-5 text-th-blue border-gray-300 dark:border-gray-600 rounded focus:ring-th-blue"
                                    >
                                </div>
                                <div class="flex items-center justify-between">
                                    <div>
                                        <label class="font-medium text-gray-700 dark:text-gray-300">Weekly Reports</label>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">Receive weekly betting performance summaries</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        wire:model="weeklyReports"
                                        class="w-5 h-5 text-th-blue border-gray-300 dark:border-gray-600 rounded focus:ring-th-blue"
                                    >
                                </div>
                            </div>
                            <div class="flex justify-end">
                                <button
                                    type="submit"
                                    class="bg-th-blue hover:bg-th-red text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                >
                                    Save Preferences
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Sidebar Stats -->
            <div class="space-y-6">

                <!-- Account Overview -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Account Overview</h3>
                    <div class="space-y-4">
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Member Since</span>
                            <span class="font-semibold">{{ $user->created_at->format('M Y') }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Total Bets</span>
                            <span class="font-semibold">{{ $userStats['overview']['total_bets'] }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Win Rate</span>
                            <span class="font-semibold {{ $userStats['overview']['win_rate'] >= 50 ? 'text-green-600' : 'text-red-600' }}">
                                {{ $userStats['overview']['win_rate'] }}%
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Net Profit</span>
                            <span class="font-semibold {{ $userStats['overview']['net_profit'] >= 0 ? 'text-green-600' : 'text-red-600' }}">
                                {{ $userStats['overview']['net_profit'] >= 0 ? '+' : '' }}{{ $this->formatCurrency($userStats['overview']['net_profit']) }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Achievements -->
                @if(count($userStats['achievements']) > 0)
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Achievements</h3>
                        <div class="space-y-3">
                            @foreach($userStats['achievements'] as $achievement)
                                <div class="flex items-center space-x-3 p-3 bg-gradient-to-r from-th-red/10 to-th-blue/10 rounded-lg">
                                    <span class="text-2xl">{{ $achievement['icon'] }}</span>
                                    <div>
                                        <div class="font-medium text-gray-900 dark:text-gray-100">{{ $achievement['name'] }}</div>
                                        <div class="text-sm text-gray-600 dark:text-gray-400">{{ $achievement['description'] }}</div>
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    </div>
                @endif

                <!-- Quick Actions -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h3>
                    <div class="space-y-3">
                        <a href="{{ route('transaction-history') }}" class="block w-full text-center bg-th-blue hover:bg-th-red text-white py-3 rounded-lg font-medium transition-colors">
                            View Betting & Transactions
                        </a>
                        <a href="{{ route('dashboard') }}" class="block w-full text-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-medium transition-colors">
                            Go to Dashboard
                        </a>
                        <a href="{{ route('home') }}" class="block w-full text-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-medium transition-colors">
                            Start Betting
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <x-footer />

</div>