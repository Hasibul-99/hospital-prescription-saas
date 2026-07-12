<?php

namespace Tests\Feature\Receptionist;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class DashboardTest extends TestCase
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

    public function test_receptionist_dashboard_renders(): void
    {
        $hospitalId = $this->makeHospital('Hospital A');

        $receptionist = User::factory()->create([
            'role'        => 'receptionist',
            'hospital_id' => $hospitalId,
            'is_active'   => true,
        ]);

        $this->actingAs($receptionist)
            ->get('/receptionist/dashboard')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Receptionist/Dashboard')
                ->where('stats.appointments_today', 0)
                ->has('queue')
            );
    }
}
