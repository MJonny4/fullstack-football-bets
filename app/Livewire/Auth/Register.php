<?php

namespace App\Livewire\Auth;

use App\Models\User;
use Livewire\Component;
use Livewire\Attributes\Validate;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class Register extends Component
{
    #[Validate('required|string|max:255')]
    public string $name = '';

    #[Validate('required|email|unique:users,email')]
    public string $email = '';

    #[Validate('required|string|min:8|confirmed')]
    public string $password = '';

    #[Validate('required|string|min:8')]
    public string $password_confirmation = '';

    #[Validate('required|date|before:' . '-18 years')]
    public string $date_of_birth = '';

    #[Validate('boolean')]
    public bool $terms_accepted = false;

    public function register()
    {
        // Custom validation for terms acceptance
        if (!$this->terms_accepted) {
            $this->addError('terms_accepted', 'You must accept the terms and conditions to register.');
            return;
        }

        $this->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'date_of_birth' => 'required|date|before:' . Carbon::now()->subYears(18)->format('Y-m-d'),
        ]);

        $user = User::create([
            'name' => $this->name,
            'email' => $this->email,
            'password' => Hash::make($this->password),
            'date_of_birth' => $this->date_of_birth,
            'virtual_balance' => 1000.00, // Starting virtual money
            'country' => 'ES',
            'timezone' => 'Europe/Madrid',
        ]);

        Auth::login($user);

        session()->flash('message', '¡Welcome to GoalGuessers! You have been registered successfully with €1,000 virtual money.');

        return redirect('/');
    }

    public function render()
    {
        return view('livewire.auth.register')
            ->layout('components.layouts.app', ['title' => 'Register - GoalGuessers']);
    }
}
