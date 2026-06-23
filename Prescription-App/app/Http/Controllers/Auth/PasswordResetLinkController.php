<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    public function __construct(private readonly OtpService $otp)
    {
    }

    public function create(): Response
    {
        return Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
        ]);
    }

    /**
     * Issue a password-reset OTP if the email exists.
     * Always returns generic success — no user enumeration.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate(['email' => 'required|email']);

        $email = strtolower(trim($request->email));
        $user = User::where('email', $email)->first();

        if ($user) {
            try {
                $this->otp->issueAndSend($email, OtpService::PURPOSE_PASSWORD_RESET);
            } catch (ValidationException $e) {
                // Swallow cooldown/cap errors to avoid leaking existence.
                // Server log records what happened.
            }
        }

        return redirect()->route('password.otp', ['email' => $email]);
    }
}
