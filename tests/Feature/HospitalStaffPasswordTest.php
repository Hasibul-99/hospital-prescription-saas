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

/**
 * Hospital admins reset passwords for their own doctors and receptionists
 * through dedicated endpoints — never as a side effect of a profile save, and
 * never across tenant boundaries.
 */
class HospitalStaffPasswordTest extends TestCase
{
    use RefreshDatabase;

    private Hospital $hospital;
    private Hospital $otherHospital;
    private User $admin;
    private User $doctor;
    private User $receptionist;

    protected function setUp(): void
    {
        parent::setUp();
        Vite::useScriptTagAttributes([])->useStyleTagAttributes([]);
        $this->withoutVite();

        $plan = Plan::firstOrCreate(
            ['code' => 'basic'],
            ['name' => 'Basic', 'price_monthly' => 1000, 'max_doctors' => 20],
        );

        $this->hospital = $this->makeHospital($plan->id, 'City Medical');
        $this->otherHospital = $this->makeHospital($plan->id, 'Rival Clinic');

        $this->admin = User::factory()->create([
            'role' => 'hospital_admin', 'hospital_id' => $this->hospital->id, 'is_active' => true,
        ]);
        $this->doctor = User::factory()->create([
            'role' => 'doctor', 'hospital_id' => $this->hospital->id,
            'is_active' => true, 'password' => 'original-password',
        ]);
        $this->receptionist = User::factory()->create([
            'role' => 'receptionist', 'hospital_id' => $this->hospital->id,
            'is_active' => true, 'password' => 'original-password',
        ]);
    }

    private function makeHospital(int $planId, string $name): Hospital
    {
        return Hospital::create([
            'name' => $name, 'slug' => str($name)->slug() . '-' . uniqid(),
            'plan_id' => $planId, 'currency' => 'BDT',
            'subscription_status' => 'active', 'is_active' => true,
        ]);
    }

    /** @return array<string, array{0:string, 1:string}> */
    public static function staffProvider(): array
    {
        return [
            'doctor' => ['doctor', 'doctors'],
            'receptionist' => ['receptionist', 'receptionists'],
        ];
    }

    private function staff(string $role): User
    {
        return $role === 'doctor' ? $this->doctor : $this->receptionist;
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('staffProvider')]
    public function test_the_profile_form_can_no_longer_change_the_password(string $role, string $segment): void
    {
        $staff = $this->staff($role);

        $this->actingAs($this->admin)
            ->put("/hospital/{$segment}/{$staff->id}", [
                'name' => 'Renamed',
                'email' => $staff->email,
                'is_active' => true,
                'password' => 'injected-password',
                'password_confirmation' => 'injected-password',
            ])
            ->assertRedirect("/hospital/{$segment}");

        $staff->refresh();

        $this->assertSame('Renamed', $staff->name, 'the profile fields still save');
        $this->assertTrue(Hash::check('original-password', $staff->password), 'the password is untouched');
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('staffProvider')]
    public function test_a_hospital_admin_can_reset_their_own_staff_password(string $role, string $segment): void
    {
        $staff = $this->staff($role);

        $this->actingAs($this->admin)
            ->put("/hospital/{$segment}/{$staff->id}/password", [
                'password' => 'brand-new-password',
                'password_confirmation' => 'brand-new-password',
            ])
            ->assertSessionHas('success');

        $this->assertTrue(Hash::check('brand-new-password', $staff->fresh()->password));
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('staffProvider')]
    public function test_the_staff_member_can_log_in_with_the_new_password(string $role, string $segment): void
    {
        $staff = $this->staff($role);

        $this->actingAs($this->admin)
            ->put("/hospital/{$segment}/{$staff->id}/password", [
                'password' => 'brand-new-password',
                'password_confirmation' => 'brand-new-password',
            ]);

        $this->app['auth']->forgetGuards();

        $this->assertTrue($this->app['auth']->guard()->attempt([
            'email' => $staff->email,
            'password' => 'brand-new-password',
        ]));
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('staffProvider')]
    public function test_a_reset_rotates_the_remember_token_and_is_audited(string $role, string $segment): void
    {
        $staff = $this->staff($role);
        $staff->forceFill(['remember_token' => 'stale-token'])->save();

        $this->actingAs($this->admin)
            ->put("/hospital/{$segment}/{$staff->id}/password", [
                'password' => 'brand-new-password',
                'password_confirmation' => 'brand-new-password',
            ]);

        $this->assertNotSame('stale-token', $staff->fresh()->remember_token);

        $log = AuditLog::where('action', 'user.password_reset')->latest('id')->first();

        $this->assertNotNull($log);
        $this->assertSame($staff->id, (int) $log->subject_id);
        $this->assertSame($this->admin->id, $log->user_id);
        $this->assertSame($this->hospital->id, $log->hospital_id);
        $this->assertStringNotContainsString('brand-new-password', json_encode($log->meta));
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('staffProvider')]
    public function test_an_admin_from_another_hospital_is_blocked(string $role, string $segment): void
    {
        $staff = $this->staff($role);

        $outsider = User::factory()->create([
            'role' => 'hospital_admin', 'hospital_id' => $this->otherHospital->id, 'is_active' => true,
        ]);

        $this->actingAs($outsider)
            ->put("/hospital/{$segment}/{$staff->id}/password", [
                'password' => 'brand-new-password',
                'password_confirmation' => 'brand-new-password',
            ])
            ->assertForbidden();

        $this->assertTrue(Hash::check('original-password', $staff->fresh()->password));
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('staffProvider')]
    public function test_confirmation_and_length_are_enforced(string $role, string $segment): void
    {
        $staff = $this->staff($role);

        $this->actingAs($this->admin)
            ->put("/hospital/{$segment}/{$staff->id}/password", [
                'password' => 'brand-new-password',
                'password_confirmation' => 'something-else',
            ])
            ->assertSessionHasErrors('password');

        $this->actingAs($this->admin)
            ->put("/hospital/{$segment}/{$staff->id}/password", [
                'password' => 'short',
                'password_confirmation' => 'short',
            ])
            ->assertSessionHasErrors('password');

        $this->assertTrue(Hash::check('original-password', $staff->fresh()->password));
    }

    public function test_the_endpoint_refuses_a_user_of_the_wrong_role(): void
    {
        // A receptionist is not reachable through the doctors endpoint, even
        // within the same hospital.
        $this->actingAs($this->admin)
            ->put("/hospital/doctors/{$this->receptionist->id}/password", [
                'password' => 'brand-new-password',
                'password_confirmation' => 'brand-new-password',
            ])
            ->assertForbidden();

        $this->actingAs($this->admin)
            ->put("/hospital/receptionists/{$this->doctor->id}/password", [
                'password' => 'brand-new-password',
                'password_confirmation' => 'brand-new-password',
            ])
            ->assertForbidden();
    }

    public function test_doctors_and_receptionists_cannot_reset_passwords(): void
    {
        foreach ([$this->doctor, $this->receptionist] as $staff) {
            $this->actingAs($staff)
                ->put("/hospital/doctors/{$this->doctor->id}/password", [
                    'password' => 'brand-new-password',
                    'password_confirmation' => 'brand-new-password',
                ])
                ->assertForbidden();
        }

        $this->assertTrue(Hash::check('original-password', $this->doctor->fresh()->password));
    }
}
