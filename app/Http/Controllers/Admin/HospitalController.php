<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Hospital;
use App\Models\Plan;
use App\Support\DoctorLimit;
use App\Support\Money;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class HospitalController extends Controller
{
    public function index(Request $request)
    {
        $hospitals = Hospital::query()
            ->with('plan:id,code,name')
            ->withCount(['users as doctors_count' => fn ($q) => $q->where('role', 'doctor')])
            ->withCount('patients')
            ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->when($request->plan, fn ($q, $p) => $q->where('plan_id', $p))
            ->when($request->status, fn ($q, $s) => $q->where('subscription_status', $s))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Hospitals/Index', [
            'hospitals' => $this->paginateFor($hospitals),
            'filters' => $request->only(['search', 'plan', 'status']),
            'plans' => $this->planOptions(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Hospitals/Create', [
            'plans' => $this->planOptions(),
            'currencies' => $this->currencyOptions(),
            'defaultCurrency' => Money::platformCurrency(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate($this->rules());

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $plan = Plan::find($validated['plan_id']);

        $validated['created_by'] = auth()->id();
        $validated['subscription_status'] = 'trial';
        // Trial length comes from the plan now, not a hardcoded 30 days.
        $validated['trial_ends_at'] = now()->addDays($plan?->trial_days ?: 30);

        Hospital::create($validated);

        return redirect()->route('admin.hospitals.index')
            ->with('success', 'Hospital created successfully.');
    }

    public function show(Hospital $hospital)
    {
        $hospital->load('plan');
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
            'quota' => DoctorLimit::usage($hospital),
            'currency' => Money::config($hospital->currency),
        ]);
    }

    public function edit(Hospital $hospital)
    {
        $hospital->load('plan');

        return Inertia::render('Admin/Hospitals/Edit', [
            'hospital' => $hospital,
            'plans' => $this->planOptions(),
            'currencies' => $this->currencyOptions(),
            'quota' => DoctorLimit::usage($hospital),
        ]);
    }

    public function update(Request $request, Hospital $hospital)
    {
        $validated = $request->validate($this->rules($hospital));

        $hospital->update($validated);
        $hospital->refresh()->load('plan');

        // A downgrade that leaves the hospital over its new cap is allowed —
        // existing doctors keep working — but the admin should know about it.
        $limit = $hospital->effectiveMaxDoctors();
        $active = $hospital->activeDoctorCount();

        if ($limit !== null && $active > $limit) {
            $excess = $active - $limit;
            $planName = $hospital->plan?->name ?? 'this plan';

            return redirect()->route('admin.hospitals.index')->with(
                'error',
                "Hospital saved, but it now has {$active} active doctors while {$planName} allows {$limit}. "
                . "No new doctors can be added until {$excess} are deactivated or the limit is raised."
            );
        }

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

    /**
     * Shared create/update rules.
     *
     * The two `*_override` limits are nullable on purpose: blank means "follow
     * the plan", which is the normal case. A number is a deliberate exception.
     */
    private function rules(?Hospital $hospital = null): array
    {
        return [
            'name' => 'required|string|max:255',
            'slug' => $hospital
                ? ['required', 'string', 'max:255', Rule::unique('hospitals', 'slug')->ignore($hospital->id)]
                : 'nullable|string|max:255|unique:hospitals,slug',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|string|max:255',
            'plan_id' => ['required', Rule::exists('plans', 'id')->whereNull('deleted_at')],
            'billing_cycle' => ['required', Rule::in(['monthly', 'yearly'])],
            'currency' => ['required', Rule::in(array_keys(Money::supported()))],
            'max_doctors_override' => 'nullable|integer|min:1',
            'max_patients_per_month_override' => 'nullable|integer|min:1',
            ...($hospital ? [
                'subscription_status' => 'required|in:active,trial,expired,suspended',
                'subscription_ends_at' => 'nullable|date',
                'trial_ends_at' => 'nullable|date',
                'is_active' => 'boolean',
            ] : []),
        ];
    }

    /** Assignable plans, with their limits so the form can show what's inherited. */
    private function planOptions()
    {
        return Plan::active()
            ->ordered()
            ->get(['id', 'code', 'name', 'price_monthly', 'price_yearly', 'max_doctors', 'max_patients_per_month', 'max_prescriptions', 'trial_days']);
    }

    private function currencyOptions(): array
    {
        return collect(Money::supported())
            ->map(fn ($c, $code) => ['code' => $code, 'symbol' => $c['symbol'], 'name' => $c['name']])
            ->values()
            ->all();
    }
}
