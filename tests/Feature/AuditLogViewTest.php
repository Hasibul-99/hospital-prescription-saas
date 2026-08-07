<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Hospital;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Vite;
use Tests\TestCase;

class AuditLogViewTest extends TestCase
{
    use RefreshDatabase;

    private Hospital $hospital;
    private User $superAdmin;
    private User $doctor;

    protected function setUp(): void
    {
        parent::setUp();
        Vite::useScriptTagAttributes([])->useStyleTagAttributes([]);
        $this->withoutVite();

        $plan = Plan::firstOrCreate(['code' => 'basic'], ['name' => 'Basic', 'price_monthly' => 1000]);

        $this->hospital = Hospital::create([
            'name' => 'City Medical', 'slug' => 'city-' . uniqid(),
            'plan_id' => $plan->id, 'currency' => 'BDT', 'subscription_status' => 'active', 'is_active' => true,
        ]);

        $this->superAdmin = User::factory()->create(['role' => 'super_admin', 'hospital_id' => null, 'is_active' => true]);
        $this->doctor = User::factory()->create(['role' => 'doctor', 'hospital_id' => $this->hospital->id, 'is_active' => true]);

        AuditLog::create([
            'user_id' => $this->doctor->id, 'hospital_id' => $this->hospital->id,
            'action' => 'prescription.create', 'subject_type' => 'App\Models\Prescription', 'subject_id' => 42,
            'meta' => ['medicines' => 2], 'ip_address' => '10.0.0.1',
        ]);
        AuditLog::create([
            'user_id' => $this->doctor->id, 'hospital_id' => $this->hospital->id,
            'action' => 'prescription.update', 'subject_type' => 'App\Models\Prescription', 'subject_id' => 42,
            'meta' => ['medicines' => 3], 'ip_address' => '10.0.0.1',
        ]);
        // Platform-level event: no hospital, must not break the tenant column.
        AuditLog::create([
            'user_id' => $this->superAdmin->id, 'hospital_id' => null,
            'action' => 'auth.login', 'subject_type' => 'App\Models\User', 'subject_id' => $this->superAdmin->id,
            'meta' => ['role' => 'super_admin'], 'ip_address' => '10.0.0.2',
        ]);
    }

    private function props(string $uri = '/admin/audit-logs'): array
    {
        return $this->actingAs($this->superAdmin)->get($uri)->assertOk()->viewData('page')['props'];
    }

    public function test_it_lists_events_with_resolved_user_and_hospital(): void
    {
        $props = $this->props();

        $this->assertSame(3, $props['stats']['matching']);
        $this->assertSame(2, $props['stats']['actors']);

        $row = collect($props['logs']['data'])->firstWhere('action', 'prescription.create');

        // Names, not bare foreign keys — that was the whole point of the rework.
        $this->assertSame($this->doctor->name, $row['user']['name']);
        $this->assertSame('City Medical', $row['hospital']['name']);
        $this->assertSame('Prescription', $row['subject_type'], 'subject_type is basenamed, not FQCN');
    }

    public function test_most_common_action_reports_the_actual_leader(): void
    {
        // Baseline is a three-way tie at 1, so give one action a clear lead.
        foreach (range(1, 3) as $i) {
            AuditLog::create([
                'user_id' => $this->doctor->id, 'hospital_id' => $this->hospital->id,
                'action' => 'patient.create', 'subject_type' => 'App\Models\Patient', 'subject_id' => $i,
                'meta' => [], 'ip_address' => '10.0.0.1',
            ]);
        }

        $stats = $this->props()['stats'];

        $this->assertSame('patient.create', $stats['top_action']);
        $this->assertSame(3, $stats['top_action_count']);
    }

    public function test_a_tie_for_most_common_resolves_deterministically(): void
    {
        // All three baseline actions sit at 1; the secondary sort must pick the
        // alphabetically first one rather than drifting between requests.
        $this->assertSame('auth.login', $this->props()['stats']['top_action']);
        $this->assertSame('auth.login', $this->props()['stats']['top_action']);
    }

    public function test_platform_events_have_a_null_hospital(): void
    {
        $row = collect($this->props()['logs']['data'])->firstWhere('action', 'auth.login');

        $this->assertNull($row['hospital']);
    }

    public function test_action_filter_matches_a_whole_resource_group_or_one_exact_key(): void
    {
        $this->assertSame(1, $this->props('/admin/audit-logs?action=prescription.create')['stats']['matching']);
        $this->assertSame(2, $this->props('/admin/audit-logs?action=prescription')['stats']['matching']);
    }

    public function test_search_matches_user_name_ip_and_numeric_subject_id(): void
    {
        $this->assertSame(2, $this->props('/admin/audit-logs?search=' . urlencode($this->doctor->name))['stats']['matching']);
        $this->assertSame(1, $this->props('/admin/audit-logs?search=10.0.0.2')['stats']['matching']);
        $this->assertSame(2, $this->props('/admin/audit-logs?search=42')['stats']['matching']);
    }

    public function test_user_hospital_and_date_filters_narrow_the_list(): void
    {
        $this->assertSame(2, $this->props('/admin/audit-logs?user_id=' . $this->doctor->id)['stats']['matching']);
        $this->assertSame(2, $this->props('/admin/audit-logs?hospital_id=' . $this->hospital->id)['stats']['matching']);
        $this->assertSame(0, $this->props('/admin/audit-logs?date_from=1990-01-01&date_to=1990-01-02')['stats']['matching']);
        $this->assertSame(3, $this->props('/admin/audit-logs?date_from=' . today()->toDateString())['stats']['matching']);
    }

    public function test_filter_options_carry_counts_and_only_list_users_that_appear(): void
    {
        $props = $this->props();

        $this->assertEqualsCanonicalizing(
            [['value' => 'auth.login', 'group' => 'auth', 'count' => 1],
             ['value' => 'prescription.create', 'group' => 'prescription', 'count' => 1],
             ['value' => 'prescription.update', 'group' => 'prescription', 'count' => 1]],
            $props['actions'],
        );
        $this->assertCount(2, $props['users']);
        $this->assertCount(1, $props['hospitals']);
    }

    public function test_csv_export_respects_the_active_filters(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->get('/admin/audit-logs/export?action=prescription.create')
            ->assertOk();

        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));

        $csv = $response->streamedContent();

        $this->assertStringContainsString('When,User,Role,Action', $csv);
        $this->assertStringContainsString('prescription.create', $csv);
        $this->assertStringNotContainsString('auth.login', $csv);
    }

    public function test_only_super_admins_can_read_the_audit_log(): void
    {
        $this->actingAs($this->doctor)->get('/admin/audit-logs')->assertForbidden();
        $this->actingAs($this->doctor)->get('/admin/audit-logs/export')->assertForbidden();
    }
}
