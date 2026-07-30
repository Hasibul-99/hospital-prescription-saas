<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\PatientVital;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Shared vitals controller used by both doctor and receptionist routes.
 * Front desk enters vitals at check-in; doctor references trends during
 * consultation. Every row is hospital-scoped by BelongsToHospital.
 */
class PatientVitalController extends Controller
{
    /**
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function store(Request $request, Patient $patient): RedirectResponse
    {
        $this->authorize('view', $patient);

        $data = $request->validate([
            'recorded_at' => ['nullable', 'date'],
            'systolic'    => ['nullable', 'integer', 'min:40',  'max:300'],
            'diastolic'   => ['nullable', 'integer', 'min:20',  'max:200'],
            'pulse'       => ['nullable', 'integer', 'min:20',  'max:250'],
            'temperature' => ['nullable', 'numeric', 'min:90',  'max:115'], // °F
            'weight_kg'   => ['nullable', 'numeric', 'min:0.5', 'max:400'],
            'height_cm'   => ['nullable', 'numeric', 'min:20',  'max:250'],
            'spo2'        => ['nullable', 'integer', 'min:50',  'max:100'],
            'notes'       => ['nullable', 'string', 'max:500'],
        ]);

        // Require at least one measurement — otherwise the row is noise.
        $measured = collect(['systolic','diastolic','pulse','temperature','weight_kg','height_cm','spo2'])
            ->contains(fn ($k) => filled($data[$k] ?? null));
        if (! $measured) {
            return back()->withErrors(['systolic' => 'Enter at least one measurement.']);
        }

        PatientVital::create([
            'hospital_id'         => $patient->hospital_id,
            'patient_id'          => $patient->id,
            'recorded_by_user_id' => $request->user()->id,
            'recorded_at'         => $data['recorded_at'] ?? now(),
            'systolic'            => $data['systolic']    ?? null,
            'diastolic'           => $data['diastolic']   ?? null,
            'pulse'               => $data['pulse']       ?? null,
            'temperature'         => $data['temperature'] ?? null,
            'weight_kg'           => $data['weight_kg']   ?? null,
            'height_cm'           => $data['height_cm']   ?? null,
            'spo2'                => $data['spo2']        ?? null,
            'notes'               => $data['notes']       ?? null,
        ]);

        return back()->with('success', 'Vitals recorded.');
    }

    /**
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function destroy(Request $request, PatientVital $vital): RedirectResponse
    {
        // Row already hospital-scoped by BelongsToHospital global scope.
        $this->authorize('view', $vital->patient);
        $vital->delete();

        return back()->with('success', 'Vital record removed.');
    }
}
