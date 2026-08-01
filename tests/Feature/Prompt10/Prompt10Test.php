<?php

namespace Tests\Feature\Prompt10;

use App\Models\AuditLog;
use App\Models\DoctorProfile;
use App\Models\Hospital;
use App\Models\User;
use App\Services\DashboardStatsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Vite;
use Tests\TestCase;

class Prompt10Test extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Vite::useScriptTagAttributes([])->useStyleTagAttributes([]);
        $this->withoutVite();
    }

    protected function makeHospital(): Hospital
    {
        return Hospital::create([
            'name' => 'Test Hospital',
            'slug' => 'test-hospital-' . uniqid(),
            'subscription_plan' => 'basic',
            'subscription_status' => 'active',
            'max_doctors' => 5,
            'max_patients_per_month' => 1000,
            'is_active' => true,
        ]);
    }

    protected function makeUser(string $role, ?Hospital $hospital = null): User
    {
        return User::factory()->create([
            'role' => $role,
            'hospital_id' => $hospital?->id,
            'is_active' => true,
        ]);
    }

    public function test_doctor_can_view_reports_index(): void
    {
        $hospital = $this->makeHospital();
        $doctor = $this->makeUser('doctor', $hospital);

        $this->actingAs($doctor)
            ->get('/doctor/reports')
            ->assertOk();
    }

    public function test_doctor_reports_csv_export(): void
    {
        $hospital = $this->makeHospital();
        $doctor = $this->makeUser('doctor', $hospital);

        $this->actingAs($doctor)
            ->get('/doctor/reports/export?report=patient_count')
            ->assertOk()
            ->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
    }

    public function test_doctor_reports_pdf_export(): void
    {
        $hospital = $this->makeHospital();
        $doctor = $this->makeUser('doctor', $hospital);

        $resp = $this->actingAs($doctor)->get('/doctor/reports/export-pdf?report=patient_count');
        $resp->assertOk();
        $this->assertStringContainsString('application/pdf', $resp->headers->get('Content-Type', ''));
    }

    public function test_admin_can_view_reports_index(): void
    {
        $admin = $this->makeUser('super_admin');

        $this->actingAs($admin)
            ->get('/admin/reports')
            ->assertOk();
    }

    public function test_admin_reports_pdf_export(): void
    {
        $admin = $this->makeUser('super_admin');

        $resp = $this->actingAs($admin)->get('/admin/reports/export-pdf?report=subscription_breakdown');
        $resp->assertOk();
        $this->assertStringContainsString('application/pdf', $resp->headers->get('Content-Type', ''));
    }

    public function test_doctor_settings_update_preferences_persists_notification_toggles(): void
    {
        $hospital = $this->makeHospital();
        $doctor = $this->makeUser('doctor', $hospital);

        $this->actingAs($doctor)
            ->put('/doctor/settings/preferences', [
                'preferred_language' => 'bn',
                'notify_followup_reminders' => false,
                'notify_email' => true,
            ])
            ->assertRedirect();

        $profile = DoctorProfile::where('user_id', $doctor->id)->first();
        $this->assertNotNull($profile);
        $this->assertFalse((bool) $profile->notify_followup_reminders);
        $this->assertTrue((bool) $profile->notify_email);
        $this->assertSame('bn', $doctor->fresh()->preferred_language);
    }

    public function test_doctor_upload_image_compresses_to_webp(): void
    {
        Storage::fake('public');

        $hospital = $this->makeHospital();
        $doctor = $this->makeUser('doctor', $hospital);

        $file = UploadedFile::fake()->image('signature.png', 800, 300);

        $this->actingAs($doctor)
            ->post('/doctor/settings/upload', ['kind' => 'signature', 'image' => $file])
            ->assertRedirect();

        $profile = DoctorProfile::where('user_id', $doctor->id)->first();
        $this->assertNotNull($profile->signature_image);
        $this->assertStringEndsWith('.webp', $profile->signature_image);
    }

    public function test_locale_endpoint_persists_user_language(): void
    {
        $hospital = $this->makeHospital();
        $doctor = $this->makeUser('doctor', $hospital);

        $this->actingAs($doctor)
            ->postJson('/locale', ['locale' => 'bn'])
            ->assertOk();

        $this->assertSame('bn', $doctor->fresh()->preferred_language);
    }

    public function test_hospital_audit_logs_index(): void
    {
        $hospital = $this->makeHospital();
        $admin = $this->makeUser('hospital_admin', $hospital);

        AuditLog::create([
            'user_id' => $admin->id,
            'hospital_id' => $hospital->id,
            'action' => 'prescription.create',
            'subject_type' => 'App\\Models\\Prescription',
            'subject_id' => 1,
            'meta' => ['medicines' => 3],
            'ip_address' => '127.0.0.1',
        ]);

        $this->actingAs($admin)
            ->get('/hospital/audit-logs')
            ->assertOk();
    }

    public function test_admin_audit_logs_index(): void
    {
        $admin = $this->makeUser('super_admin');

        $this->actingAs($admin)
            ->get('/admin/audit-logs')
            ->assertOk();
    }

    public function test_dashboard_stats_service_caches_and_invalidates(): void
    {
        Cache::flush();

        $hospital = $this->makeHospital();
        $service = app(DashboardStatsService::class);

        $stats = $service->hospitalStats($hospital->id);
        $this->assertArrayHasKey('doctors', $stats);

        $this->assertTrue(Cache::has("dash:hosp:{$hospital->id}:stats"));

        $service->invalidateForHospital($hospital->id);
        $this->assertFalse(Cache::has("dash:hosp:{$hospital->id}:stats"));
    }

    public function test_send_followup_reminders_command_runs(): void
    {
        $this->artisan('medixpro:send-followup-reminders --days=1')
            ->assertExitCode(0);
    }

    public function test_generate_daily_statements_command_runs(): void
    {
        $this->makeHospital();

        $this->artisan('medixpro:generate-daily-statements')
            ->assertExitCode(0);
    }
}
