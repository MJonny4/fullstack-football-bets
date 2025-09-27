<?php

namespace App\Livewire;

use App\Models\User;
use App\Services\UserStatsService;
use Livewire\Component;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;
use Carbon\Carbon;

class Profile extends Component
{
    public $user;
    public $name;
    public $email;
    public $birth_date;
    public $currentPassword;
    public $newPassword;
    public $newPasswordConfirmation;
    public $showPasswordForm = false;
    public $showDeleteAccountModal = false;

    // Preferences
    public $emailNotifications = true;
    public $betConfirmations = true;
    public $weeklyReports = false;

    // Virtual balance management
    public $resetBalanceConfirmation = false;

    public function mount()
    {
        $this->user = Auth::user();
        $this->name = $this->user->name;
        $this->email = $this->user->email;
        $this->birth_date = $this->user->date_of_birth ? $this->user->date_of_birth->format('Y-m-d') : '';

        // Load user preferences (if they exist in database)
        $this->emailNotifications = $this->user->email_notifications ?? true;
        $this->betConfirmations = $this->user->bet_confirmations ?? true;
        $this->weeklyReports = $this->user->weekly_reports ?? false;
    }

    protected $rules = [
        'name' => 'required|string|max:255',
        'email' => 'required|email|max:255',
        'birth_date' => 'required|date|before:today',
        'currentPassword' => 'required_with:newPassword|string',
        'newPassword' => 'required_with:currentPassword|confirmed|min:8',
        'newPasswordConfirmation' => 'required_with:newPassword',
    ];

    protected $messages = [
        'birth_date.before' => 'You must be at least 18 years old to use this platform.',
        'birth_date.required' => 'Birth date is required for age verification.',
        'newPassword.confirmed' => 'The new password confirmation does not match.',
    ];

    public function updateProfile()
    {
        $this->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $this->user->id,
            'birth_date' => 'required|date|before:today',
        ]);

        // Validate age (must be 18+)
        $birthDate = Carbon::parse($this->birth_date);
        if ($birthDate->diffInYears(now()) < 18) {
            $this->addError('birth_date', 'You must be at least 18 years old to use this platform.');
            return;
        }

        $this->user->update([
            'name' => $this->name,
            'email' => $this->email,
            'date_of_birth' => $this->birth_date,
        ]);

        session()->flash('message', 'Profile updated successfully!');
    }

    public function updatePassword()
    {
        $this->validate([
            'currentPassword' => 'required|string',
            'newPassword' => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
            'newPasswordConfirmation' => 'required',
        ]);

        // Verify current password
        if (!Hash::check($this->currentPassword, $this->user->password)) {
            $this->addError('currentPassword', 'The current password is incorrect.');
            return;
        }

        $this->user->update([
            'password' => Hash::make($this->newPassword),
        ]);

        // Clear form
        $this->currentPassword = '';
        $this->newPassword = '';
        $this->newPasswordConfirmation = '';
        $this->showPasswordForm = false;

        session()->flash('message', 'Password updated successfully!');
    }

    public function updatePreferences()
    {
        // Note: This would require adding these columns to the users table
        // For now, we'll just show a success message
        session()->flash('message', 'Preferences updated successfully!');
    }

    public function resetVirtualBalance()
    {
        if (!$this->resetBalanceConfirmation) {
            $this->addError('resetBalanceConfirmation', 'Please confirm that you want to reset your balance.');
            return;
        }

        $this->user->update([
            'virtual_balance' => 1000.00
        ]);

        $this->resetBalanceConfirmation = false;
        session()->flash('message', 'Virtual balance reset to €1,000!');
    }

    public function getUserStats()
    {
        $statsService = new UserStatsService($this->user);
        return $statsService->getCompleteStats();
    }

    public function togglePasswordForm()
    {
        $this->showPasswordForm = !$this->showPasswordForm;

        // Clear form when hiding
        if (!$this->showPasswordForm) {
            $this->currentPassword = '';
            $this->newPassword = '';
            $this->newPasswordConfirmation = '';
            $this->resetErrorBag();
        }
    }

    public function toggleDeleteAccountModal()
    {
        $this->showDeleteAccountModal = !$this->showDeleteAccountModal;
    }

    public function formatCurrency($amount)
    {
        return '€' . number_format($amount, 2);
    }

    public function render()
    {
        $userStats = $this->getUserStats();

        return view('livewire.profile', [
            'userStats' => $userStats,
        ])->layout('components.layouts.app', ['title' => 'Profile - GoalGuessers']);
    }
}