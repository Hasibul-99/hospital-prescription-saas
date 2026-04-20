<?php

namespace App\Policies;

use App\Models\HospitalHoliday;
use App\Models\User;

class HospitalHolidayPolicy
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

    public function view(User $user, HospitalHoliday $holiday): bool
    {
        return $user->hospital_id === $holiday->hospital_id;
    }

    public function create(User $user): bool
    {
        return $user->isHospitalAdmin();
    }

    public function update(User $user, HospitalHoliday $holiday): bool
    {
        return $user->isHospitalAdmin() && $user->hospital_id === $holiday->hospital_id;
    }

    public function delete(User $user, HospitalHoliday $holiday): bool
    {
        return $this->update($user, $holiday);
    }
}
