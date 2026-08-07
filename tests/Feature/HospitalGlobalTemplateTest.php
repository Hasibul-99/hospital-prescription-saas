<?php

namespace Tests\Feature;

use App\Models\DoctorTemplate;
use App\Models\Hospital;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Vite;
use Tests\TestCase;

class HospitalGlobalTemplateTest extends TestCase
{
    use RefreshDatabase;

    private Hospital $hospital;
    private Hospital $otherHospital;
    private User $admin;
    private User $doctor;

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
            'role' => 'doctor', 'hospital_id' => $this->hospital->id, 'is_active' => true,
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

    private function payload(array $overrides = []): array
    {
        return [
            'disease_name' => 'Acute Gastroenteritis',
            'complaints' => [['complaint_name' => 'Loose motion', 'duration_text' => '3 days']],
            'examinations' => [['examination_name' => 'Temperature', 'finding_value' => '38.5']],
            'medicines' => [[
                'medicine_name' => 'Metronidazole',
                'dose_morning' => 1, 'dose_night' => 1,
                'duration_value' => 5, 'duration_unit' => 'days',
            ]],
            'advices' => [['content' => 'Drink plenty of water']],
            'investigations' => [['content' => 'Stool R/E']],
            ...$overrides,
        ];
    }

    public function test_the_create_form_offers_the_same_presets_as_the_doctor_form(): void
    {
        // These lists had drifted: the global form, whose templates every doctor
        // uses, offered strictly fewer options than a personal template form.
        $hospitalProps = $this->actingAs($this->admin)
            ->get('/hospital/templates/create')
            ->assertOk()
            ->viewData('page')['props'];

        $doctorProps = $this->actingAs($this->doctor)
            ->get('/doctor/templates/create')
            ->assertOk()
            ->viewData('page')['props'];

        foreach (['duration_presets', 'advice_suggestions', 'instruction_presets', 'duration_day_presets'] as $key) {
            $this->assertSame($doctorProps[$key], $hospitalProps[$key], "{$key} differs between the two forms");
            $this->assertSame(config("prescription.{$key}"), $hospitalProps[$key]);
        }
    }

    public function test_a_hospital_admin_can_create_a_global_template(): void
    {
        $this->actingAs($this->admin)
            ->post('/hospital/templates', $this->payload())
            ->assertRedirect('/hospital/templates');

        $template = DoctorTemplate::withoutGlobalScopes()->firstOrFail();

        $this->assertTrue((bool) $template->is_global);
        $this->assertNull($template->doctor_id, 'a global template belongs to no single doctor');
        $this->assertSame($this->hospital->id, $template->hospital_id);
        $this->assertCount(1, $template->medicines);
        $this->assertSame('Metronidazole', $template->medicines[0]['medicine_name']);
    }

    public function test_a_duplicate_global_name_is_rejected(): void
    {
        $this->actingAs($this->admin)->post('/hospital/templates', $this->payload());

        $this->actingAs($this->admin)
            ->post('/hospital/templates', $this->payload())
            ->assertSessionHasErrors('disease_name');

        $this->assertSame(1, DoctorTemplate::withoutGlobalScopes()->count());
    }

    public function test_another_hospital_may_reuse_the_same_name(): void
    {
        // Uniqueness is scoped per hospital, not platform-wide.
        $this->actingAs($this->admin)->post('/hospital/templates', $this->payload());

        $rivalAdmin = User::factory()->create([
            'role' => 'hospital_admin', 'hospital_id' => $this->otherHospital->id, 'is_active' => true,
        ]);

        $this->actingAs($rivalAdmin)
            ->post('/hospital/templates', $this->payload())
            ->assertSessionHasNoErrors();

        $this->assertSame(2, DoctorTemplate::withoutGlobalScopes()->count());
    }

    public function test_a_doctors_personal_template_may_share_a_global_name(): void
    {
        // Different scopes — a personal "Fever" alongside a global "Fever" is fine.
        $this->actingAs($this->admin)->post('/hospital/templates', $this->payload());

        $this->actingAs($this->doctor)
            ->post('/doctor/templates', $this->payload())
            ->assertSessionHasNoErrors();

        $this->assertSame(2, DoctorTemplate::withoutGlobalScopes()->count());
    }

    public function test_renaming_a_template_to_itself_is_allowed(): void
    {
        $this->actingAs($this->admin)->post('/hospital/templates', $this->payload());
        $template = DoctorTemplate::withoutGlobalScopes()->firstOrFail();

        $this->actingAs($this->admin)
            ->put("/hospital/templates/{$template->id}", $this->payload(['advices' => [['content' => 'Take rest']]]))
            ->assertSessionHasNoErrors()
            ->assertRedirect('/hospital/templates');

        $this->assertSame('Take rest', $template->fresh()->advices[0]['content']);
    }

    public function test_advice_and_investigation_content_is_validated(): void
    {
        $this->actingAs($this->admin)
            ->post('/hospital/templates', $this->payload(['advices' => [['content' => str_repeat('a', 501)]]]))
            ->assertSessionHasErrors('advices.0.content');

        $this->actingAs($this->admin)
            ->post('/hospital/templates', $this->payload(['advices' => [['content' => '']]]))
            ->assertSessionHasErrors('advices.0.content');
    }

    public function test_a_doctor_cannot_create_a_global_template(): void
    {
        $this->actingAs($this->doctor)->get('/hospital/templates/create')->assertForbidden();
        $this->actingAs($this->doctor)->post('/hospital/templates', $this->payload())->assertForbidden();
    }

    public function test_an_admin_cannot_edit_another_hospitals_template(): void
    {
        $this->actingAs($this->admin)->post('/hospital/templates', $this->payload());
        $template = DoctorTemplate::withoutGlobalScopes()->firstOrFail();

        $rivalAdmin = User::factory()->create([
            'role' => 'hospital_admin', 'hospital_id' => $this->otherHospital->id, 'is_active' => true,
        ]);

        $this->actingAs($rivalAdmin)->get("/hospital/templates/{$template->id}/edit")->assertNotFound();
        $this->actingAs($rivalAdmin)->delete("/hospital/templates/{$template->id}")->assertNotFound();
    }
}
