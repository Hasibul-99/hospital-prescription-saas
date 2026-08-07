<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\PlatformSetting;
use App\Support\Money;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
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
            'currency' => [
                'current' => Money::platformCurrency(),
                'supported' => collect(Money::supported())
                    ->map(fn ($c, $code) => ['code' => $code, 'symbol' => $c['symbol'], 'name' => $c['name']])
                    ->values()
                    ->all(),
            ],
            'plan_count' => Plan::active()->count(),
            'maintenance_mode' => app()->isDownForMaintenance(),
        ]);
    }

    /**
     * The base currency plan prices and the public pricing page are quoted in.
     * Hospitals set their own currency separately — this never touches those.
     */
    public function updateCurrency(Request $request)
    {
        $data = $request->validate([
            'currency' => ['required', Rule::in(array_keys(Money::supported()))],
        ]);

        PlatformSetting::put(Money::PLATFORM_CURRENCY_KEY, $data['currency']);

        // Plan prices are quoted in this currency, so the cached landing page
        // payload and revenue report are now stale.
        Cache::forget(Plan::PUBLIC_CACHE_KEY);
        Cache::forget('rpt:platform:revenue');

        return back()->with('success', "Platform currency set to {$data['currency']}. Plan prices are unchanged — only the symbol they display with.");
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
