<?php

namespace Tests\Feature;

use App\Models\Chamber;
use App\Models\Hospital;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Vite;
use Tests\TestCase;

class HospitalChamberTest extends TestCase
{
    use RefreshDatabase;

    private Hospital $hospital;
    private Hospital $otherHospital;
    private User $admin;
    private User $doctor;
    private User $foreignDoctor;

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
        $this->foreignDoctor = User::factory()->create([
            'role' => 'doctor', 'hospital_id' => $this->otherHospital->id, 'is_active' => true,
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
            'doctor_id' => $this->doctor->id,
            'name' => 'Chamber 1',
            'room_number' => '204',
            'floor' => '2',
            'building' => 'Main',
            'schedule' => [
                'Sun' => ['start' => '09:00', 'end' => '13:00', 'active' => true],
                'Mon' => ['start' => '', 'end' => '', 'active' => false],
            ],
            'daily_slot_cap' => 20,
            'is_active' => true,
            'share_model' => 'full',
            'share_percent_doctor' => null,
            'rent_amount_monthly' => null,
            'share_notes' => '',
            ...$overrides,
        ];
    }

    public function test_the_index_lists_chambers_with_their_doctor(): void
    {
        Chamber::create($this->payload() + ['hospital_id' => $this->hospital->id]);

        $props = $this->actingAs($this->admin)
            ->get('/hospital/chambers')
            ->assertOk()
            ->viewData('page')['props'];

        $this->assertCount(1, $props['chambers']);
        $this->assertSame($this->doctor->name, $props['chambers'][0]['doctor']['name']);
        // The picker must list only this hospital's doctors.
        $this->assertCount(1, $props['doctors']);
        $this->assertSame($this->doctor->id, $props['doctors'][0]['id']);
    }

    public function test_a_chamber_can_be_created_with_a_schedule_and_settlement(): void
    {
        $this->actingAs($this->admin)
            ->post('/hospital/chambers', $this->payload([
                'share_model' => 'split',
                'share_percent_doctor' => 60,
            ]))
            ->assertRedirect('/hospital/chambers');

        $chamber = Chamber::firstOrFail();

        $this->assertSame($this->hospital->id, $chamber->hospital_id, 'hospital_id is filled by the tenant scope');
        $this->assertSame('split', $chamber->share_model);
        $this->assertEquals(60, $chamber->share_percent_doctor);
        $this->assertTrue($chamber->schedule['Sun']['active']);
        $this->assertSame('09:00', $chamber->schedule['Sun']['start']);
    }

    public function test_a_doctor_from_another_hospital_cannot_be_attached(): void
    {
        // A bare `exists:users,id` would have accepted this.
        $this->actingAs($this->admin)
            ->post('/hospital/chambers', $this->payload(['doctor_id' => $this->foreignDoctor->id]))
            ->assertSessionHasErrors('doctor_id');

        $this->assertSame(0, Chamber::count());
    }

    public function test_a_non_doctor_cannot_be_attached(): void
    {
        $receptionist = User::factory()->create([
            'role' => 'receptionist', 'hospital_id' => $this->hospital->id, 'is_active' => true,
        ]);

        $this->actingAs($this->admin)
            ->post('/hospital/chambers', $this->payload(['doctor_id' => $receptionist->id]))
            ->assertSessionHasErrors('doctor_id');
    }

    public function test_a_chamber_can_be_updated_and_reassigned_within_the_hospital(): void
    {
        $chamber = Chamber::create($this->payload() + ['hospital_id' => $this->hospital->id]);
        $colleague = User::factory()->create([
            'role' => 'doctor', 'hospital_id' => $this->hospital->id, 'is_active' => true,
        ]);

        $this->actingAs($this->admin)
            ->put("/hospital/chambers/{$chamber->id}", $this->payload([
                'doctor_id' => $colleague->id,
                'name' => 'Chamber 2',
                'share_model' => 'rent',
                'rent_amount_monthly' => 15000,
            ]))
            ->assertRedirect('/hospital/chambers');

        $chamber->refresh();

        $this->assertSame('Chamber 2', $chamber->name);
        $this->assertSame($colleague->id, $chamber->doctor_id);
        $this->assertEquals(15000, $chamber->rent_amount_monthly);
    }

    public function test_the_edit_page_loads_the_chamber_and_doctor_list(): void
    {
        $chamber = Chamber::create($this->payload() + ['hospital_id' => $this->hospital->id]);

        $props = $this->actingAs($this->admin)
            ->get("/hospital/chambers/{$chamber->id}/edit")
            ->assertOk()
            ->viewData('page')['props'];

        $this->assertSame($chamber->id, $props['chamber']['id']);
        $this->assertSame('09:00', $props['chamber']['schedule']['Sun']['start']);
    }

    public function test_a_chamber_can_be_deleted(): void
    {
        $chamber = Chamber::create($this->payload() + ['hospital_id' => $this->hospital->id]);

        $this->actingAs($this->admin)
            ->delete("/hospital/chambers/{$chamber->id}")
            ->assertRedirect('/hospital/chambers');

        // Chamber does not use SoftDeletes, so the row is really gone.
        $this->assertDatabaseMissing('chambers', ['id' => $chamber->id]);
    }

    public function test_another_hospitals_admin_cannot_reach_a_chamber(): void
    {
        $chamber = Chamber::create($this->payload() + ['hospital_id' => $this->hospital->id]);

        $outsider = User::factory()->create([
            'role' => 'hospital_admin', 'hospital_id' => $this->otherHospital->id, 'is_active' => true,
        ]);

        // The BelongsToHospital scope hides the row, so route-model binding
        // 404s before the policy runs — stronger than 403, which would confirm
        // that a chamber with that id exists.
        $this->actingAs($outsider)->get("/hospital/chambers/{$chamber->id}/edit")->assertNotFound();
        $this->actingAs($outsider)->delete("/hospital/chambers/{$chamber->id}")->assertNotFound();

        $this->assertDatabaseHas('chambers', ['id' => $chamber->id]);
    }

    public function test_required_fields_are_validated(): void
    {
        $this->actingAs($this->admin)
            ->post('/hospital/chambers', ['name' => ''])
            ->assertSessionHasErrors(['doctor_id', 'name']);
    }
}
