<?php

namespace Tests\Feature;

use App\Models\Hospital;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Vite;
use Tests\TestCase;

/**
 * The doctor cap, the prescription cap, and how per-hospital overrides interact
 * with the plan's own limits.
 */
class PlanLimitTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Vite::useScriptTagAttributes([])->useStyleTagAttributes([]);
        $this->withoutVite();
    }

    private function hospitalOnPlan(array $planAttributes = [], array $hospitalAttributes = []): Hospital
    {
        $plan = Plan::create([
            'code' => 'p-' . uniqid(),
            'name' => 'Test Plan',
            'price_monthly' => 1000,
            'max_doctors' => 2,
            'trial_days' => 0,
            ...$planAttributes,
        ]);

        return Hospital::create([
            'name' => 'Test Hospital',
            'slug' => 'h-' . uniqid(),
            'plan_id' => $plan->id,
            'billing_cycle' => 'monthly',
            'currency' => 'BDT',
            'subscription_status' => 'active',
            'is_active' => true,
            ...$hospitalAttributes,
        ]);
    }

    private function addDoctors(Hospital $hospital, int $count, bool $active = true): void
    {
        User::factory()->count($count)->create([
            'role' => 'doctor',
            'hospital_id' => $hospital->id,
            'is_active' => $active,
        ]);
    }

    private function doctorPayload(array $overrides = []): array
    {
        return [
            'name' => 'Dr. New',
            'email' => 'new-' . uniqid() . '@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'is_active' => true,
            ...$overrides,
        ];
    }

    public function test_effective_limit_prefers_the_override_over_the_plan(): void
    {
        $hospital = $this->hospitalOnPlan(['max_doctors' => 2]);
        $this->assertSame(2, $hospital->effectiveMaxDoctors());

        $hospital->update(['max_doctors_override' => 9]);
        $this->assertSame(9, $hospital->fresh()->load('plan')->effectiveMaxDoctors());

        // An override may also be *lower* than the plan.
        $hospital->update(['max_doctors_override' => 1]);
        $this->assertSame(1, $hospital->fresh()->load('plan')->effectiveMaxDoctors());
    }

    public function test_a_null_plan_limit_means_unlimited(): void
    {
        $hospital = $this->hospitalOnPlan(['max_doctors' => null]);
        $this->addDoctors($hospital, 25);

        $this->assertNull($hospital->effectiveMaxDoctors());
        $this->assertTrue($hospital->canAddDoctor());
    }

    public function test_hospital_admin_is_blocked_at_the_doctor_cap(): void
    {
        $hospital = $this->hospitalOnPlan(['max_doctors' => 2]);
        $admin = User::factory()->create(['role' => 'hospital_admin', 'hospital_id' => $hospital->id, 'is_active' => true]);

        $this->addDoctors($hospital, 1);

        // Second doctor fits.
        $this->actingAs($admin)
            ->post('/hospital/doctors', $this->doctorPayload())
            ->assertRedirect('/hospital/doctors');

        // Third does not.
        $this->actingAs($admin)
            ->post('/hospital/doctors', $this->doctorPayload())
            ->assertSessionHasErrors('name');

        $this->assertSame(2, $hospital->fresh()->activeDoctorCount());
    }

    public function test_inactive_doctors_do_not_consume_the_cap(): void
    {
        $hospital = $this->hospitalOnPlan(['max_doctors' => 2]);
        $admin = User::factory()->create(['role' => 'hospital_admin', 'hospital_id' => $hospital->id, 'is_active' => true]);

        $this->addDoctors($hospital, 2, active: false);

        $this->actingAs($admin)
            ->post('/hospital/doctors', $this->doctorPayload())
            ->assertRedirect('/hospital/doctors');
    }

    public function test_reactivating_a_doctor_is_blocked_at_the_cap(): void
    {
        $hospital = $this->hospitalOnPlan(['max_doctors' => 1]);
        $admin = User::factory()->create(['role' => 'hospital_admin', 'hospital_id' => $hospital->id, 'is_active' => true]);

        $this->addDoctors($hospital, 1);
        $disabled = User::factory()->create(['role' => 'doctor', 'hospital_id' => $hospital->id, 'is_active' => false]);

        $this->actingAs($admin)
            ->put("/hospital/doctors/{$disabled->id}", [
                'name' => $disabled->name,
                'email' => $disabled->email,
                'is_active' => true,
            ])
            ->assertSessionHasErrors('is_active');

        $this->assertFalse($disabled->fresh()->is_active);
    }

    public function test_editing_an_already_active_doctor_is_never_blocked(): void
    {
        // Hospital is over its cap after a downgrade — existing doctors must
        // still be editable.
        $hospital = $this->hospitalOnPlan(['max_doctors' => 1]);
        $admin = User::factory()->create(['role' => 'hospital_admin', 'hospital_id' => $hospital->id, 'is_active' => true]);

        $this->addDoctors($hospital, 3);
        $doctor = $hospital->users()->where('role', 'doctor')->first();

        $this->actingAs($admin)
            ->put("/hospital/doctors/{$doctor->id}", [
                'name' => 'Renamed',
                'email' => $doctor->email,
                'is_active' => true,
            ])
            ->assertRedirect('/hospital/doctors');

        $this->assertSame('Renamed', $doctor->fresh()->name);
    }

    public function test_raising_the_override_unblocks_the_cap(): void
    {
        $hospital = $this->hospitalOnPlan(['max_doctors' => 1]);
        $admin = User::factory()->create(['role' => 'hospital_admin', 'hospital_id' => $hospital->id, 'is_active' => true]);

        $this->addDoctors($hospital, 1);

        $this->actingAs($admin)
            ->post('/hospital/doctors', $this->doctorPayload())
            ->assertSessionHasErrors('name');

        $hospital->update(['max_doctors_override' => 5]);

        $this->actingAs($admin)
            ->post('/hospital/doctors', $this->doctorPayload())
            ->assertRedirect('/hospital/doctors');
    }

    public function test_super_admin_is_also_blocked_by_the_cap(): void
    {
        $hospital = $this->hospitalOnPlan(['max_doctors' => 1]);
        $superAdmin = User::factory()->create(['role' => 'super_admin', 'hospital_id' => null, 'is_active' => true]);

        $this->addDoctors($hospital, 1);

        $this->actingAs($superAdmin)
            ->post('/admin/users', [
                'name' => 'Dr. Extra',
                'email' => 'extra@example.com',
                'password' => 'password123',
                'password_confirmation' => 'password123',
                'role' => 'doctor',
                'hospital_id' => $hospital->id,
                'is_active' => true,
            ])
            ->assertSessionHasErrors('hospital_id');
    }

    public function test_super_admin_can_still_create_non_doctor_users_at_the_cap(): void
    {
        $hospital = $this->hospitalOnPlan(['max_doctors' => 1]);
        $superAdmin = User::factory()->create(['role' => 'super_admin', 'hospital_id' => null, 'is_active' => true]);

        $this->addDoctors($hospital, 1);

        $this->actingAs($superAdmin)
            ->post('/admin/users', [
                'name' => 'Reception',
                'email' => 'reception@example.com',
                'password' => 'password123',
                'password_confirmation' => 'password123',
                'role' => 'receptionist',
                'hospital_id' => $hospital->id,
                'is_active' => true,
            ])
            ->assertRedirect('/admin/users');
    }

    public function test_downgrading_below_headcount_is_allowed_but_warns(): void
    {
        $hospital = $this->hospitalOnPlan(['max_doctors' => 10]);
        $small = Plan::create(['code' => 'small', 'name' => 'Small', 'price_monthly' => 100, 'max_doctors' => 1]);
        $superAdmin = User::factory()->create(['role' => 'super_admin', 'hospital_id' => null, 'is_active' => true]);

        $this->addDoctors($hospital, 4);

        $this->actingAs($superAdmin)
            ->put("/admin/hospitals/{$hospital->id}", [
                'name' => $hospital->name,
                'slug' => $hospital->slug,
                'plan_id' => $small->id,
                'billing_cycle' => 'monthly',
                'currency' => 'BDT',
                'subscription_status' => 'active',
                'is_active' => true,
            ])
            ->assertSessionHas('error');

        // The downgrade still applied, and nobody was deactivated.
        $this->assertSame($small->id, $hospital->fresh()->plan_id);
        $this->assertSame(4, $hospital->fresh()->activeDoctorCount());
    }

    public function test_prescription_quota_comes_from_the_plan(): void
    {
        $metered = $this->hospitalOnPlan(['max_prescriptions' => 30]);
        $this->assertTrue($metered->hasFreeQuotaRemaining());

        $metered->update(['prescription_quota_used' => 30]);
        $this->assertFalse($metered->fresh()->load('plan')->hasFreeQuotaRemaining());

        $unmetered = $this->hospitalOnPlan(['max_prescriptions' => null], ['prescription_quota_used' => 5000]);
        $this->assertTrue($unmetered->hasFreeQuotaRemaining());
    }

    public function test_subscription_is_inactive_once_the_end_date_passes(): void
    {
        $hospital = $this->hospitalOnPlan([], [
            'subscription_status' => 'active',
            'subscription_ends_at' => now()->subDay(),
        ]);

        $this->assertFalse($hospital->isSubscriptionActive());

        $hospital->update(['subscription_ends_at' => now()->addMonth()]);
        $this->assertTrue($hospital->fresh()->isSubscriptionActive());

        // A trial is judged on trial_ends_at, not subscription_ends_at.
        $hospital->update(['subscription_status' => 'trial', 'trial_ends_at' => now()->subDay()]);
        $this->assertFalse($hospital->fresh()->isSubscriptionActive());
    }

    public function test_expired_hospital_users_get_the_subscription_page_not_a_crash(): void
    {
        $hospital = $this->hospitalOnPlan([], ['subscription_status' => 'suspended']);
        $doctor = User::factory()->create(['role' => 'doctor', 'hospital_id' => $hospital->id, 'is_active' => true]);

        $this->actingAs($doctor)
            ->get('/doctor/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Error/SubscriptionExpired'));
    }
}
