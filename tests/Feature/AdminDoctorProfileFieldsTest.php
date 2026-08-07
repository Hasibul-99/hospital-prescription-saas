<?php

namespace Tests\Feature;

use App\Models\DoctorProfile;
use App\Models\Hospital;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Vite;
use Tests\TestCase;

/**
 * Specialization and degrees are optional doctor-profile fields the super admin
 * may set from the user form. Both are free text; config/doctor.php only
 * supplies dropdown suggestions.
 */
class AdminDoctorProfileFieldsTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;
    private Hospital $hospital;

    protected function setUp(): void
    {
        parent::setUp();
        Vite::useScriptTagAttributes([])->useStyleTagAttributes([]);
        $this->withoutVite();

        $plan = Plan::firstOrCreate(
            ['code' => 'basic'],
            ['name' => 'Basic', 'price_monthly' => 1000, 'max_doctors' => 20],
        );

        $this->hospital = Hospital::create([
            'name' => 'City Medical', 'slug' => 'city-' . uniqid(),
            'plan_id' => $plan->id, 'currency' => 'BDT',
            'subscription_status' => 'active', 'is_active' => true,
        ]);

        $this->superAdmin = User::factory()->create([
            'role' => 'super_admin', 'hospital_id' => null, 'is_active' => true,
        ]);
    }

    private function payload(array $overrides = []): array
    {
        return [
            'name' => 'Dr. Test',
            'email' => 'dr-' . uniqid() . '@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'doctor',
            'hospital_id' => $this->hospital->id,
            'is_active' => true,
            ...$overrides,
        ];
    }

    public function test_the_form_offers_specialization_suggestions(): void
    {
        $props = $this->actingAs($this->superAdmin)
            ->get('/admin/users/create')
            ->assertOk()
            ->viewData('page')['props'];

        $this->assertContains('Cardiology', $props['specializations']);
        $this->assertContains('Pediatrics', $props['specializations']);
    }

    public function test_creating_a_doctor_stores_the_optional_fields(): void
    {
        $this->actingAs($this->superAdmin)
            ->post('/admin/users', $this->payload([
                'email' => 'cardio@example.com',
                'specialization' => 'Cardiology',
                'degrees' => 'MBBS, MD (Cardiology)',
            ]))
            ->assertRedirect('/admin/users');

        $profile = User::where('email', 'cardio@example.com')->first()->doctorProfile;

        $this->assertNotNull($profile, 'a doctor profile row must be created');
        $this->assertSame('Cardiology', $profile->specialization);
        $this->assertSame('MBBS, MD (Cardiology)', $profile->degrees);
        $this->assertSame($this->hospital->id, $profile->hospital_id);
    }

    public function test_both_fields_are_optional(): void
    {
        $this->actingAs($this->superAdmin)
            ->post('/admin/users', $this->payload(['email' => 'plain@example.com']))
            ->assertRedirect('/admin/users')
            ->assertSessionHasNoErrors();

        $user = User::where('email', 'plain@example.com')->first();

        $this->assertNotNull($user);
        // Nothing to store means no empty profile row is created.
        $this->assertNull($user->doctorProfile);
    }

    public function test_an_unlisted_specialization_is_still_accepted(): void
    {
        // The config list is a suggestion, not a whitelist.
        $this->actingAs($this->superAdmin)
            ->post('/admin/users', $this->payload([
                'email' => 'niche@example.com',
                'specialization' => 'Interventional Neuroradiology',
            ]))
            ->assertRedirect('/admin/users')
            ->assertSessionHasNoErrors();

        $this->assertSame(
            'Interventional Neuroradiology',
            User::where('email', 'niche@example.com')->first()->doctorProfile->specialization,
        );
    }

    public function test_editing_updates_an_existing_profile_without_duplicating_it(): void
    {
        $doctor = User::factory()->create([
            'role' => 'doctor', 'hospital_id' => $this->hospital->id, 'is_active' => true,
        ]);
        DoctorProfile::create([
            'user_id' => $doctor->id, 'hospital_id' => $this->hospital->id,
            'specialization' => 'Cardiology', 'degrees' => 'MBBS',
        ]);

        $this->actingAs($this->superAdmin)
            ->put("/admin/users/{$doctor->id}", [
                'name' => $doctor->name,
                'email' => $doctor->email,
                'role' => 'doctor',
                'hospital_id' => $this->hospital->id,
                'is_active' => true,
                'specialization' => 'Neurology',
                'degrees' => 'MBBS, FCPS (Neurology)',
            ])
            ->assertRedirect('/admin/users');

        $this->assertSame(1, DoctorProfile::where('user_id', $doctor->id)->count());
        $this->assertSame('Neurology', $doctor->fresh()->doctorProfile->specialization);
    }

    public function test_the_edit_form_preloads_the_existing_values(): void
    {
        $doctor = User::factory()->create([
            'role' => 'doctor', 'hospital_id' => $this->hospital->id, 'is_active' => true,
        ]);
        DoctorProfile::create([
            'user_id' => $doctor->id, 'hospital_id' => $this->hospital->id,
            'specialization' => 'Orthopedics', 'degrees' => 'MBBS, MS (Ortho)',
        ]);

        $props = $this->actingAs($this->superAdmin)
            ->get("/admin/users/{$doctor->id}/edit")
            ->assertOk()
            ->viewData('page')['props'];

        $this->assertSame('Orthopedics', $props['user']['doctor_profile']['specialization']);
        $this->assertSame('MBBS, MS (Ortho)', $props['user']['doctor_profile']['degrees']);
    }

    public function test_clearing_the_fields_blanks_them_on_an_existing_profile(): void
    {
        $doctor = User::factory()->create([
            'role' => 'doctor', 'hospital_id' => $this->hospital->id, 'is_active' => true,
        ]);
        DoctorProfile::create([
            'user_id' => $doctor->id, 'hospital_id' => $this->hospital->id,
            'specialization' => 'Cardiology', 'degrees' => 'MBBS',
        ]);

        $this->actingAs($this->superAdmin)
            ->put("/admin/users/{$doctor->id}", [
                'name' => $doctor->name,
                'email' => $doctor->email,
                'role' => 'doctor',
                'hospital_id' => $this->hospital->id,
                'is_active' => true,
                'specialization' => '',
                'degrees' => '',
            ])
            ->assertRedirect('/admin/users');

        $profile = $doctor->fresh()->doctorProfile;

        $this->assertNull($profile->specialization);
        $this->assertNull($profile->degrees);
    }

    public function test_non_doctor_roles_never_get_a_profile(): void
    {
        // Even if the fields are posted, a receptionist has no doctor profile.
        $this->actingAs($this->superAdmin)
            ->post('/admin/users', $this->payload([
                'email' => 'reception@example.com',
                'role' => 'receptionist',
                'specialization' => 'Cardiology',
                'degrees' => 'MBBS',
            ]))
            ->assertRedirect('/admin/users');

        $user = User::where('email', 'reception@example.com')->first();

        $this->assertSame('receptionist', $user->role);
        $this->assertNull($user->doctorProfile);
    }

    public function test_a_doctor_without_a_hospital_gets_no_profile(): void
    {
        // doctor_profiles.hospital_id is NOT NULL, so there is nothing to attach to.
        $this->actingAs($this->superAdmin)
            ->post('/admin/users', $this->payload([
                'email' => 'floating@example.com',
                'hospital_id' => null,
                'specialization' => 'Cardiology',
            ]))
            ->assertRedirect('/admin/users');

        $this->assertNull(User::where('email', 'floating@example.com')->first()->doctorProfile);
    }

    public function test_over_long_values_are_rejected(): void
    {
        $this->actingAs($this->superAdmin)
            ->post('/admin/users', $this->payload(['specialization' => str_repeat('a', 256)]))
            ->assertSessionHasErrors('specialization');

        $this->actingAs($this->superAdmin)
            ->post('/admin/users', $this->payload(['degrees' => str_repeat('a', 501)]))
            ->assertSessionHasErrors('degrees');
    }

    public function test_the_hospital_doctor_form_offers_the_same_suggestions(): void
    {
        // One shared list, so values do not drift between the two entry points.
        $admin = User::factory()->create([
            'role' => 'hospital_admin', 'hospital_id' => $this->hospital->id, 'is_active' => true,
        ]);

        $props = $this->actingAs($admin)
            ->get('/hospital/doctors/create')
            ->assertOk()
            ->viewData('page')['props'];

        $this->assertSame(config('doctor.specializations'), $props['specializations']);
    }
}
