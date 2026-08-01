<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Models\DoctorProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
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
        ]);
    }

    public function create()
    {
        return Inertia::render('Hospital/Doctors/Form', ['doctor' => null]);
    }

    public function store(Request $request)
    {
        $hospitalId = $request->user()->hospital_id;

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
            'consultation_fee' => $data['consultation_fee'] ?? null,
        ]);

        return redirect()->route('hospital.doctors.index')
            ->with('success', 'Doctor created successfully.');
    }

    public function edit(Request $request, User $doctor)
    {
        abort_if($doctor->hospital_id !== $request->user()->hospital_id || $doctor->role !== 'doctor', 403);

        $doctor->load('doctorProfile');

        return Inertia::render('Hospital/Doctors/Form', ['doctor' => $doctor]);
    }

    public function update(Request $request, User $doctor)
    {
        abort_if($doctor->hospital_id !== $request->user()->hospital_id || $doctor->role !== 'doctor', 403);

        $data = $request->validate([
            'name'            => 'required|string|max:255',
            'email'           => ['required', 'email', Rule::unique('users', 'email')->ignore($doctor->id)],
            'phone'           => 'nullable|string|max:30',
            'password'        => 'nullable|string|min:8|confirmed',
            'is_active'       => 'boolean',
            'bmdc_number'     => 'nullable|string|max:50',
            'degrees'         => 'nullable|string|max:500',
            'specialization'  => 'nullable|string|max:255',
            'designation'     => 'nullable|string|max:255',
            'consultation_fee'=> 'nullable|numeric|min:0',
        ]);

        $doctor->update(array_filter([
            'name'      => $data['name'],
            'email'     => $data['email'],
            'phone'     => $data['phone'] ?? null,
            'is_active' => $data['is_active'] ?? $doctor->is_active,
            'password'  => isset($data['password']) ? Hash::make($data['password']) : null,
        ], fn ($v) => $v !== null || array_key_exists('phone', $data)));

        $doctor->doctorProfile()->updateOrCreate(
            ['user_id' => $doctor->id, 'hospital_id' => $doctor->hospital_id],
            [
                'bmdc_number'      => $data['bmdc_number'] ?? null,
                'degrees'          => $data['degrees'] ?? null,
                'specialization'   => $data['specialization'] ?? null,
                'designation'      => $data['designation'] ?? null,
                'consultation_fee' => $data['consultation_fee'] ?? null,
            ],
        );

        return redirect()->route('hospital.doctors.index')
            ->with('success', 'Doctor updated successfully.');
    }

    public function destroy(Request $request, User $doctor)
    {
        abort_if($doctor->hospital_id !== $request->user()->hospital_id || $doctor->role !== 'doctor', 403);

        $doctor->delete();

        return redirect()->route('hospital.doctors.index')
            ->with('success', 'Doctor removed.');
    }
}
