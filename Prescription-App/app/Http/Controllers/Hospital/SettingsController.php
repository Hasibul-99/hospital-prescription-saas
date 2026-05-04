<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Models\Hospital;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function edit(Request $request)
    {
        $user = $request->user();
        $hospital = Hospital::findOrFail($user->hospital_id);

        return Inertia::render('Hospital/Settings/Index', [
            'hospital' => [
                'id' => $hospital->id,
                'name' => $hospital->name,
                'slug' => $hospital->slug,
                'logo' => $hospital->logo,
                'address' => $hospital->address,
                'phone' => $hospital->phone,
                'email' => $hospital->email,
                'website' => $hospital->website,
                'subscription_plan' => $hospital->subscription_plan,
                'subscription_status' => $hospital->subscription_status,
                'subscription_ends_at' => $hospital->subscription_ends_at?->toDateString(),
                'max_doctors' => $hospital->max_doctors,
                'max_patients_per_month' => $hospital->max_patients_per_month,
                'settings' => $hospital->settings ?? [],
            ],
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $hospital = Hospital::findOrFail($user->hospital_id);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'logo' => ['nullable', 'string', 'max:500'],
            'address' => ['nullable', 'string', 'max:1000'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'website' => ['nullable', 'url', 'max:255'],
            'default_language' => ['nullable', Rule::in(['en', 'bn'])],
            'working_hours' => ['nullable', 'string', 'max:500'],
        ]);

        $settings = $hospital->settings ?? [];
        if (array_key_exists('default_language', $data)) {
            $settings['default_language'] = $data['default_language'];
        }
        if (array_key_exists('working_hours', $data)) {
            $settings['working_hours'] = $data['working_hours'];
        }

        $hospital->update([
            'name' => $data['name'],
            'logo' => $data['logo'] ?? null,
            'address' => $data['address'] ?? null,
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'website' => $data['website'] ?? null,
            'settings' => $settings,
        ]);

        return back()->with('success', 'Hospital settings updated.');
    }
}
