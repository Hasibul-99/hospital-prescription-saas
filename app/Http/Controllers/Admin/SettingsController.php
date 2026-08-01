<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function edit()
    {
        return Inertia::render('Admin/Settings/Index', [
            'platform' => [
                'name' => PlatformSetting::get('platform.name', config('app.name', 'MedixPro')),
                'logo_url' => PlatformSetting::get('platform.logo_url'),
            ],
            'plans' => config('subscription.plans'),
            'maintenance_mode' => app()->isDownForMaintenance(),
        ]);
    }

    public function updatePlatform(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'logo_url' => ['nullable', 'url', 'max:500'],
        ]);

        PlatformSetting::put('platform.name', $data['name']);
        if ($data['logo_url'] ?? null) {
            PlatformSetting::put('platform.logo_url', $data['logo_url']);
        } else {
            PlatformSetting::forget('platform.logo_url');
        }

        return back()->with('success', 'Platform settings saved.');
    }

    public function toggleMaintenance(Request $request)
    {
        $request->validate(['enable' => ['required', 'boolean']]);

        if ($request->boolean('enable')) {
            // Fresh unpredictable secret per activation, shown once. Never a
            // hardcoded value — a static bypass token in source is a backdoor.
            $secret = Str::random(32);
            Artisan::call('down', ['--secret' => $secret]);

            return back()->with('success', "Maintenance mode ON. Bypass URL (copy now, shown once): /{$secret}");
        }

        Artisan::call('up');
        return back()->with('success', 'Maintenance mode OFF.');
    }
}
