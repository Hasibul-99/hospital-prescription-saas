<?php

namespace App\Observers;

use App\Models\Patient;
use App\Services\AuditLogger;
use Illuminate\Support\Facades\Auth;

class PatientObserver
{
    public function __construct(private readonly AuditLogger $audit)
    {
    }

    public function created(Patient $patient): void
    {
        if (! Auth::check()) {
            return;
        }

        $this->audit->record('patient.create', $patient, [
            'patient_uid' => $patient->patient_uid,
            'name'        => $patient->name,
        ]);
    }

    public function updated(Patient $patient): void
    {
        if (! Auth::check()) {
            return;
        }

        // Record which fields changed, not their values — a patient record
        // holds sensitive data we don't want duplicated into the audit meta.
        $fields = array_values(array_diff(
            array_keys($patient->getChanges()),
            ['updated_at']
        ));

        if ($fields === []) {
            return;
        }

        $this->audit->record('patient.update', $patient, [
            'patient_uid' => $patient->patient_uid,
            'fields'      => $fields,
        ]);
    }

    public function deleted(Patient $patient): void
    {
        if (! Auth::check()) {
            return;
        }

        $this->audit->record('patient.delete', $patient, [
            'patient_uid' => $patient->patient_uid,
            'name'        => $patient->name,
        ]);
    }
}
