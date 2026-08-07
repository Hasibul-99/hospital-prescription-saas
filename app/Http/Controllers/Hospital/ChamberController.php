<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Models\Chamber;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ChamberController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Chamber::class);

        $chambers = Chamber::query()
            ->with('doctor:id,name')
            ->when($request->doctor_id, fn ($q, $id) => $q->where('doctor_id', $id))
            ->orderBy('name')
            ->get();

        $doctors = $this->assignableDoctors($request);

        return Inertia::render('Hospital/Chambers/Index', [
            'chambers' => $chambers,
            'doctors' => $doctors,
            'filters' => $request->only(['doctor_id']),
        ]);
    }

    public function create(Request $request)
    {
        $this->authorize('create', Chamber::class);

        $doctors = $this->assignableDoctors($request);

        return Inertia::render('Hospital/Chambers/Create', [
            'doctors' => $doctors,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Chamber::class);

        $data = $request->validate($this->rules($request));

        Chamber::create($data);

        return redirect()->route('hospital.chambers.index')->with('success', 'Chamber created.');
    }

    public function edit(Request $request, Chamber $chamber)
    {
        $this->authorize('update', $chamber);

        $doctors = $this->assignableDoctors($request);

        return Inertia::render('Hospital/Chambers/Edit', [
            'chamber' => $chamber,
            'doctors' => $doctors,
        ]);
    }

    public function update(Request $request, Chamber $chamber)
    {
        $this->authorize('update', $chamber);

        $data = $request->validate($this->rules($request));

        $chamber->update($data);

        return redirect()->route('hospital.chambers.index')->with('success', 'Chamber updated.');
    }

    /**
     * Doctors selectable for a chamber.
     *
     * The User model is NOT hospital-scoped (super admins are global), so this
     * has to filter by hospital explicitly — otherwise the picker would list
     * every doctor on the platform, leaking other tenants' staff names.
     */
    private function assignableDoctors(Request $request)
    {
        return User::query()
            ->where('hospital_id', $request->user()->hospital_id)
            ->where('role', 'doctor')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    /**
     * `doctor_id` is scoped to an active doctor in the acting admin's own
     * hospital — a bare `exists:users,id` would let a crafted request attach a
     * chamber to a doctor in another tenant.
     */
    private function rules(Request $request): array
    {
        return [
            'doctor_id' => [
                'required',
                Rule::exists('users', 'id')->where(fn ($q) => $q
                    ->where('hospital_id', $request->user()->hospital_id)
                    ->where('role', 'doctor')),
            ],
            'name' => 'required|string|max:100',
            'room_number' => 'nullable|string|max:50',
            'floor' => 'nullable|string|max:50',
            'building' => 'nullable|string|max:100',
            'schedule' => 'nullable|array',
            'schedule.*.start' => 'nullable|string|max:5',
            'schedule.*.end' => 'nullable|string|max:5',
            'schedule.*.active' => 'boolean',
            'daily_slot_cap' => 'nullable|integer|min:1|max:500',
            'is_active' => 'boolean',
            'share_model' => 'nullable|in:full,split,rent',
            'share_percent_doctor' => 'nullable|numeric|min:0|max:100',
            'rent_amount_monthly' => 'nullable|numeric|min:0',
            'share_notes' => 'nullable|string|max:255',
        ];
    }

    public function destroy(Chamber $chamber)
    {
        $this->authorize('delete', $chamber);
        $chamber->delete();

        return redirect()->route('hospital.chambers.index')->with('success', 'Chamber deleted.');
    }
}
