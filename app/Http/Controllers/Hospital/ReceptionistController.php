<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ReceptionistController extends Controller
{
    public function index(Request $request)
    {
        $hospitalId = $request->user()->hospital_id;

        $receptionists = User::where('hospital_id', $hospitalId)
            ->where('role', 'receptionist')
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

        return Inertia::render('Hospital/Receptionists/Index', [
            'receptionists' => $this->paginateFor($receptionists),
            'filters'       => $request->only(['search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Hospital/Receptionists/Form', ['receptionist' => null]);
    }

    public function store(Request $request)
    {
        $hospitalId = $request->user()->hospital_id;

        $data = $request->validate([
            'name'      => 'required|string|max:255',
            'email'     => ['required', 'email', Rule::unique('users', 'email')],
            'phone'     => 'nullable|string|max:30',
            'password'  => 'required|string|min:8|confirmed',
            'is_active' => 'boolean',
        ]);

        User::create([
            'name'        => $data['name'],
            'email'       => $data['email'],
            'phone'       => $data['phone'] ?? null,
            'password'    => Hash::make($data['password']),
            'role'        => 'receptionist',
            'hospital_id' => $hospitalId,
            'is_active'   => $data['is_active'] ?? true,
        ]);

        return redirect()->route('hospital.receptionists.index')
            ->with('success', 'Receptionist created successfully.');
    }

    public function edit(Request $request, User $receptionist)
    {
        abort_if($receptionist->hospital_id !== $request->user()->hospital_id || $receptionist->role !== 'receptionist', 403);

        return Inertia::render('Hospital/Receptionists/Form', ['receptionist' => $receptionist]);
    }

    public function update(Request $request, User $receptionist)
    {
        abort_if($receptionist->hospital_id !== $request->user()->hospital_id || $receptionist->role !== 'receptionist', 403);

        $data = $request->validate([
            'name'      => 'required|string|max:255',
            'email'     => ['required', 'email', Rule::unique('users', 'email')->ignore($receptionist->id)],
            'phone'     => 'nullable|string|max:30',
            'password'  => 'nullable|string|min:8|confirmed',
            'is_active' => 'boolean',
        ]);

        $updates = [
            'name'      => $data['name'],
            'email'     => $data['email'],
            'phone'     => $data['phone'] ?? null,
            'is_active' => $data['is_active'] ?? $receptionist->is_active,
        ];

        if (!empty($data['password'])) {
            $updates['password'] = Hash::make($data['password']);
        }

        $receptionist->update($updates);

        return redirect()->route('hospital.receptionists.index')
            ->with('success', 'Receptionist updated successfully.');
    }

    public function destroy(Request $request, User $receptionist)
    {
        abort_if($receptionist->hospital_id !== $request->user()->hospital_id || $receptionist->role !== 'receptionist', 403);

        $receptionist->delete();

        return redirect()->route('hospital.receptionists.index')
            ->with('success', 'Receptionist removed.');
    }
}
