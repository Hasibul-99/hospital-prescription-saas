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
        return $user->isDoctor();
    }

    public function view(User $user, DoctorTemplate $tpl): bool
    {
        if ($tpl->is_global) {
            return $user->isDoctor();
        }

        return $user->isDoctor()
            && $tpl->doctor_id === $user->id
            && $tpl->hospital_id === $user->hospital_id;
    }

    public function create(User $user): bool
    {
        return $user->isDoctor();
    }

    public function update(User $user, DoctorTemplate $tpl): bool
    {
        return $user->isDoctor()
            && $tpl->doctor_id === $user->id
            && $tpl->hospital_id === $user->hospital_id;
    }

    public function delete(User $user, DoctorTemplate $tpl): bool
    {
        return $this->update($user, $tpl);
    }
}
