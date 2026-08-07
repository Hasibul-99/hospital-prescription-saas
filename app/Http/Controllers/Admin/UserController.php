<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Hospital;
use App\Models\User;
use App\Support\DoctorLimit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::query()
            ->with(['hospital:id,name', 'doctorProfile:id,user_id,bmdc_number,bmdc_verified,bmdc_verified_at'])
            ->when($request->search, fn ($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%");
            }))
            ->when($request->role, fn ($q, $r) => $q->where('role', $r))
            ->when($request->hospital_id, fn ($q, $h) => $q->where('hospital_id', $h))
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        $hospitals = Hospital::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('Admin/Users/Index', [
            'users'     => $this->paginateFor($users),
            'hospitals' => $hospitals,
            'filters'   => $request->only(['search', 'role', 'hospital_id']),
        ]);
    }

    public function create()
    {
        $hospitals = Hospital::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('Admin/Users/Create', [
            'hospitals' => $hospitals,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'email'       => 'required|email|unique:users,email',
            'password'    => 'required|string|min:8|confirmed',
            'role'        => 'required|in:super_admin,hospital_admin,doctor,receptionist',
            'hospital_id' => 'nullable|exists:hospitals,id',
            'is_active'   => 'boolean',
        ]);

        // A cap is a cap — the super admin is blocked too. Raise the hospital's
        // max_doctors_override (or its plan) to make room.
        $this->assertDoctorSlotAvailable($validated);

        $validated['password'] = Hash::make($validated['password']);

        User::create($validated);

        return redirect()->route('admin.users.index')->with('success', 'User created.');
    }

    public function show(User $user)
    {
        $user->load('hospital:id,name');

        return Inertia::render('Admin/Users/Show', ['user' => $user]);
    }

    public function edit(User $user)
    {
        $hospitals = Hospital::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('Admin/Users/Edit', [
            'user'      => $user,
            'hospitals' => $hospitals,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'email'       => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'password'    => 'nullable|string|min:8|confirmed',
            'role'        => 'required|in:super_admin,hospital_admin,doctor,receptionist',
            'hospital_id' => 'nullable|exists:hospitals,id',
            'is_active'   => 'boolean',
        ]);

        $this->assertDoctorSlotAvailable($validated, $user);

        if (empty($validated['password'])) {
            unset($validated['password']);
        } else {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return redirect()->route('admin.users.index')->with('success', 'User updated.');
    }

    /**
     * Block the save when it would push a hospital past its doctor cap.
     *
     * Only edits that newly occupy a slot are checked — becoming an active
     * doctor at a hospital the user was not already an active doctor at. Saving
     * an unrelated field on an existing active doctor is always allowed, even
     * when the hospital is already over its (since-reduced) limit.
     */
    private function assertDoctorSlotAvailable(array $data, ?User $existing = null): void
    {
        $wantsSlot = ($data['role'] ?? null) === 'doctor'
            && ! empty($data['hospital_id'])
            && ($data['is_active'] ?? true);

        if (! $wantsSlot) {
            return;
        }

        $alreadyHasSlot = $existing
            && $existing->role === 'doctor'
            && $existing->is_active
            && (int) $existing->hospital_id === (int) $data['hospital_id'];

        if ($alreadyHasSlot) {
            return;
        }

        $hospital = Hospital::with('plan')->find($data['hospital_id']);

        if ($hospital) {
            DoctorLimit::assertCanAdd($hospital, 'hospital_id', nameHospital: true);
        }
    }

    public function destroy(User $user)
    {
        $user->delete();

        return redirect()->route('admin.users.index')->with('success', 'User deleted.');
    }

    /**
     * Super-admin manual BMDC verification for a doctor account.
     * Toggles the DoctorProfile.bmdc_verified flag; records who + when.
     * Prerequisite: the doctor has already filled in bmdc_number.
     */
    public function toggleBmdcVerified(Request $request, User $user)
    {
        if ($user->role !== 'doctor') {
            return back()->with('error', 'Only doctor accounts can be BMDC-verified.');
        }

        $profile = $user->doctorProfile;
        if (! $profile) {
            return back()->with('error', 'Doctor has no profile yet.');
        }
        if (empty($profile->bmdc_number)) {
            return back()->with('error', 'Doctor must fill in a BMDC number first.');
        }

        $verifying = ! $profile->bmdc_verified;
        $profile->forceFill([
            'bmdc_verified'    => $verifying,
            'bmdc_verified_at' => $verifying ? now() : null,
            'bmdc_verified_by' => $verifying ? $request->user()->id : null,
        ])->save();

        return back()->with('success', $verifying ? 'BMDC verified.' : 'BMDC verification removed.');
    }
}
