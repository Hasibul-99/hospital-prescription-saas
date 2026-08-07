<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Models\DoctorProfile;
use App\Models\Hospital;
use App\Models\User;
use App\Services\AuditLogger;
use App\Support\DoctorLimit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class DoctorController extends Controller
{
    public function index(Request $request)
    {
        $hospitalId = $request->user()->hospital_id;

        $doctors = User::where('hospital_id', $hospitalId)
            ->where('role', 'doctor')
            ->with('doctorProfile')
            ->when($request->filled('search'), function ($q) use ($request) {
                $q->where(function ($q2) use ($request) {
                    $q2->where('name', 'like', "%{$request->search}%")
                        ->orWhere('email', 'like', "%{$request->search}%")
                        ->orWhere('phone', 'like', "%{$request->search}%");
                });
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Hospital/Doctors/Index', [
            'doctors' => $this->paginateFor($doctors),
            'filters' => $request->only(['search']),
            'quota' => DoctorLimit::usage($this->hospital($request)),
        ]);
    }

    public function create(Request $request)
    {
        return Inertia::render('Hospital/Doctors/Form', [
            'doctor' => null,
            'quota' => DoctorLimit::usage($this->hospital($request)),
            'specializations' => config('doctor.specializations'),
        ]);
    }

    public function store(Request $request)
    {
        $hospitalId = $request->user()->hospital_id;

        // Checked before validation runs so the cap is reported even when the
        // rest of the form is also incomplete.
        DoctorLimit::assertCanAdd($this->hospital($request));

        $data = $request->validate([
            'name'            => 'required|string|max:255',
            'email'           => ['required', 'email', Rule::unique('users', 'email')],
            'phone'           => 'nullable|string|max:30',
            'password'        => 'required|string|min:8|confirmed',
            'is_active'       => 'boolean',
            'bmdc_number'     => 'nullable|string|max:50',
            'degrees'         => 'nullable|string|max:500',
            'specialization'  => 'nullable|string|max:255',
            'designation'     => 'nullable|string|max:255',
            'consultation_fee'=> 'nullable|numeric|min:0',
        ]);

        $user = User::create([
            'name'        => $data['name'],
            'email'       => $data['email'],
            'phone'       => $data['phone'] ?? null,
            'password'    => Hash::make($data['password']),
            'role'        => 'doctor',
            'hospital_id' => $hospitalId,
            'is_active'   => $data['is_active'] ?? true,
        ]);

        DoctorProfile::create([
            'user_id'          => $user->id,
            'hospital_id'      => $hospitalId,
            'bmdc_number'      => $data['bmdc_number'] ?? null,
            'degrees'          => $data['degrees'] ?? null,
            'specialization'   => $data['specialization'] ?? null,
            'designation'      => $data['designation'] ?? null,
            'consultation_fee' => $data['consultation_fee'] ?? 0,
        ]);

        return redirect()->route('hospital.doctors.index')
            ->with('success', 'Doctor created successfully.');
    }

    public function edit(Request $request, User $doctor)
    {
        abort_if($doctor->hospital_id !== $request->user()->hospital_id || $doctor->role !== 'doctor', 403);

        $doctor->load('doctorProfile');

        return Inertia::render('Hospital/Doctors/Form', [
            'doctor' => $doctor,
            'quota' => DoctorLimit::usage($this->hospital($request)),
            'specializations' => config('doctor.specializations'),
        ]);
    }

    public function update(Request $request, User $doctor)
    {
        abort_if($doctor->hospital_id !== $request->user()->hospital_id || $doctor->role !== 'doctor', 403);

        $data = $request->validate([
            'name'            => 'required|string|max:255',
            'email'           => ['required', 'email', Rule::unique('users', 'email')->ignore($doctor->id)],
            'phone'           => 'nullable|string|max:30',
            'is_active'       => 'boolean',
            'bmdc_number'     => 'nullable|string|max:50',
            'degrees'         => 'nullable|string|max:500',
            'specialization'  => 'nullable|string|max:255',
            'designation'     => 'nullable|string|max:255',
            'consultation_fee'=> 'nullable|numeric|min:0',
        ]);

        // Reactivating a disabled doctor claims a slot, so it faces the same cap
        // as creating one. Editing an already-active doctor never does.
        if (! $doctor->is_active && ($data['is_active'] ?? false)) {
            DoctorLimit::assertCanAdd($this->hospital($request), 'is_active');
        }

        // Credentials are changed through updatePassword() only, never as a
        // side effect of a profile save.
        $doctor->update([
            'name'      => $data['name'],
            'email'     => $data['email'],
            'phone'     => $data['phone'] ?? null,
            'is_active' => $data['is_active'] ?? $doctor->is_active,
        ]);

        $doctor->doctorProfile()->updateOrCreate(
            ['user_id' => $doctor->id, 'hospital_id' => $doctor->hospital_id],
            [
                'bmdc_number'      => $data['bmdc_number'] ?? null,
                'degrees'          => $data['degrees'] ?? null,
                'specialization'   => $data['specialization'] ?? null,
                'designation'      => $data['designation'] ?? null,
                'consultation_fee' => $data['consultation_fee'] ?? 0,
            ],
        );

        return redirect()->route('hospital.doctors.index')
            ->with('success', 'Doctor updated successfully.');
    }

    /**
     * Hospital-admin password reset for one of their own doctors.
     *
     * Scoped to the acting admin's hospital by the same guard as every other
     * write here — a hospital admin must never be able to reset credentials
     * for an account in another tenant. Audited, and the doctor's remember-me
     * token is rotated so persistent login cookies issued before the reset
     * stop working.
     */
    public function updatePassword(Request $request, User $doctor, AuditLogger $audit)
    {
        abort_if($doctor->hospital_id !== $request->user()->hospital_id || $doctor->role !== 'doctor', 403);

        $data = $request->validate([
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $doctor->forceFill([
            'password' => Hash::make($data['password']),
            'remember_token' => Str::random(60),
        ])->save();

        $audit->record('user.password_reset', $doctor, [
            'reset_by' => $request->user()?->name,
            'role' => $doctor->role,
        ]);

        return back()->with(
            'success',
            "Password updated for {$doctor->name}. Any \"remember me\" sessions have been invalidated — share the new password securely."
        );
    }

    public function destroy(Request $request, User $doctor)
    {
        abort_if($doctor->hospital_id !== $request->user()->hospital_id || $doctor->role !== 'doctor', 403);

        $doctor->delete();

        return redirect()->route('hospital.doctors.index')
            ->with('success', 'Doctor removed.');
    }

    /** The acting user's own hospital, with its plan loaded for limit checks. */
    private function hospital(Request $request): Hospital
    {
        return Hospital::with('plan')->findOrFail($request->user()->hospital_id);
    }
}
