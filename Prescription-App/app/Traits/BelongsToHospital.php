<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

trait BelongsToHospital
{
    protected static function bootBelongsToHospital(): void
    {
        static::addGlobalScope('hospital', function (Builder $builder) {
            $user = Auth::user();

            // No authenticated user (console, seeders, queued jobs) → unscoped.
            // Super admins intentionally see every tenant.
            if (! $user || $user->isSuperAdmin()) {
                return;
            }

            $table = $builder->getModel()->getTable();

            if ($user->hospital_id) {
                $builder->where($table . '.hospital_id', $user->hospital_id);
            } else {
                // A non-super-admin with no hospital must never read tenant data.
                // Fail closed rather than falling through to an unscoped query.
                $builder->whereRaw('1 = 0');
            }
        });

        static::creating(function ($model) {
            $user = Auth::user();
            if ($user && $user->hospital_id && !$model->hospital_id) {
                $model->hospital_id = $user->hospital_id;
            }
        });
    }
}
