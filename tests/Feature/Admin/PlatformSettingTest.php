<?php

namespace Tests\Feature\Admin;

use App\Models\PlatformSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class PlatformSettingTest extends TestCase
{
    use RefreshDatabase;

    private function superAdmin(): User
    {
        return User::factory()->create(['role' => 'super_admin', 'hospital_id' => null]);
    }

    public function test_update_persists_to_the_database(): void
    {
        $this->actingAs($this->superAdmin())
            ->put('/admin/settings/platform', [
                'name'     => 'ClinicOS',
                'logo_url' => 'https://example.com/logo.png',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('platform_settings', [
            'key'   => 'platform.name',
            'value' => 'ClinicOS',
        ]);
        $this->assertDatabaseHas('platform_settings', [
            'key'   => 'platform.logo_url',
            'value' => 'https://example.com/logo.png',
        ]);
    }

    public function test_value_survives_a_cache_flush(): void
    {
        PlatformSetting::put('platform.name', 'ClinicOS');

        // Simulate a `cache:clear` / volatile-driver flush. The row must remain
        // authoritative and the value re-read from the database.
        Cache::flush();

        $this->assertSame('ClinicOS', PlatformSetting::get('platform.name'));
    }

    public function test_get_returns_default_when_unset(): void
    {
        $this->assertSame('fallback', PlatformSetting::get('platform.name', 'fallback'));
    }

    public function test_empty_logo_url_forgets_the_setting(): void
    {
        PlatformSetting::put('platform.logo_url', 'https://example.com/old.png');

        $this->actingAs($this->superAdmin())
            ->put('/admin/settings/platform', ['name' => 'ClinicOS', 'logo_url' => '']);

        $this->assertDatabaseMissing('platform_settings', ['key' => 'platform.logo_url']);
    }
}
