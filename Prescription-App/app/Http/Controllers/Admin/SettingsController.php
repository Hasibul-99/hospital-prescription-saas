<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function edit()
    {
        return Inertia::render('Admin/Settings/Index', [
            'platform' => [
                'name' => Cache::get('platform.name', config('app.name', 'MedixPro')),
                'logo_url' => Cache::get('platform.logo_url'),
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

        Cache::forever('platform.name', $data['name']);
        if ($data['logo_url'] ?? null) {
            Cache::forever('platform.logo_url', $data['logo_url']);
        } else {
            Cache::forget('platform.logo_url');
        }

        return back()->with('success', 'Platform settings saved.');
    }

    public function toggleMaintenance(Request $request)
    {
        $request->validate(['enable' => ['required', 'boolean']]);

        if ($request->boolean('enable')) {
            Artisan::call('down', ['--secret' => 'medixpro-bypass']);
            return back()->with('success', 'Maintenance mode ON. Bypass: /medixpro-bypass');
        }

        Artisan::call('up');
        return back()->with('success', 'Maintenance mode OFF.');
    }
}
