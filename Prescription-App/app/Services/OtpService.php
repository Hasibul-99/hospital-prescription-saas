<?php

namespace App\Services;

use App\Mail\OtpMail;
use App\Models\OtpVerification;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Throwable;

class OtpService
{
    public const OTP_LENGTH        = 4;
    public const EXPIRY_MINUTES    = 10;
    public const MAX_ATTEMPTS      = 5;
    public const RESEND_COOLDOWN_S = 60;
    public const HOURLY_SEND_CAP   = 5;

    public const PURPOSE_REGISTRATION   = 'registration';
    public const PURPOSE_PASSWORD_RESET = 'password_reset';

    /**
     * Issue a new OTP for the given email + purpose.
     * Invalidates any prior active code (one active code per email+purpose).
     * Enforces 60s resend cooldown and hourly send cap.
     * Returns the raw code (caller should email it then discard).
     *
     * @throws ValidationException
     */
    public function issue(string $email, string $purpose): string
    {
        $email = strtolower(trim($email));

        $existing = OtpVerification::where('email', $email)
            ->where('purpose', $purpose)
            ->latest('id')
            ->first();

        if ($existing && $existing->last_sent_at) {
            $secondsSinceLast = (int) $existing->last_sent_at->diffInSeconds(now());
            if ($secondsSinceLast < self::RESEND_COOLDOWN_S) {
                $wait = self::RESEND_COOLDOWN_S - $secondsSinceLast;
                throw ValidationException::withMessages([
                    'email' => ["Please wait {$wait} seconds before requesting a new code."],
                ]);
            }
        }

        // Hourly send cap. Counted in the cache over a fixed 1-hour window
        // rather than from otp_verifications rows: codes expire in minutes and
        // the single-active-code delete below wipes history, so a row count can
        // never span the hour. The cache counter is decoupled from code state.
        $sendKey = $this->sendCountKey($email, $purpose);

        if ((int) Cache::get($sendKey, 0) >= self::HOURLY_SEND_CAP) {
            throw ValidationException::withMessages([
                'email' => ['Too many requests. Try again later.'],
            ]);
        }

        $code = $this->generateCode();

        DB::transaction(function () use ($email, $purpose, $code) {
            OtpVerification::where('email', $email)
                ->where('purpose', $purpose)
                ->delete();

            OtpVerification::create([
                'email'        => $email,
                'code'         => Hash::make($code),
                'purpose'      => $purpose,
                'expires_at'   => now()->addMinutes(self::EXPIRY_MINUTES),
                'attempts'     => 0,
                'last_sent_at' => now(),
            ]);
        });

        // Fixed window: seed the key with a 1-hour TTL only when absent, then
        // increment (increment preserves the existing TTL across cache stores).
        Cache::add($sendKey, 0, now()->addHour());
        Cache::increment($sendKey);

        return $code;
    }

    /**
     * Issue and send the OTP via queued mail.
     * If mail dispatch fails, the freshly-issued OTP row is rolled back so the
     * user is not stranded with an undelivered code (and cooldown does not
     * lock them out from retrying).
     *
     * @throws ValidationException
     */
    public function issueAndSend(string $email, string $purpose): void
    {
        $code = $this->issue($email, $purpose);

        try {
            Mail::to($email)->queue(new OtpMail($code, $purpose));
        } catch (Throwable $e) {
            OtpVerification::where('email', $email)
                ->where('purpose', $purpose)
                ->delete();

            // Refund the send-count slot — an undelivered code shouldn't eat
            // into the user's hourly quota.
            $sendKey = $this->sendCountKey($email, $purpose);
            if ((int) Cache::get($sendKey, 0) > 0) {
                Cache::decrement($sendKey);
            }

            Log::error('OTP mail dispatch failed', [
                'email'   => $email,
                'purpose' => $purpose,
                'error'   => $e->getMessage(),
            ]);

            throw ValidationException::withMessages([
                'email' => ['We could not send the email right now. Please try again in a moment.'],
            ]);
        }

        Log::info('OTP issued', ['email' => $email, 'purpose' => $purpose]);
    }

    /**
     * Verify the OTP for the given email + purpose.
     * Returns true on success and deletes the OTP row.
     * Increments attempts on failure; invalidates code after MAX_ATTEMPTS.
     *
     * @throws ValidationException
     */
    public function verify(string $email, string $code, string $purpose): bool
    {
        $email = strtolower(trim($email));

        $otp = OtpVerification::where('email', $email)
            ->where('purpose', $purpose)
            ->latest('id')
            ->first();

        if (! $otp) {
            throw ValidationException::withMessages([
                'code' => ['Invalid or expired code.'],
            ]);
        }

        if ($otp->isExpired()) {
            $otp->delete();
            throw ValidationException::withMessages([
                'code' => ['Invalid or expired code.'],
            ]);
        }

        if ($otp->attempts >= self::MAX_ATTEMPTS) {
            $otp->delete();
            throw ValidationException::withMessages([
                'code' => ['Too many attempts. Please request a new code.'],
            ]);
        }

        $otp->increment('attempts');

        if (! Hash::check($code, $otp->code)) {
            $remaining = self::MAX_ATTEMPTS - $otp->attempts;

            if ($remaining <= 0) {
                $otp->delete();
            }

            throw ValidationException::withMessages([
                'code' => ['Invalid or expired code.'],
            ]);
        }

        $otp->delete();

        return true;
    }

    /**
     * Seconds remaining until next resend allowed for (email, purpose).
     * Returns 0 if ready.
     */
    public function resendCooldownSeconds(string $email, string $purpose): int
    {
        $email = strtolower(trim($email));

        $otp = OtpVerification::where('email', $email)
            ->where('purpose', $purpose)
            ->latest('id')
            ->first();

        if (! $otp || ! $otp->last_sent_at) {
            return 0;
        }

        $elapsed = (int) $otp->last_sent_at->diffInSeconds(now());

        return max(0, self::RESEND_COOLDOWN_S - $elapsed);
    }

    protected function generateCode(): string
    {
        $max = (10 ** self::OTP_LENGTH) - 1;

        return str_pad((string) random_int(0, $max), self::OTP_LENGTH, '0', STR_PAD_LEFT);
    }

    protected function sendCountKey(string $email, string $purpose): string
    {
        return 'otp-send-count:' . $purpose . ':' . sha1(strtolower(trim($email)));
    }
}
