<?php

namespace App\Support;

use App\Models\Hospital;
use Illuminate\Validation\ValidationException;

/**
 * Enforcement for the per-plan doctor cap.
 *
 * The cap is consumed by ACTIVE doctors only, and it is checked at exactly two
 * moments: creating a doctor, and reactivating a disabled one. It is never
 * applied retroactively — downgrading a hospital below its current headcount
 * leaves every existing doctor working, it just blocks the next addition.
 */
class DoctorLimit
{
    /**
     * Stop the request if the hospital has no doctor slot free.
     *
     * @param  string  $field  Form field to hang the error on.
     *
     * @throws ValidationException
     */
    public static function assertCanAdd(Hospital $hospital, string $field = 'name', bool $nameHospital = false): void
    {
        if ($hospital->canAddDoctor()) {
            return;
        }

        throw ValidationException::withMessages([
            $field => self::message($hospital, $nameHospital),
        ]);
    }

    public static function message(Hospital $hospital, bool $nameHospital = false): string
    {
        $limit = $hospital->effectiveMaxDoctors();
        $used = $hospital->activeDoctorCount();

        $source = $hospital->max_doctors_override !== null
            ? 'this hospital\'s custom limit'
            : 'the ' . ($hospital->plan?->name ?? 'current') . ' plan';

        $who = $nameHospital ? "{$hospital->name} has" : 'You have';

        return "Doctor limit reached — {$who} {$used} of {$limit} active doctors allowed by {$source}. "
            . 'Deactivate an existing doctor or move to a larger plan to add another.';
    }

    /**
     * Usage summary for the quota bar. `limit` and `remaining` are null when
     * the plan is unlimited.
     *
     * @return array{used:int,limit:int|null,remaining:int|null,unlimited:bool,plan:string|null,is_override:bool}
     */
    public static function usage(Hospital $hospital): array
    {
        $limit = $hospital->effectiveMaxDoctors();
        $used = $hospital->activeDoctorCount();

        return [
            'used' => $used,
            'limit' => $limit,
            'remaining' => $limit === null ? null : max(0, $limit - $used),
            'unlimited' => $limit === null,
            'plan' => $hospital->plan?->name,
            'is_override' => $hospital->max_doctors_override !== null,
        ];
    }
}
