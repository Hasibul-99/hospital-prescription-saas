<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class OtpVerificationController extends Controller
{
    public function __construct(private readonly OtpService $otp)
    {
    }

    /**
     * Show the 4-box OTP verify page for registration.
     */
    public function show(Request $request): Response|RedirectResponse
    {
        $email = strtolower(trim((string) $request->query('email', '')));

        if ($email === '') {
            return redirect()->route('register');
        }

        return Inertia::render('Auth/VerifyOtp', [
            'email'             => $email,
            'purpose'           => OtpService::PURPOSE_REGISTRATION,
            'cooldown_seconds'  => $this->otp->resendCooldownSeconds($email, OtpService::PURPOSE_REGISTRATION),
            'otp_length'        => OtpService::OTP_LENGTH,
        ]);
    }

    /**
     * Submit OTP for registration verification.
     * On success: mark email_verified_at, log the user in, redirect to dashboard.
     *
     * @throws ValidationException
     */
    public function verify(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|string|email',
            'code'  => 'required|string',
        ]);

        $email = strtolower(trim($request->email));

        $this->otp->verify($email, $request->code, OtpService::PURPOSE_REGISTRATION);

        $user = User::where('email', $email)->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'code' => ['Invalid or expired code.'],
            ]);
        }

        $user->forceFill(['email_verified_at' => now()])->save();

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Resend OTP (registration or password_reset).
     *
     * @throws ValidationException
     */
    public function resend(Request $request): RedirectResponse
    {
        $request->validate([
            'email'   => 'required|string|email',
            'purpose' => 'required|in:registration,password_reset',
        ]);

        $email = strtolower(trim($request->email));

        // For password_reset, only send if user exists — but never reveal that
        if ($request->purpose === OtpService::PURPOSE_PASSWORD_RESET) {
            $user = User::where('email', $email)->first();
            if ($user) {
                $this->otp->issueAndSend($email, OtpService::PURPOSE_PASSWORD_RESET);
            }
        } else {
            $this->otp->issueAndSend($email, OtpService::PURPOSE_REGISTRATION);
        }

        return back()->with('status', 'A new code has been sent.');
    }
}
