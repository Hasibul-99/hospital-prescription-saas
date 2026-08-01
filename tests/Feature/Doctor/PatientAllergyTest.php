<?php

namespace Tests\Feature\Doctor;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PatientAllergyTest extends TestCase
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

    private function makeDoctor(int $hospitalId): User
    {
        return User::factory()->create([
            'role'        => 'doctor',
            'hospital_id' => $hospitalId,
            'is_active'   => true,
        ]);
    }

    public function test_doctor_adds_and_removes_an_allergy(): void
    {
        $hospitalId = $this->makeHospital('Hospital A');
        $doctor = $this->makeDoctor($hospitalId);
        $this->actingAs($doctor);

        $patient = Patient::create(['name' => 'Rahim', 'gender' => 'male', 'phone' => '01700000001']);

        $res = $this->postJson("/doctor/patients/{$patient->id}/allergies", ['allergen' => 'Penicillin']);
        $res->assertCreated()->assertJsonPath('allergy.allergen', 'Penicillin');

        $this->assertDatabaseHas('patient_allergies', [
            'patient_id'  => $patient->id,
            'hospital_id' => $hospitalId,
            'allergen'    => 'Penicillin',
        ]);

        $id = $res->json('allergy.id');
        $this->deleteJson("/doctor/allergies/{$id}")->assertOk();
        $this->assertDatabaseMissing('patient_allergies', ['id' => $id]);
    }

    public function test_doctor_cannot_add_allergy_to_another_hospitals_patient(): void
    {
        $hospitalA = $this->makeHospital('Hospital A');
        $hospitalB = $this->makeHospital('Hospital B');
        $doctorA = $this->makeDoctor($hospitalA);
        $doctorB = $this->makeDoctor($hospitalB);

        // Create patient B while acting as doctor B so it's scoped to hospital B.
        $this->actingAs($doctorB);
        $patientB = Patient::create(['name' => 'Karim', 'gender' => 'male', 'phone' => '01800000002']);

        // Doctor A must not reach patient B — the tenant scope hides the record.
        $this->actingAs($doctorA)
            ->postJson("/doctor/patients/{$patientB->id}/allergies", ['allergen' => 'Sulfa'])
            ->assertNotFound();

        $this->assertDatabaseMissing('patient_allergies', ['patient_id' => $patientB->id]);
    }

    public function test_doctor_cannot_delete_another_hospitals_allergy(): void
    {
        $hospitalA = $this->makeHospital('Hospital A');
        $hospitalB = $this->makeHospital('Hospital B');
        $doctorA = $this->makeDoctor($hospitalA);
        $doctorB = $this->makeDoctor($hospitalB);

        $this->actingAs($doctorB);
        $patientB = Patient::create(['name' => 'Karim', 'gender' => 'male', 'phone' => '01800000003']);
        $allergyB = $patientB->allergies()->create(['allergen' => 'Aspirin']);

        $this->actingAs($doctorA)
            ->deleteJson("/doctor/allergies/{$allergyB->id}")
            ->assertNotFound();

        $this->assertDatabaseHas('patient_allergies', ['id' => $allergyB->id]);
    }
}
