<?php

namespace Tests\Feature\Auth;

use App\Mail\OtpMail;
use App\Models\OtpVerification;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_screen_renders(): void
    {
        $this->get('/forgot-password')->assertStatus(200);
    }

    public function test_forgot_password_with_existing_email_queues_otp(): void
    {
        Mail::fake();
        $user = User::factory()->create();

        $this->post('/forgot-password', ['email' => $user->email])
            ->assertRedirect(route('password.otp', ['email' => $user->email]));

        Mail::assertQueued(OtpMail::class);
        $this->assertDatabaseHas('otp_verifications', [
            'email'   => $user->email,
            'purpose' => OtpService::PURPOSE_PASSWORD_RESET,
        ]);
    }

    public function test_forgot_password_does_not_leak_unknown_email(): void
    {
        Mail::fake();

        $this->post('/forgot-password', ['email' => 'unknown@example.com'])
            ->assertRedirect(route('password.otp', ['email' => 'unknown@example.com']));

        Mail::assertNothingQueued();
        $this->assertDatabaseMissing('otp_verifications', ['email' => 'unknown@example.com']);
    }

    public function test_reset_password_with_valid_otp_updates_password(): void
    {
        $user = User::factory()->create();
        $code = '4321';
        OtpVerification::create([
            'email'        => $user->email,
            'code'         => Hash::make($code),
            'purpose'      => OtpService::PURPOSE_PASSWORD_RESET,
            'expires_at'   => now()->addMinutes(10),
            'attempts'     => 0,
            'last_sent_at' => now(),
        ]);

        $this->post('/reset-password', [
            'email'                 => $user->email,
            'code'                  => $code,
            'password'              => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ])->assertRedirect(route('login'));

        $this->assertTrue(Hash::check('new-password-123', $user->fresh()->password));
        $this->assertDatabaseMissing('otp_verifications', ['email' => $user->email]);
    }

    public function test_reset_password_with_wrong_otp_rejects(): void
    {
        $user = User::factory()->create();
        OtpVerification::create([
            'email'        => $user->email,
            'code'         => Hash::make('4321'),
            'purpose'      => OtpService::PURPOSE_PASSWORD_RESET,
            'expires_at'   => now()->addMinutes(10),
            'attempts'     => 0,
            'last_sent_at' => now(),
        ]);

        $oldHash = $user->password;

        $this->post('/reset-password', [
            'email'                 => $user->email,
            'code'                  => '0000',
            'password'              => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ])->assertSessionHasErrors('code');

        $this->assertSame($oldHash, $user->fresh()->password);
    }

    public function test_resend_otp_respects_cooldown(): void
    {
        Mail::fake();
        $user = User::factory()->create(['email_verified_at' => null]);

        OtpVerification::create([
            'email'        => $user->email,
            'code'         => Hash::make('1111'),
            'purpose'      => OtpService::PURPOSE_REGISTRATION,
            'expires_at'   => now()->addMinutes(10),
            'attempts'     => 0,
            'last_sent_at' => now(),
        ]);

        $this->post(route('verification.otp.resend'), [
            'email'   => $user->email,
            'purpose' => 'registration',
        ])->assertSessionHasErrors('email');

        Mail::assertNothingQueued();
    }
}
