<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\PatientAllergy;
use Illuminate\Http\Request;

class PatientAllergyController extends Controller
{
    public function store(Request $request, Patient $patient)
    {
        $this->authorize('update', $patient);

        $data = $request->validate([
            'allergen' => 'required|string|max:255',
            'note'     => 'nullable|string|max:255',
        ]);

        // patient_id comes from the relation; hospital_id is auto-filled by the
        // BelongsToHospital creating hook from the authenticated user.
        $allergy = $patient->allergies()->create([
            'allergen' => trim($data['allergen']),
            'note'     => $data['note'] ?? null,
        ]);

        // JSON (not a redirect) so the prescription builder can update in place
        // without an Inertia reload that would discard the in-progress draft.
        return response()->json([
            'allergy' => $allergy->only('id', 'allergen', 'note'),
        ], 201);
    }

    public function destroy(PatientAllergy $allergy)
    {
        // $allergy is already hospital-scoped by the global scope; a cross-tenant
        // id 404s before reaching here. Re-check via the patient policy anyway.
        $this->authorize('update', $allergy->patient);

        $allergy->delete();

        return response()->json(['ok' => true]);
    }
}
