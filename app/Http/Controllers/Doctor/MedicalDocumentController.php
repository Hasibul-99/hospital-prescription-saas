<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\DoctorProfile;
use App\Models\Hospital;
use App\Models\Patient;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Print-only medical documents on doctor letterhead: fitness certificate,
 * sick-leave certificate, referral letter. Render-only for now (no
 * persistence) — an audit trail can be added later once volume warrants it.
 */
class MedicalDocumentController extends Controller
{
    private const TYPES = ['fitness', 'sick_leave', 'referral'];

    public function create(Request $request, string $type)
    {
        abort_unless(in_array($type, self::TYPES), 404);

        $patient = null;
        if ($request->filled('patient_id')) {
            $patient = Patient::query()->find($request->integer('patient_id'));
            if ($patient) {
                $this->authorize('view', $patient);
            }
        }

        return Inertia::render('Doctor/Documents/Create', [
            'type'    => $type,
            'patient' => $patient?->only('id', 'patient_uid', 'name', 'gender', 'age_years', 'age_months', 'phone'),
        ]);
    }

    public function render(Request $request, string $type)
    {
        abort_unless(in_array($type, self::TYPES), 404);

        $data = $request->validate([
            'patient_id'      => ['required', 'integer', 'exists:patients,id'],
            'date'            => ['required', 'date'],
            'body_text'       => ['required', 'string', 'max:2000'],
            'duration_text'   => ['nullable', 'string', 'max:100'],
            'referred_to'     => ['nullable', 'string', 'max:255'],
        ]);

        $patient = Patient::findOrFail($data['patient_id']);
        $this->authorize('view', $patient);

        $doctor = $request->user();
        $profile = DoctorProfile::query()
            ->where('user_id', $doctor->id)
            ->where('hospital_id', $doctor->hospital_id)
            ->first();
        $hospital = Hospital::find($doctor->hospital_id);

        $paper = $profile?->print_paper_size === 'Letter' ? 'letter' : 'a4';
        $title = match ($type) {
            'fitness'    => 'Medical Fitness Certificate',
            'sick_leave' => 'Medical Sick-Leave Certificate',
            'referral'   => 'Referral Letter',
        };

        $pdf = Pdf::loadView('documents.certificate', [
            'type'          => $type,
            'title'         => $title,
            'body_text'     => $data['body_text'],
            'duration_text' => $data['duration_text'] ?? null,
            'referred_to'   => $data['referred_to'] ?? null,
            'date'          => $data['date'],
            'patient'       => $patient,
            'doctor'        => $doctor,
            'profile'       => $profile,
            'hospital'      => $hospital,
        ])->setPaper($paper, 'portrait');

        $slug = preg_replace('/[^A-Za-z0-9_-]+/', '_', $patient->name ?? 'patient');
        return $pdf->stream("{$type}_{$slug}_" . now()->format('Ymd') . '.pdf');
    }
}
