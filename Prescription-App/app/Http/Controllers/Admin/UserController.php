<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Hospital;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::query()
            ->with('hospital:id,name')
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
            'users'     => $users,
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

        if (empty($validated['password'])) {
            unset($validated['password']);
        } else {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return redirect()->route('admin.users.index')->with('success', 'User updated.');
    }

    public function destroy(User $user)
    {
        $user->delete();

        return redirect()->route('admin.users.index')->with('success', 'User deleted.');
    }
}
