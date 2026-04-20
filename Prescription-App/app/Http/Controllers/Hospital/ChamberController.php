<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Models\Chamber;
use App\Models\User;
use Illuminate\Http\Request;
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

        $doctors = User::query()
            ->where('role', 'doctor')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Hospital/Chambers/Index', [
            'chambers' => $chambers,
            'doctors' => $doctors,
            'filters' => $request->only(['doctor_id']),
        ]);
    }

    public function create()
    {
        $this->authorize('create', Chamber::class);

        $doctors = User::query()
            ->where('role', 'doctor')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Hospital/Chambers/Create', [
            'doctors' => $doctors,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Chamber::class);

        $data = $request->validate([
            'doctor_id' => 'required|exists:users,id',
            'name' => 'required|string|max:100',
            'room_number' => 'nullable|string|max:50',
            'floor' => 'nullable|string|max:50',
            'building' => 'nullable|string|max:100',
            'schedule' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        Chamber::create($data);

        return redirect()->route('hospital.chambers.index')->with('success', 'Chamber created.');
    }

    public function edit(Chamber $chamber)
    {
        $this->authorize('update', $chamber);

        $doctors = User::query()
            ->where('role', 'doctor')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Hospital/Chambers/Edit', [
            'chamber' => $chamber,
            'doctors' => $doctors,
        ]);
    }

    public function update(Request $request, Chamber $chamber)
    {
        $this->authorize('update', $chamber);

        $data = $request->validate([
            'doctor_id' => 'required|exists:users,id',
            'name' => 'required|string|max:100',
            'room_number' => 'nullable|string|max:50',
            'floor' => 'nullable|string|max:50',
            'building' => 'nullable|string|max:100',
            'schedule' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $chamber->update($data);

        return redirect()->route('hospital.chambers.index')->with('success', 'Chamber updated.');
    }

    public function destroy(Chamber $chamber)
    {
        $this->authorize('delete', $chamber);
        $chamber->delete();

        return redirect()->route('hospital.chambers.index')->with('success', 'Chamber deleted.');
    }
}
