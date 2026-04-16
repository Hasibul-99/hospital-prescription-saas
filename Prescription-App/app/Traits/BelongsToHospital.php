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
            if ($user && $user->hospital_id && !$user->isSuperAdmin()) {
                $builder->where($builder->getModel()->getTable() . '.hospital_id', $user->hospital_id);
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
