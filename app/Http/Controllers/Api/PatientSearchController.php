<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PatientSearchController extends Controller
{
    /**
     * GET /api/patients/search?q=xxx
     * Scoped by hospital_id automatically via BelongsToHospital trait.
     */
    public function search(Request $request): JsonResponse
    {
        $request->validate(['q' => 'required|string|min:1']);

        $q = $request->q;

        $patients = Patient::query()
            ->withMax('appointments as last_visit', 'appointment_date')
            ->where(function ($query) use ($q) {
                $query->where('name', 'like', "%{$q}%")
                      ->orWhere('phone', 'like', "%{$q}%")
                      ->orWhere('patient_uid', $q);
            })
            ->where('is_active', true)
            ->limit(10)
            ->get(['id', 'patient_uid', 'name', 'age_years', 'age_months', 'age_days', 'gender', 'phone', 'profile_image']);

        return response()->json($patients);
    }

    /**
     * GET /api/patients/check-duplicate?phone=xxx
     * Check if phone already exists in current hospital.
     */
    public function checkDuplicate(Request $request): JsonResponse
    {
        $request->validate(['phone' => 'required|string']);

        $existing = Patient::where('phone', $request->phone)->first([
            'id', 'patient_uid', 'name', 'age_years', 'gender', 'phone',
        ]);

        return response()->json([
            'exists' => (bool) $existing,
            'patient' => $existing,
        ]);
    }
}
