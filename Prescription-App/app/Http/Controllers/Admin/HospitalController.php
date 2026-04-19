<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Hospital;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class HospitalController extends Controller
{
    public function index(Request $request)
    {
        $hospitals = Hospital::query()
            ->withCount(['users as doctors_count' => fn ($q) => $q->where('role', 'doctor')])
            ->withCount('patients')
            ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->when($request->plan, fn ($q, $p) => $q->where('subscription_plan', $p))
            ->when($request->status, fn ($q, $s) => $q->where('subscription_status', $s))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Hospitals/Index', [
            'hospitals' => $hospitals,
            'filters' => $request->only(['search', 'plan', 'status']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Hospitals/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:hospitals,slug',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|string|max:255',
            'subscription_plan' => 'required|in:free,basic,premium,enterprise',
            'max_doctors' => 'required|integer|min:1',
            'max_patients_per_month' => 'required|integer|min:1',
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $validated['created_by'] = auth()->id();
        $validated['subscription_status'] = 'trial';
        $validated['trial_ends_at'] = now()->addDays(30);

        Hospital::create($validated);

        return redirect()->route('admin.hospitals.index')
            ->with('success', 'Hospital created successfully.');
    }

    public function show(Hospital $hospital)
    {
        $hospital->loadCount([
            'users as doctors_count' => fn ($q) => $q->where('role', 'doctor'),
            'patients',
            'prescriptions',
        ]);

        $doctors = $hospital->users()
            ->where('role', 'doctor')
            ->with('doctorProfile')
            ->get();

        return Inertia::render('Admin/Hospitals/Show', [
            'hospital' => $hospital,
            'doctors' => $doctors,
        ]);
    }

    public function edit(Hospital $hospital)
    {
        return Inertia::render('Admin/Hospitals/Edit', [
            'hospital' => $hospital,
        ]);
    }

    public function update(Request $request, Hospital $hospital)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => ['required', 'string', 'max:255', Rule::unique('hospitals', 'slug')->ignore($hospital->id)],
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|string|max:255',
            'subscription_plan' => 'required|in:free,basic,premium,enterprise',
            'subscription_status' => 'required|in:active,trial,expired,suspended',
            'max_doctors' => 'required|integer|min:1',
            'max_patients_per_month' => 'required|integer|min:1',
            'is_active' => 'boolean',
        ]);

        $hospital->update($validated);

        return redirect()->route('admin.hospitals.index')
            ->with('success', 'Hospital updated successfully.');
    }

    public function destroy(Hospital $hospital)
    {
        $hospital->delete();

        return redirect()->route('admin.hospitals.index')
            ->with('success', 'Hospital deleted successfully.');
    }

    public function toggleStatus(Hospital $hospital)
    {
        $hospital->update(['is_active' => !$hospital->is_active]);

        $status = $hospital->is_active ? 'activated' : 'suspended';

        return back()->with('success', "Hospital {$status} successfully.");
    }
}
