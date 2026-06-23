<?php

namespace Tests\Feature\Auth;

use App\Models\OtpVerification;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_verify_otp_happy_path_logs_user_in(): void
    {
        $user = User::factory()->create(['email_verified_at' => null]);
        $code = '1234';
        OtpVerification::create([
            'email'        => $user->email,
            'code'         => Hash::make($code),
            'purpose'      => OtpService::PURPOSE_REGISTRATION,
            'expires_at'   => now()->addMinutes(10),
            'attempts'     => 0,
            'last_sent_at' => now(),
        ]);

        $this->post(route('verification.otp.verify'), ['email' => $user->email, 'code' => $code])
            ->assertRedirect();

        $this->assertAuthenticatedAs($user->fresh());
        $this->assertNotNull($user->fresh()->email_verified_at);
        $this->assertDatabaseMissing('otp_verifications', ['email' => $user->email]);
    }

    public function test_verify_otp_wrong_code_increments_attempts(): void
    {
        $user = User::factory()->create(['email_verified_at' => null]);
        OtpVerification::create([
            'email'        => $user->email,
            'code'         => Hash::make('1234'),
            'purpose'      => OtpService::PURPOSE_REGISTRATION,
            'expires_at'   => now()->addMinutes(10),
            'attempts'     => 0,
            'last_sent_at' => now(),
        ]);

        $this->post(route('verification.otp.verify'), ['email' => $user->email, 'code' => '0000'])
            ->assertSessionHasErrors('code');

        $this->assertGuest();
        $this->assertEquals(1, OtpVerification::where('email', $user->email)->first()->attempts);
    }

    public function test_verify_otp_expired_code_rejects(): void
    {
        $user = User::factory()->create(['email_verified_at' => null]);
        OtpVerification::create([
            'email'        => $user->email,
            'code'         => Hash::make('1234'),
            'purpose'      => OtpService::PURPOSE_REGISTRATION,
            'expires_at'   => now()->subMinute(),
            'attempts'     => 0,
            'last_sent_at' => now()->subMinutes(15),
        ]);

        $this->post(route('verification.otp.verify'), ['email' => $user->email, 'code' => '1234'])
            ->assertSessionHasErrors('code');

        $this->assertGuest();
        $this->assertDatabaseMissing('otp_verifications', ['email' => $user->email]);
    }

    public function test_verify_otp_attempt_cap_invalidates_code(): void
    {
        $user = User::factory()->create(['email_verified_at' => null]);
        OtpVerification::create([
            'email'        => $user->email,
            'code'         => Hash::make('1234'),
            'purpose'      => OtpService::PURPOSE_REGISTRATION,
            'expires_at'   => now()->addMinutes(10),
            'attempts'     => 0,
            'last_sent_at' => now(),
        ]);

        for ($i = 0; $i < OtpService::MAX_ATTEMPTS; $i++) {
            $this->post(route('verification.otp.verify'), ['email' => $user->email, 'code' => '0000']);
        }

        // After cap, code is invalidated
        $this->assertDatabaseMissing('otp_verifications', ['email' => $user->email]);

        // Even correct code now rejected
        $this->post(route('verification.otp.verify'), ['email' => $user->email, 'code' => '1234'])
            ->assertSessionHasErrors('code');

        $this->assertGuest();
    }
}
