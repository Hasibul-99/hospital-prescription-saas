<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Guards that UID / serial generation stays correct after the race-safe
 * save() overrides (retry-on-unique for UIDs, row-lock for serials).
 * Single-threaded tests can't reproduce a real race, but they prove the
 * overrides didn't break the sequential generation path.
 */
class UidGenerationTest extends TestCase
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

    public function test_patient_uids_are_sequential_and_unique(): void
    {
        $hospitalId = $this->makeHospital('Hospital A');
        $doctor = $this->makeDoctor($hospitalId);
        $this->actingAs($doctor);

        $uids = [];
        for ($i = 1; $i <= 5; $i++) {
            $patient = Patient::create([
                'name'   => "Patient {$i}",
                'gender' => 'male',
                'phone'  => '017000000' . $i,
            ]);
            $uids[] = $patient->patient_uid;
        }

        $code = 'H' . str_pad((string) $hospitalId, 3, '0', STR_PAD_LEFT);
        $this->assertSame([
            "P-{$code}-00001",
            "P-{$code}-00002",
            "P-{$code}-00003",
            "P-{$code}-00004",
            "P-{$code}-00005",
        ], $uids);
        $this->assertCount(5, array_unique($uids));
    }

    public function test_appointment_serials_are_sequential_per_doctor_day(): void
    {
        $hospitalId = $this->makeHospital('Hospital A');
        $doctor = $this->makeDoctor($hospitalId);
        $this->actingAs($doctor);

        $date = now()->toDateString();
        $serials = [];
        for ($i = 1; $i <= 4; $i++) {
            $patient = Patient::create([
                'name'   => "Patient {$i}",
                'gender' => 'female',
                'phone'  => '018000000' . $i,
            ]);

            $appt = Appointment::create([
                'doctor_id'        => $doctor->id,
                'patient_id'       => $patient->id,
                'appointment_date' => $date,
                'status'           => 'waiting',
                'type'             => 'new_visit',
                'created_by'       => $doctor->id,
            ]);
            $serials[] = $appt->serial_number;
        }

        $this->assertSame([1, 2, 3, 4], $serials);
    }
}
