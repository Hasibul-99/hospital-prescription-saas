<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
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
            'is_active' => 'boolean',
        ]);

        // Credentials are changed through updatePassword() only, never as a
        // side effect of a profile save.
        $receptionist->update([
            'name'      => $data['name'],
            'email'     => $data['email'],
            'phone'     => $data['phone'] ?? null,
            'is_active' => $data['is_active'] ?? $receptionist->is_active,
        ]);

        return redirect()->route('hospital.receptionists.index')
            ->with('success', 'Receptionist updated successfully.');
    }

    /**
     * Hospital-admin password reset for one of their own receptionists.
     *
     * Scoped to the acting admin's hospital by the same guard as every other
     * write here — a hospital admin must never be able to reset credentials
     * for an account in another tenant. Audited, and the receptionist's
     * remember-me token is rotated so persistent login cookies issued before
     * the reset stop working.
     */
    public function updatePassword(Request $request, User $receptionist, AuditLogger $audit)
    {
        abort_if($receptionist->hospital_id !== $request->user()->hospital_id || $receptionist->role !== 'receptionist', 403);

        $data = $request->validate([
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $receptionist->forceFill([
            'password' => Hash::make($data['password']),
            'remember_token' => Str::random(60),
        ])->save();

        $audit->record('user.password_reset', $receptionist, [
            'reset_by' => $request->user()?->name,
            'role' => $receptionist->role,
        ]);

        return back()->with(
            'success',
            "Password updated for {$receptionist->name}. Any \"remember me\" sessions have been invalidated — share the new password securely."
        );
    }

    public function destroy(Request $request, User $receptionist)
    {
        abort_if($receptionist->hospital_id !== $request->user()->hospital_id || $receptionist->role !== 'receptionist', 403);

        $receptionist->delete();

        return redirect()->route('hospital.receptionists.index')
            ->with('success', 'Receptionist removed.');
    }
}
