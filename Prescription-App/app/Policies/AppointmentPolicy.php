<?php

namespace App\Policies;

use App\Models\Appointment;
use App\Models\User;

class AppointmentPolicy
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

    public function view(User $user, Appointment $appointment): bool
    {
        return $user->hospital_id === $appointment->hospital_id
            && in_array($user->role, ['hospital_admin', 'doctor', 'receptionist']);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['hospital_admin', 'doctor', 'receptionist']);
    }

    public function update(User $user, Appointment $appointment): bool
    {
        if ($user->hospital_id !== $appointment->hospital_id) {
            return false;
        }

        if ($user->isReceptionist()) {
            return true;
        }

        if ($user->isDoctor()) {
            return $appointment->doctor_id === $user->id;
        }

        return $user->isHospitalAdmin();
    }

    public function delete(User $user, Appointment $appointment): bool
    {
        return $this->update($user, $appointment);
    }
}
