<?php

namespace Tests\Feature\Auth;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Guards the multi-tenant boundary. These tests exist because public
 * self-registration once created a role=doctor / hospital_id=null account
 * whose queries fell through the tenant scope and read every hospital's data.
 * The fix has three layers: no public registration, a fail-closed global
 * scope, and middleware that rejects a hospital-less non-super-admin.
 */
class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    private function makeHospital(string $name): int
    {
        return DB::table('hospitals')->insertGetId([
            'name'                => $name,
            'slug'                => \Illuminate\Support\Str::slug($name),
            'subscription_status' => 'active',
            'is_active'           => true,
            'created_at'          => now(),
            'updated_at'          => now(),
        ]);
    }

    private function seedPatient(int $hospitalId, string $phone): void
    {
        DB::table('patients')->insert([
            'patient_uid' => 'P-H' . str_pad((string) $hospitalId, 3, '0', STR_PAD_LEFT) . '-' . $phone,
            'name'        => 'Patient ' . $phone,
            'gender'      => 'male',
            'phone'       => $phone,
            'hospital_id' => $hospitalId,
            'is_active'   => true,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);
    }

    public function test_public_registration_routes_are_removed(): void
    {
        $this->get('/register')->assertNotFound();
        $this->post('/register', [
            'name'                  => 'Attacker',
            'email'                 => 'attacker@example.com',
            'password'              => 'password',
            'password_confirmation' => 'password',
        ])->assertNotFound();

        $this->assertDatabaseMissing('users', ['email' => 'attacker@example.com']);
    }

    public function test_hospitalless_user_is_blocked_from_tenant_routes(): void
    {
        $doctor = User::factory()->create(['role' => 'doctor', 'hospital_id' => null]);

        $this->actingAs($doctor)->get('/doctor/dashboard')->assertForbidden();
    }

    public function test_tenant_scope_fails_closed_for_hospitalless_user(): void
    {
        $hospitalId = $this->makeHospital('Hospital A');
        $this->seedPatient($hospitalId, '01700000001');

        $doctor = User::factory()->create(['role' => 'doctor', 'hospital_id' => null]);

        $this->actingAs($doctor);

        // A doctor with no hospital must see zero tenant rows — never the
        // unscoped full table.
        $this->assertSame(0, Patient::count());
    }

    public function test_doctor_sees_only_own_hospital_patients(): void
    {
        $hospitalA = $this->makeHospital('Hospital A');
        $hospitalB = $this->makeHospital('Hospital B');

        $this->seedPatient($hospitalA, '01700000001');
        $this->seedPatient($hospitalB, '01800000002');

        $doctorA = User::factory()->create(['role' => 'doctor', 'hospital_id' => $hospitalA]);

        $this->actingAs($doctorA);

        $this->assertSame(1, Patient::count());
        $this->assertSame($hospitalA, Patient::first()->hospital_id);
    }
}
