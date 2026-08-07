<?php

namespace Tests\Feature;

use App\Models\Hospital;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Vite;
use Tests\TestCase;

/**
 * The redesigned profile page: identity context, editable phone/language, and
 * an in-page password change.
 */
class ProfilePageTest extends TestCase
{
    use RefreshDatabase;

    private Hospital $hospital;
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

        $this->hospital = Hospital::create([
            'name' => 'City Medical', 'slug' => 'city-' . uniqid(),
            'plan_id' => $plan->id, 'currency' => 'BDT',
            'subscription_status' => 'active', 'is_active' => true,
        ]);

        $this->doctor = User::factory()->create([
            'role' => 'doctor',
            'hospital_id' => $this->hospital->id,
            'is_active' => true,
            'phone' => '+880 1700 000000',
            'preferred_language' => 'en',
            'password' => 'original-password',
        ]);
    }

    public function test_the_page_carries_the_identity_context_it_displays(): void
    {
        $props = $this->actingAs($this->doctor)
            ->get('/profile')
            ->assertOk()
            ->viewData('page')['props'];

        $this->assertSame($this->doctor->name, $props['profile']['name']);
        $this->assertSame('doctor', $props['profile']['role']);
        $this->assertSame('City Medical', $props['profile']['hospital']);
        $this->assertSame('+880 1700 000000', $props['profile']['phone']);
        $this->assertSame([
            ['value' => 'en', 'label' => 'English'],
            ['value' => 'bn', 'label' => 'বাংলা'],
        ], $props['languages']);
    }

    public function test_a_super_admin_has_no_hospital_to_show(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin', 'hospital_id' => null, 'is_active' => true]);

        $props = $this->actingAs($admin)->get('/profile')->assertOk()->viewData('page')['props'];

        $this->assertNull($props['profile']['hospital']);
    }

    public function test_phone_and_language_are_editable(): void
    {
        $this->actingAs($this->doctor)
            ->patch('/profile', [
                'name' => 'Dr. Renamed',
                'email' => $this->doctor->email,
                'phone' => '+880 1999 111222',
                'preferred_language' => 'bn',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $this->doctor->refresh();

        $this->assertSame('Dr. Renamed', $this->doctor->name);
        $this->assertSame('+880 1999 111222', $this->doctor->phone);
        $this->assertSame('bn', $this->doctor->preferred_language);
    }

    public function test_saving_a_language_takes_effect_immediately(): void
    {
        // SetLocale prefers the session value, so a stale entry would make the
        // saved preference look like it had not applied.
        $this->actingAs($this->doctor)
            ->withSession(['locale' => 'en'])
            ->patch('/profile', [
                'name' => $this->doctor->name,
                'email' => $this->doctor->email,
                'preferred_language' => 'bn',
            ])
            ->assertSessionHas('locale', 'bn');
    }

    public function test_an_unknown_language_is_rejected(): void
    {
        $this->actingAs($this->doctor)
            ->patch('/profile', [
                'name' => $this->doctor->name,
                'email' => $this->doctor->email,
                'preferred_language' => 'fr',
            ])
            ->assertSessionHasErrors('preferred_language');
    }

    public function test_omitting_optional_fields_leaves_them_untouched(): void
    {
        // The endpoint must stay tolerant of partial payloads.
        $this->actingAs($this->doctor)
            ->patch('/profile', ['name' => 'Just A Rename', 'email' => $this->doctor->email])
            ->assertSessionHasNoErrors();

        $this->doctor->refresh();

        $this->assertSame('Just A Rename', $this->doctor->name);
        $this->assertSame('+880 1700 000000', $this->doctor->phone);
        $this->assertSame('en', $this->doctor->preferred_language);
    }

    public function test_the_password_can_be_changed_from_the_same_page(): void
    {
        $this->actingAs($this->doctor)
            ->put('/password', [
                'current_password' => 'original-password',
                'password' => 'a-brand-new-password',
                'password_confirmation' => 'a-brand-new-password',
            ])
            ->assertSessionHasNoErrors();

        $this->assertTrue(Hash::check('a-brand-new-password', $this->doctor->fresh()->password));
    }

    public function test_the_current_password_must_be_correct(): void
    {
        $this->actingAs($this->doctor)
            ->put('/password', [
                'current_password' => 'not-my-password',
                'password' => 'a-brand-new-password',
                'password_confirmation' => 'a-brand-new-password',
            ])
            ->assertSessionHasErrors('current_password');

        $this->assertTrue(Hash::check('original-password', $this->doctor->fresh()->password));
    }

    public function test_every_role_can_reach_the_page(): void
    {
        $roles = [
            User::factory()->create(['role' => 'super_admin', 'hospital_id' => null, 'is_active' => true]),
            User::factory()->create(['role' => 'hospital_admin', 'hospital_id' => $this->hospital->id, 'is_active' => true]),
            $this->doctor,
            User::factory()->create(['role' => 'receptionist', 'hospital_id' => $this->hospital->id, 'is_active' => true]),
        ];

        foreach ($roles as $user) {
            $this->actingAs($user)
                ->get('/profile')
                ->assertOk()
                ->assertInertia(fn ($page) => $page->component('Profile/Edit'));
        }
    }

    public function test_guests_are_sent_to_login(): void
    {
        $this->get('/profile')->assertRedirect('/login');
    }
}
