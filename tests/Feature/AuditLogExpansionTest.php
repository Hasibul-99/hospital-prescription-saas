<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuditLogExpansionTest extends TestCase
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
            'password'    => Hash::make('password'),
        ]);
    }

    public function test_login_and_logout_are_audited(): void
    {
        $hospitalId = $this->makeHospital('Hospital A');
        $doctor = $this->makeDoctor($hospitalId);

        $this->post('/login', ['email' => $doctor->email, 'password' => 'password']);

        $this->assertDatabaseHas('audit_logs', [
            'action'  => 'auth.login',
            'user_id' => $doctor->id,
        ]);

        $this->post('/logout');

        $this->assertDatabaseHas('audit_logs', [
            'action'  => 'auth.logout',
            'user_id' => $doctor->id,
        ]);
    }

    public function test_patient_create_update_delete_are_audited(): void
    {
        $hospitalId = $this->makeHospital('Hospital A');
        $doctor = $this->makeDoctor($hospitalId);
        $this->actingAs($doctor);

        $patient = Patient::create([
            'name'   => 'Rahim',
            'gender' => 'male',
            'phone'  => '01700000001',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'action'      => 'patient.create',
            'user_id'     => $doctor->id,
            'hospital_id' => $hospitalId,
            'subject_id'  => $patient->id,
        ]);

        $patient->update(['name' => 'Rahim Uddin']);

        $log = DB::table('audit_logs')->where('action', 'patient.update')->latest('id')->first();
        $this->assertNotNull($log);
        $this->assertContains('name', json_decode($log->meta, true)['fields']);

        $patient->delete();

        $this->assertDatabaseHas('audit_logs', [
            'action'     => 'patient.delete',
            'subject_id' => $patient->id,
        ]);
    }

    public function test_appointment_delete_is_audited(): void
    {
        $hospitalId = $this->makeHospital('Hospital A');
        $doctor = $this->makeDoctor($hospitalId);
        $this->actingAs($doctor);

        $patient = Patient::create([
            'name'   => 'Karim',
            'gender' => 'male',
            'phone'  => '01700000002',
        ]);

        $appt = Appointment::create([
            'doctor_id'        => $doctor->id,
            'patient_id'       => $patient->id,
            'appointment_date' => now()->toDateString(),
            'status'           => 'waiting',
            'type'             => 'new_visit',
            'created_by'       => $doctor->id,
        ]);

        $appt->delete();

        $this->assertDatabaseHas('audit_logs', [
            'action'     => 'appointment.delete',
            'subject_id' => $appt->id,
        ]);
    }
}
