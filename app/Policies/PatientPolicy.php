<?php

namespace App\Policies;

use App\Models\Patient;
use App\Models\User;

class PatientPolicy
{
    /**
     * Super admin bypasses all checks.
     */
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

    public function view(User $user, Patient $patient): bool
    {
        return $user->hospital_id === $patient->hospital_id;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['hospital_admin', 'doctor', 'receptionist']);
    }

    public function update(User $user, Patient $patient): bool
    {
        if ($user->hospital_id !== $patient->hospital_id) {
            return false;
        }

        return in_array($user->role, ['hospital_admin', 'doctor', 'receptionist']);
    }

    public function delete(User $user, Patient $patient): bool
    {
        if ($user->hospital_id !== $patient->hospital_id) {
            return false;
        }

        return in_array($user->role, ['hospital_admin', 'doctor']);
    }

    /**
     * Receptionists cannot view prescription details.
     */
    public function viewPrescriptions(User $user, Patient $patient): bool
    {
        if ($user->hospital_id !== $patient->hospital_id) {
            return false;
        }

        return in_array($user->role, ['hospital_admin', 'doctor']);
    }
}
