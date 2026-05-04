<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\DoctorProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function edit(Request $request)
    {
        $user = $request->user();
        $profile = DoctorProfile::firstOrCreate(
            ['user_id' => $user->id],
            ['hospital_id' => $user->hospital_id, 'consultation_fee' => 0, 'follow_up_fee' => 0],
        );

        return Inertia::render('Doctor/Settings/Index', [
            'profile' => $profile,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'preferred_language' => $user->preferred_language ?? 'en',
            ],
        ]);
    }

    public function updateProfile(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'bmdc_number' => ['nullable', 'string', 'max:50'],
            'degrees' => ['nullable', 'string', 'max:255'],
            'specialization' => ['nullable', 'string', 'max:255'],
            'designation' => ['nullable', 'string', 'max:255'],
            'consultation_fee' => ['nullable', 'numeric', 'min:0'],
            'follow_up_fee' => ['nullable', 'numeric', 'min:0'],
            'prescription_header_text' => ['nullable', 'string', 'max:1000'],
            'prescription_footer_text' => ['nullable', 'string', 'max:1000'],
        ]);

        $user = $request->user();
        $user->update(['name' => $data['name'], 'phone' => $data['phone'] ?? null]);

        DoctorProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'hospital_id' => $user->hospital_id,
                'bmdc_number' => $data['bmdc_number'] ?? null,
                'degrees' => $data['degrees'] ?? null,
                'specialization' => $data['specialization'] ?? null,
                'designation' => $data['designation'] ?? null,
                'consultation_fee' => $data['consultation_fee'] ?? 0,
                'follow_up_fee' => $data['follow_up_fee'] ?? 0,
                'prescription_header_text' => $data['prescription_header_text'] ?? null,
                'prescription_footer_text' => $data['prescription_footer_text'] ?? null,
            ],
        );

        return back()->with('success', 'Profile updated.');
    }

    public function updatePreferences(Request $request)
    {
        $data = $request->validate([
            'default_prescription_language' => ['nullable', Rule::in(['en', 'bn', 'both'])],
            'preferred_language' => ['nullable', Rule::in(['en', 'bn'])],
            'print_paper_size' => ['nullable', Rule::in(['A4', 'Letter'])],
            'print_show_header' => ['nullable', 'boolean'],
            'print_show_footer' => ['nullable', 'boolean'],
            'print_show_logo' => ['nullable', 'boolean'],
            'print_header_mode' => ['nullable', Rule::in(['image', 'text', 'none'])],
            'print_footer_mode' => ['nullable', Rule::in(['image', 'signature', 'none'])],
            'print_font_size' => ['nullable', Rule::in(['small', 'medium', 'large'])],
            'print_margin_top' => ['nullable', 'integer', 'min:0', 'max:50'],
            'print_margin_bottom' => ['nullable', 'integer', 'min:0', 'max:50'],
            'print_margin_left' => ['nullable', 'integer', 'min:0', 'max:50'],
            'print_margin_right' => ['nullable', 'integer', 'min:0', 'max:50'],
        ]);

        $user = $request->user();

        if (isset($data['preferred_language'])) {
            $user->update(['preferred_language' => $data['preferred_language']]);
        }

        $profileFields = collect($data)
            ->except(['preferred_language'])
            ->filter(fn ($v) => $v !== null)
            ->toArray();

        if (! empty($profileFields)) {
            DoctorProfile::updateOrCreate(
                ['user_id' => $user->id],
                ['hospital_id' => $user->hospital_id, ...$profileFields],
            );
        }

        return back()->with('success', 'Preferences updated.');
    }

    public function updatePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => 'Current password is incorrect.',
            ]);
        }

        $user->update(['password' => Hash::make($data['password'])]);

        return back()->with('success', 'Password changed.');
    }

    public function uploadImage(Request $request)
    {
        $request->validate([
            'kind' => ['required', Rule::in(['header', 'footer', 'signature', 'avatar'])],
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $kind = $request->input('kind');
        $user = $request->user();

        $path = $request->file('image')->store("doctors/{$user->id}/{$kind}", 'public');
        $url = Storage::url($path);

        if ($kind === 'avatar') {
            $user->update(['avatar' => $url]);
        } else {
            $field = match ($kind) {
                'header' => 'prescription_header_image',
                'footer' => 'prescription_footer_image',
                'signature' => 'signature_image',
            };

            DoctorProfile::updateOrCreate(
                ['user_id' => $user->id],
                ['hospital_id' => $user->hospital_id, $field => $url],
            );
        }

        return back()->with('success', "Uploaded {$kind} image.");
    }
}
