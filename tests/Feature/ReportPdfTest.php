<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ReportPdfTest extends TestCase
{
    use RefreshDatabase;

    private function makeHospital(): int
    {
        return DB::table('hospitals')->insertGetId([
            'name'                => 'Hospital A',
            'slug'                => 'hospital-a',
            'subscription_status' => 'active',
            'is_active'           => true,
            'created_at'          => now(),
            'updated_at'          => now(),
        ]);
    }

    public function test_doctor_full_report_pdf_renders(): void
    {
        $hospitalId = $this->makeHospital();
        $doctor = User::factory()->create(['role' => 'doctor', 'hospital_id' => $hospitalId, 'is_active' => true]);

        $res = $this->actingAs($doctor)->get('/doctor/reports/export-pdf?report=full');

        $res->assertOk();
        $this->assertStringContainsString('application/pdf', $res->headers->get('content-type'));
    }

    public function test_hospital_full_report_pdf_renders(): void
    {
        $hospitalId = $this->makeHospital();
        $admin = User::factory()->create(['role' => 'hospital_admin', 'hospital_id' => $hospitalId, 'is_active' => true]);

        $res = $this->actingAs($admin)->get('/hospital/reports/export-pdf?report=full');

        $res->assertOk();
        $this->assertStringContainsString('application/pdf', $res->headers->get('content-type'));
    }

    public function test_admin_full_report_pdf_renders(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin', 'hospital_id' => null]);

        $res = $this->actingAs($superAdmin)->get('/admin/reports/export-pdf?report=full');

        $res->assertOk();
        $this->assertStringContainsString('application/pdf', $res->headers->get('content-type'));
    }
}
