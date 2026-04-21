<?php

namespace App\Services;

use App\Models\DoctorProfile;
use App\Models\Hospital;
use App\Models\Prescription;
use Barryvdh\DomPDF\Facade\Pdf;
use Barryvdh\DomPDF\PDF as DomPdf;

class PrescriptionPdfService
{
    public function render(Prescription $rx): DomPdf
    {
        $rx->loadMissing(['patient', 'doctor', 'complaints', 'examinations', 'sections', 'medicines', 'hospital']);

        $profile = DoctorProfile::query()
            ->where('user_id', $rx->doctor_id)
            ->where('hospital_id', $rx->hospital_id)
            ->first();

        $hospital = $rx->hospital ?: Hospital::find($rx->hospital_id);

        $paper = $profile?->print_paper_size === 'Letter' ? 'letter' : 'a4';

        return Pdf::loadView('prescriptions.print', [
            'rx' => $rx,
            'doctor' => $rx->doctor,
            'profile' => $profile,
            'hospital' => $hospital,
            'patient' => $rx->patient,
        ])->setPaper($paper, 'portrait');
    }

    public function filename(Prescription $rx): string
    {
        $patient = $rx->patient?->name ? preg_replace('/[^A-Za-z0-9_-]+/', '_', $rx->patient->name) : 'patient';
        return "{$rx->prescription_uid}_{$patient}.pdf";
    }
}
