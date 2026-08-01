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
        return $this->renderView($rx, 'prescriptions.print');
    }

    /**
     * SOAP-formatted physician note derived from the same Rx data.
     * Subjective ← complaints, Objective ← examinations, Assessment ← diagnosis
     * sections, Plan ← medicines + advices.
     */
    public function renderSoap(Prescription $rx): DomPdf
    {
        return $this->renderView($rx, 'prescriptions.soap');
    }

    /**
     * Patient-friendly handout — same medicines and follow-up, no clinical
     * jargon, larger type. Not a signed prescription; complements it.
     */
    public function renderHandout(Prescription $rx): DomPdf
    {
        return $this->renderView($rx, 'prescriptions.handout');
    }

    public function filename(Prescription $rx, string $suffix = ''): string
    {
        $patient = $rx->patient?->name ? preg_replace('/[^A-Za-z0-9_-]+/', '_', $rx->patient->name) : 'patient';
        $tail = $suffix !== '' ? "_{$suffix}" : '';
        return "{$rx->prescription_uid}_{$patient}{$tail}.pdf";
    }

    protected function renderView(Prescription $rx, string $view): DomPdf
    {
        $rx->loadMissing(['patient', 'patient.allergies', 'doctor', 'complaints', 'examinations', 'sections', 'medicines', 'hospital']);

        $profile = DoctorProfile::query()
            ->where('user_id', $rx->doctor_id)
            ->where('hospital_id', $rx->hospital_id)
            ->first();

        $hospital = $rx->hospital ?: Hospital::find($rx->hospital_id);
        $paper = $profile?->print_paper_size === 'Letter' ? 'letter' : 'a4';

        return Pdf::loadView($view, [
            'rx'       => $rx,
            'doctor'   => $rx->doctor,
            'profile'  => $profile,
            'hospital' => $hospital,
            'patient'  => $rx->patient,
        ])->setPaper($paper, 'portrait');
    }
}
