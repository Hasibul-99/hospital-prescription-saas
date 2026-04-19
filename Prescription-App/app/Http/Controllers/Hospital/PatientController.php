<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PatientController extends Controller
{
    public function index(Request $request)
    {
        $patients = Patient::query()
            ->withCount('appointments', 'prescriptions')
            ->withMax('appointments as last_visit', 'appointment_date')
            ->when($request->search, function ($q, $s) {
                $q->where(function ($q) use ($s) {
                    $q->where('name', 'like', "%{$s}%")
                      ->orWhere('phone', 'like', "%{$s}%")
                      ->orWhere('patient_uid', $s);
                });
            })
            ->when($request->gender, fn ($q, $g) => $q->where('gender', $g))
            ->when($request->blood_group, fn ($q, $bg) => $q->where('blood_group', $bg))
            ->when($request->date_from, fn ($q, $d) => $q->where('created_at', '>=', $d))
            ->when($request->date_to, fn ($q, $d) => $q->where('created_at', '<=', $d))
            ->when($request->sort_by, function ($q, $sort) use ($request) {
                $direction = $request->sort_dir === 'asc' ? 'asc' : 'desc';
                $q->orderBy($sort, $direction);
            }, fn ($q) => $q->latest())
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Hospital/Patients/Index', [
            'patients' => $patients,
            'filters' => $request->only(['search', 'gender', 'blood_group', 'date_from', 'date_to', 'sort_by', 'sort_dir']),
        ]);
    }

    public function show(Patient $patient)
    {
        $patient->load([
            'appointments' => fn ($q) => $q->with('doctor:id,name')->latest('appointment_date'),
            'prescriptions' => fn ($q) => $q->with('doctor:id,name')->latest('date'),
        ]);

        return Inertia::render('Hospital/Patients/Show', [
            'patient' => $patient,
        ]);
    }

    public function create()
    {
        return Inertia::render('Hospital/Patients/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'age_years' => 'nullable|integer|min:0|max:150',
            'age_months' => 'nullable|integer|min:0|max:11',
            'age_days' => 'nullable|integer|min:0|max:30',
            'date_of_birth' => 'nullable|date|before:today',
            'gender' => 'required|in:male,female,other',
            'phone' => [
                'required',
                'string',
                'max:20',
                Rule::unique('patients')->where('hospital_id', auth()->user()->hospital_id),
            ],
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'blood_group' => 'nullable|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
            'profile_image' => 'nullable|image|max:2048',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'notes' => 'nullable|string',
        ]);

        if ($request->hasFile('profile_image')) {
            $validated['profile_image'] = $request->file('profile_image')->store('patients', 'public');
        }

        if (!empty($validated['date_of_birth']) && empty($validated['age_years'])) {
            $dob = \Carbon\Carbon::parse($validated['date_of_birth']);
            $now = now();
            $validated['age_years'] = $dob->diffInYears($now);
            $validated['age_months'] = $dob->copy()->addYears($validated['age_years'])->diffInMonths($now);
            $validated['age_days'] = $dob->copy()->addYears($validated['age_years'])->addMonths($validated['age_months'])->diffInDays($now);
        }

        $patient = Patient::create($validated);

        return redirect()->route('hospital.patients.show', $patient)
            ->with('success', 'Patient registered successfully.');
    }

    public function edit(Patient $patient)
    {
        return Inertia::render('Hospital/Patients/Edit', [
            'patient' => $patient,
        ]);
    }

    public function update(Request $request, Patient $patient)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'age_years' => 'nullable|integer|min:0|max:150',
            'age_months' => 'nullable|integer|min:0|max:11',
            'age_days' => 'nullable|integer|min:0|max:30',
            'date_of_birth' => 'nullable|date|before:today',
            'gender' => 'required|in:male,female,other',
            'phone' => [
                'required',
                'string',
                'max:20',
                Rule::unique('patients')->where('hospital_id', auth()->user()->hospital_id)->ignore($patient->id),
            ],
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'blood_group' => 'nullable|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
            'profile_image' => 'nullable|image|max:2048',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        if ($request->hasFile('profile_image')) {
            $validated['profile_image'] = $request->file('profile_image')->store('patients', 'public');
        }

        if (!empty($validated['date_of_birth']) && empty($validated['age_years'])) {
            $dob = \Carbon\Carbon::parse($validated['date_of_birth']);
            $now = now();
            $validated['age_years'] = $dob->diffInYears($now);
            $validated['age_months'] = $dob->copy()->addYears($validated['age_years'])->diffInMonths($now);
            $validated['age_days'] = $dob->copy()->addYears($validated['age_years'])->addMonths($validated['age_months'])->diffInDays($now);
        }

        $patient->update($validated);

        return redirect()->route('hospital.patients.show', $patient)
            ->with('success', 'Patient updated successfully.');
    }

    public function destroy(Patient $patient)
    {
        $patient->delete();

        return redirect()->route('hospital.patients.index')
            ->with('success', 'Patient deleted successfully.');
    }
}
