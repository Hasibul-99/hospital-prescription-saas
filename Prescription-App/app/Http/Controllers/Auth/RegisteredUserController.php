<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function __construct(private readonly OtpService $otp)
    {
    }

    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request:
     * - If email exists and is verified  → reject (already registered).
     * - If email exists and is unverified → resend OTP (cooldown applies).
     * - Else create unverified user and send OTP.
     * Redirect to the verify-otp screen.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|lowercase|email|max:255',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $email = strtolower(trim($request->email));
        $existing = User::where('email', $email)->first();

        if ($existing && $existing->email_verified_at !== null) {
            throw ValidationException::withMessages([
                'email' => ['This email is already registered.'],
            ]);
        }

        // Issue OTP first and only persist the user once mail is queued.
        // If issueAndSend throws (cooldown / mail failure) the transaction
        // rolls back and no orphan user row is left behind.
        DB::transaction(function () use ($email, $existing, $request) {
            $this->otp->issueAndSend($email, OtpService::PURPOSE_REGISTRATION);

            if ($existing) {
                $existing->update([
                    'name'     => $request->name,
                    'password' => Hash::make($request->password),
                ]);
            } else {
                User::create([
                    'name'     => $request->name,
                    'email'    => $email,
                    'password' => Hash::make($request->password),
                ]);
            }
        });

        return redirect()->route('verification.otp', ['email' => $email]);
    }
}
