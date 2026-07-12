<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class OtpVerificationController extends Controller
{
    public function __construct(private readonly OtpService $otp)
    {
    }

    /**
     * Resend a password-reset OTP. Registration is disabled, so this only
     * serves the forgot-password flow.
     *
     * @throws ValidationException
     */
    public function resend(Request $request): RedirectResponse
    {
        $request->validate([
            'email'   => 'required|string|email',
            'purpose' => 'required|in:password_reset',
        ]);

        $email = strtolower(trim($request->email));

        // Only send if the user exists — but never reveal that (enumeration-safe).
        $user = User::where('email', $email)->first();
        if ($user) {
            $this->otp->issueAndSend($email, OtpService::PURPOSE_PASSWORD_RESET);
        }

        return back()->with('status', 'A new code has been sent.');
    }
}
