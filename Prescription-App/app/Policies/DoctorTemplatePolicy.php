<?php

namespace App\Policies;

use App\Models\DoctorTemplate;
use App\Models\User;

class DoctorTemplatePolicy
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
        return in_array($user->role, ['doctor', 'hospital_admin']);
    }

    public function view(User $user, DoctorTemplate $tpl): bool
    {
        if ($tpl->is_global) {
            if ($user->isDoctor()) {
                return $user->hospital_id === $tpl->hospital_id || $tpl->hospital_id === null;
            }
            if ($user->isHospitalAdmin()) {
                return $user->hospital_id === $tpl->hospital_id;
            }
            return false;
        }

        return $user->isDoctor()
            && $tpl->doctor_id === $user->id
            && $tpl->hospital_id === $user->hospital_id;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['doctor', 'hospital_admin']);
    }

    public function createGlobal(User $user): bool
    {
        return $user->isHospitalAdmin();
    }

    public function update(User $user, DoctorTemplate $tpl): bool
    {
        if ($tpl->is_global) {
            return $user->isHospitalAdmin() && $user->hospital_id === $tpl->hospital_id;
        }

        return $user->isDoctor()
            && $tpl->doctor_id === $user->id
            && $tpl->hospital_id === $user->hospital_id;
    }

    public function delete(User $user, DoctorTemplate $tpl): bool
    {
        return $this->update($user, $tpl);
    }

    public function duplicate(User $user, DoctorTemplate $tpl): bool
    {
        return $user->isDoctor() && $this->view($user, $tpl);
    }
}
