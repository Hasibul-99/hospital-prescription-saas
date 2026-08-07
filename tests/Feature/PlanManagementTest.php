<?php

namespace Tests\Feature;

use App\Models\Hospital;
use App\Models\Plan;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Support\Money;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Vite;
use Tests\TestCase;

class PlanManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Vite::useScriptTagAttributes([])->useStyleTagAttributes([]);
        $this->withoutVite();
    }

    private function superAdmin(): User
    {
        return User::factory()->create(['role' => 'super_admin', 'hospital_id' => null, 'is_active' => true]);
    }

    private function makePlan(array $overrides = []): Plan
    {
        return Plan::create([
            'code' => 'starter-' . uniqid(),
            'name' => 'Starter',
            'price_monthly' => 500,
            'max_doctors' => 3,
            'trial_days' => 14,
            'sort_order' => 1,
            ...$overrides,
        ]);
    }

    public function test_super_admin_can_list_and_create_plans(): void
    {
        $this->actingAs($this->superAdmin())
            ->get('/admin/plans')
            ->assertOk();

        $this->actingAs($this->superAdmin())
            ->post('/admin/plans', [
                'code' => 'starter',
                'name' => 'Starter',
                'name_bn' => 'স্টার্টার',
                'price_monthly' => 750,
                'price_yearly' => 7500,
                'max_doctors' => 3,
                'max_patients_per_month' => 300,
                'max_prescriptions' => null,
                'trial_days' => 14,
                'features' => [['en' => 'Up to 3 doctors', 'bn' => '৩ জন ডাক্তার']],
                'is_public' => true,
                'is_featured' => false,
                'is_active' => true,
                'sort_order' => 5,
            ])
            ->assertRedirect('/admin/plans');

        $plan = Plan::where('code', 'starter')->firstOrFail();

        $this->assertSame('Starter', $plan->name);
        $this->assertNull($plan->max_prescriptions, 'A blank prescription cap must persist as unlimited, not zero.');
        $this->assertSame([['en' => 'Up to 3 doctors', 'bn' => '৩ জন ডাক্তার']], $plan->features);
    }

    public function test_plan_code_cannot_be_changed_after_creation(): void
    {
        $plan = $this->makePlan(['code' => 'locked']);

        $this->actingAs($this->superAdmin())
            ->put("/admin/plans/{$plan->id}", [
                'code' => 'renamed',
                'name' => 'Renamed',
                'price_monthly' => 500,
                'trial_days' => 0,
                'sort_order' => 1,
            ])
            ->assertRedirect('/admin/plans');

        $this->assertSame('locked', $plan->fresh()->code);
        $this->assertSame('Renamed', $plan->fresh()->name);
    }

    public function test_non_super_admins_cannot_touch_plans(): void
    {
        $plan = $this->makePlan();
        $hospital = Hospital::create(['name' => 'H', 'slug' => 'h-' . uniqid(), 'plan_id' => $plan->id]);

        foreach (['hospital_admin', 'doctor', 'receptionist'] as $role) {
            $user = User::factory()->create(['role' => $role, 'hospital_id' => $hospital->id, 'is_active' => true]);

            $this->actingAs($user)->get('/admin/plans')->assertForbidden();
            $this->actingAs($user)->post('/admin/plans', ['name' => 'x'])->assertForbidden();
            $this->actingAs($user)->delete("/admin/plans/{$plan->id}")->assertForbidden();
        }

        // Guests are bounced to login, not 403. actingAs sticks for the whole
        // test, so the guard has to be cleared first.
        $this->app['auth']->forgetGuards();

        $this->get('/admin/plans')->assertRedirect('/login');
    }

    public function test_a_plan_with_hospitals_cannot_be_deleted(): void
    {
        $plan = $this->makePlan();
        Hospital::create(['name' => 'In Use', 'slug' => 'in-use-' . uniqid(), 'plan_id' => $plan->id]);

        $this->actingAs($this->superAdmin())
            ->delete("/admin/plans/{$plan->id}")
            ->assertSessionHas('error');

        $this->assertNotSoftDeleted($plan);
    }

    public function test_an_unused_plan_can_be_deleted(): void
    {
        $plan = $this->makePlan();

        $this->actingAs($this->superAdmin())
            ->delete("/admin/plans/{$plan->id}")
            ->assertSessionHas('success');

        $this->assertSoftDeleted($plan);
    }

    public function test_landing_page_shows_only_public_active_plans_in_order(): void
    {
        // The hospitals migration seeds the four stock plans, so start clean to
        // assert on ordering without them in the way.
        Plan::query()->forceDelete();

        $this->makePlan(['code' => 'b', 'name' => 'Second', 'sort_order' => 2]);
        $this->makePlan(['code' => 'a', 'name' => 'First', 'sort_order' => 1]);
        $this->makePlan(['code' => 'hidden', 'name' => 'Hidden', 'is_public' => false, 'sort_order' => 3]);
        $this->makePlan(['code' => 'off', 'name' => 'Inactive', 'is_active' => false, 'sort_order' => 4]);

        $response = $this->get('/')->assertOk();

        $plans = collect($response->viewData('page')['props']['plans']);

        $this->assertSame(['First', 'Second'], $plans->pluck('name')->all());
    }

    public function test_editing_a_plan_price_busts_the_landing_page_cache(): void
    {
        $plan = $this->makePlan(['code' => 'cached', 'name' => 'Cached', 'price_monthly' => 500]);

        $this->get('/')->assertOk();

        $plan->update(['price_monthly' => 1234]);

        $props = $this->get('/')->viewData('page')['props'];

        $this->assertSame(1234.0, collect($props['plans'])->firstWhere('code', 'cached')['price_monthly']);
    }

    public function test_yearly_discount_is_derived_not_stored(): void
    {
        // 12 x 1000 = 12000 vs 9000 yearly => 25% saving.
        $plan = $this->makePlan(['price_monthly' => 1000, 'price_yearly' => 9000]);
        $this->assertSame(25, $plan->yearlyDiscountPercent());

        // No saving at or above the full-year price.
        $this->assertNull($this->makePlan(['price_monthly' => 1000, 'price_yearly' => 12000])->yearlyDiscountPercent());
        $this->assertNull($this->makePlan(['price_monthly' => 1000, 'price_yearly' => null])->yearlyDiscountPercent());
    }

    public function test_platform_currency_is_settable_and_used_for_plan_prices(): void
    {
        $this->assertSame('BDT', Money::platformCurrency());

        $this->actingAs($this->superAdmin())
            ->put('/admin/settings/currency', ['currency' => 'USD'])
            ->assertSessionHas('success');

        $this->assertSame('USD', PlatformSetting::get(Money::PLATFORM_CURRENCY_KEY));
        $this->assertSame('$ 1,500.00', Money::format(1500));

        $props = $this->get('/')->viewData('page')['props'];
        $this->assertSame('USD', $props['currency']['code']);
    }

    public function test_unsupported_currency_is_rejected(): void
    {
        $this->actingAs($this->superAdmin())
            ->put('/admin/settings/currency', ['currency' => 'XXX'])
            ->assertSessionHasErrors('currency');
    }

    public function test_money_formats_per_currency_and_tolerates_decimal_strings(): void
    {
        $this->assertSame('৳ 1,200.50', Money::format('1200.50', 'BDT'));
        $this->assertSame('$ 1,200.50', Money::format(1200.5, 'USD'));
        $this->assertSame('৳ 0.00', Money::format(null));
        // Unknown codes fall back rather than blowing up on a stale column value.
        $this->assertSame('BDT', Money::config('NOPE')['code']);
    }
}
