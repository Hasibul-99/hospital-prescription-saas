<?php

namespace Tests\Feature\Auth;

use App\Mail\OtpMail;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $this->get('/register')->assertStatus(200);
    }

    public function test_register_creates_unverified_user_and_queues_otp(): void
    {
        Mail::fake();

        $response = $this->post('/register', [
            'name'                  => 'Test User',
            'email'                 => 'new@example.com',
            'password'              => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertRedirect(route('verification.otp', ['email' => 'new@example.com']));
        $this->assertGuest();
        $user = User::where('email', 'new@example.com')->first();
        $this->assertNotNull($user);
        $this->assertNull($user->email_verified_at);
        Mail::assertQueued(OtpMail::class);
        $this->assertDatabaseHas('otp_verifications', [
            'email'   => 'new@example.com',
            'purpose' => OtpService::PURPOSE_REGISTRATION,
        ]);
    }

    public function test_register_existing_verified_email_rejects(): void
    {
        User::factory()->create(['email' => 'verified@example.com', 'email_verified_at' => now()]);

        $this->post('/register', [
            'name'                  => 'X',
            'email'                 => 'verified@example.com',
            'password'              => 'password',
            'password_confirmation' => 'password',
        ])->assertSessionHasErrors('email');
    }

    public function test_register_existing_unverified_email_resends_otp(): void
    {
        Mail::fake();
        User::factory()->create(['email' => 'unverified@example.com', 'email_verified_at' => null]);

        $this->post('/register', [
            'name'                  => 'New Name',
            'email'                 => 'unverified@example.com',
            'password'              => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect(route('verification.otp', ['email' => 'unverified@example.com']));

        Mail::assertQueued(OtpMail::class);
        $this->assertDatabaseHas('users', ['email' => 'unverified@example.com', 'name' => 'New Name']);
    }
}
