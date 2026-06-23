<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class NewPasswordController extends Controller
{
    public function __construct(private readonly OtpService $otp)
    {
    }

    /**
     * Show the OTP + new password screen.
     */
    public function create(Request $request): Response|RedirectResponse
    {
        $email = strtolower(trim((string) $request->query('email', '')));

        if ($email === '') {
            return redirect()->route('password.request');
        }

        return Inertia::render('Auth/ResetPasswordOtp', [
            'email'            => $email,
            'cooldown_seconds' => $this->otp->resendCooldownSeconds($email, OtpService::PURPOSE_PASSWORD_RESET),
            'otp_length'       => OtpService::OTP_LENGTH,
        ]);
    }

    /**
     * Verify OTP and set new password.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'code'     => 'required|string',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $email = strtolower(trim($request->email));

        $this->otp->verify($email, $request->code, OtpService::PURPOSE_PASSWORD_RESET);

        $user = User::where('email', $email)->first();

        if (! $user) {
            // Generic message — don't leak existence
            throw ValidationException::withMessages([
                'code' => ['Invalid or expired code.'],
            ]);
        }

        $user->forceFill([
            'password'       => Hash::make($request->password),
            'remember_token' => Str::random(60),
        ])->save();

        event(new PasswordReset($user));

        return redirect()->route('login')->with('status', 'Password updated. Please log in.');
    }
}
