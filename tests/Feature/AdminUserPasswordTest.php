<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Hospital;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Vite;
use Tests\TestCase;

class AdminUserPasswordTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;
    private User $target;
    private Hospital $hospital;

    protected function setUp(): void
    {
        parent::setUp();
        Vite::useScriptTagAttributes([])->useStyleTagAttributes([]);
        $this->withoutVite();

        $plan = Plan::firstOrCreate(['code' => 'basic'], ['name' => 'Basic', 'price_monthly' => 1000, 'max_doctors' => 20]);

        $this->hospital = Hospital::create([
            'name' => 'City Medical', 'slug' => 'city-' . uniqid(),
            'plan_id' => $plan->id, 'currency' => 'BDT', 'subscription_status' => 'active', 'is_active' => true,
        ]);

        $this->superAdmin = User::factory()->create(['role' => 'super_admin', 'hospital_id' => null, 'is_active' => true]);
        $this->target = User::factory()->create([
            'role' => 'doctor',
            'hospital_id' => $this->hospital->id,
            'is_active' => true,
            'password' => 'original-password',
        ]);
    }

    private function profilePayload(array $overrides = []): array
    {
        return [
            'name' => $this->target->name,
            'email' => $this->target->email,
            'role' => 'doctor',
            'hospital_id' => $this->hospital->id,
            'is_active' => true,
            ...$overrides,
        ];
    }

    public function test_the_profile_form_can_no_longer_change_the_password(): void
    {
        // Even if a password is posted to the profile endpoint, it must be ignored.
        $this->actingAs($this->superAdmin)
            ->put("/admin/users/{$this->target->id}", $this->profilePayload([
                'name' => 'Renamed',
                'password' => 'injected-password',
                'password_confirmation' => 'injected-password',
            ]))
            ->assertRedirect('/admin/users');

        $this->target->refresh();

        $this->assertSame('Renamed', $this->target->name, 'the profile fields still save');
        $this->assertTrue(Hash::check('original-password', $this->target->password), 'the password is untouched');
        $this->assertFalse(Hash::check('injected-password', $this->target->password));
    }

    public function test_super_admin_can_reset_a_password_through_the_dedicated_endpoint(): void
    {
        $this->actingAs($this->superAdmin)
            ->put("/admin/users/{$this->target->id}/password", [
                'password' => 'brand-new-password',
                'password_confirmation' => 'brand-new-password',
            ])
            ->assertSessionHas('success');

        $this->assertTrue(Hash::check('brand-new-password', $this->target->fresh()->password));
    }

    public function test_the_user_can_actually_log_in_with_the_new_password(): void
    {
        // Guards against double-hashing: the `hashed` cast plus an explicit
        // Hash::make() must still produce a usable credential.
        $this->actingAs($this->superAdmin)
            ->put("/admin/users/{$this->target->id}/password", [
                'password' => 'brand-new-password',
                'password_confirmation' => 'brand-new-password',
            ]);

        $this->app['auth']->forgetGuards();

        $this->assertTrue(
            $this->app['auth']->guard()->attempt([
                'email' => $this->target->email,
                'password' => 'brand-new-password',
            ]),
        );
    }

    public function test_a_reset_rotates_the_remember_token(): void
    {
        $this->target->forceFill(['remember_token' => 'stale-token'])->save();

        $this->actingAs($this->superAdmin)
            ->put("/admin/users/{$this->target->id}/password", [
                'password' => 'brand-new-password',
                'password_confirmation' => 'brand-new-password',
            ]);

        $this->assertNotSame('stale-token', $this->target->fresh()->remember_token);
    }

    public function test_a_reset_is_recorded_in_the_audit_log(): void
    {
        $this->actingAs($this->superAdmin)
            ->put("/admin/users/{$this->target->id}/password", [
                'password' => 'brand-new-password',
                'password_confirmation' => 'brand-new-password',
            ]);

        $log = AuditLog::where('action', 'user.password_reset')->latest('id')->first();

        $this->assertNotNull($log, 'a privileged reset must leave an audit trail');
        $this->assertSame($this->target->id, (int) $log->subject_id);
        $this->assertSame($this->superAdmin->id, $log->user_id);
        $this->assertSame($this->superAdmin->name, $log->meta['reset_by'] ?? null);
        // The plaintext must never reach the audit trail.
        $this->assertStringNotContainsString('brand-new-password', json_encode($log->meta));
    }

    public function test_confirmation_and_length_are_enforced(): void
    {
        $this->actingAs($this->superAdmin)
            ->put("/admin/users/{$this->target->id}/password", [
                'password' => 'brand-new-password',
                'password_confirmation' => 'something-else',
            ])
            ->assertSessionHasErrors('password');

        $this->actingAs($this->superAdmin)
            ->put("/admin/users/{$this->target->id}/password", [
                'password' => 'short',
                'password_confirmation' => 'short',
            ])
            ->assertSessionHasErrors('password');

        $this->assertTrue(Hash::check('original-password', $this->target->fresh()->password));
    }

    public function test_only_super_admins_can_reset_passwords(): void
    {
        $hospitalAdmin = User::factory()->create([
            'role' => 'hospital_admin', 'hospital_id' => $this->hospital->id, 'is_active' => true,
        ]);

        $this->actingAs($hospitalAdmin)
            ->put("/admin/users/{$this->target->id}/password", [
                'password' => 'brand-new-password',
                'password_confirmation' => 'brand-new-password',
            ])
            ->assertForbidden();

        $this->app['auth']->forgetGuards();

        $this->put("/admin/users/{$this->target->id}/password", [
            'password' => 'brand-new-password',
            'password_confirmation' => 'brand-new-password',
        ])->assertRedirect('/login');

        $this->assertTrue(Hash::check('original-password', $this->target->fresh()->password));
    }
}
