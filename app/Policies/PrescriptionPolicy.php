<?php

namespace App\Policies;

use App\Models\Prescription;
use App\Models\User;

class PrescriptionPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['hospital_admin', 'doctor', 'receptionist']);
    }

    public function view(User $user, Prescription $rx): bool
    {
        if ($user->hospital_id !== $rx->hospital_id) {
            return false;
        }

        if ($user->isDoctor()) {
            return $rx->doctor_id === $user->id;
        }

        return in_array($user->role, ['hospital_admin', 'receptionist']);
    }

    public function create(User $user): bool
    {
        return $user->isDoctor();
    }

    public function update(User $user, Prescription $rx): bool
    {
        return $user->isDoctor()
            && $user->id === $rx->doctor_id
            && $user->hospital_id === $rx->hospital_id;
    }

    public function delete(User $user, Prescription $rx): bool
    {
        return $this->update($user, $rx);
    }
}
