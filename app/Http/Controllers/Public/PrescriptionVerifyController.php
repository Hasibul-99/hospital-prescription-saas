<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Prescription;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Unauthenticated public prescription verify view. Answers the question
 * "is this Rx real and who signed it?" — and shows only the medicines
 * the patient needs to hand over at the pharmacy. Complaints, examinations,
 * diagnoses and doctor notes are deliberately withheld (Feature #41).
 */
class PrescriptionVerifyController extends Controller
{
    public function show(Request $request, string $shareToken): Response
    {
        $rx = Prescription::withoutGlobalScopes()
            ->where('share_token', $shareToken)
            ->with([
                'patient:id,patient_uid,name,gender,age_years,age_months,age_days,phone',
                'patient.allergies:id,patient_id,allergen',
                'doctor:id,name',
                'doctor.doctorProfile:id,user_id,degrees,specialization,designation,bmdc_number',
                'hospital:id,name,logo,address,phone',
                'medicines:id,prescription_id,medicine_name,medicine_type,strength,generic_name,dose_display,dose_morning,dose_noon,dose_afternoon,dose_night,dose_bedtime,timing,duration_value,duration_unit,custom_instruction,sort_order',
            ])
            ->firstOrFail();

        return Inertia::render('Public/RxVerify', [
            'prescription' => [
                'uid'          => $rx->prescription_uid,
                'date'         => $rx->date?->toDateString(),
                'follow_up'    => $rx->follow_up_date?->toDateString(),
                'status'       => $rx->status,
                'printed_at'   => $rx->printed_at?->toDateString(),
            ],
            // Patient identity is minimised: first name + last-initial only.
            'patient' => [
                'uid'          => $rx->patient?->patient_uid,
                'display_name' => $this->maskName($rx->patient?->name),
                'gender'       => $rx->patient?->gender,
                'age_display'  => $this->buildAge($rx->patient),
                'allergies'    => $rx->patient?->allergies?->pluck('allergen')->all() ?? [],
            ],
            'doctor' => [
                'name'           => $rx->doctor?->name,
                'degrees'        => $rx->doctor?->doctorProfile?->degrees,
                'specialization' => $rx->doctor?->doctorProfile?->specialization,
                'designation'    => $rx->doctor?->doctorProfile?->designation,
                'bmdc'           => $rx->doctor?->doctorProfile?->bmdc_number,
                'bmdc_verified'  => (bool) $rx->doctor?->doctorProfile?->bmdc_verified,
            ],
            'hospital' => [
                'name'    => $rx->hospital?->name,
                'address' => $rx->hospital?->address,
                'phone'   => $rx->hospital?->phone,
            ],
            'medicines' => $rx->medicines->sortBy('sort_order')->values()->map(fn ($m) => [
                'name'         => $m->medicine_name,
                'type'         => $m->medicine_type,
                'strength'     => $m->strength,
                'generic'      => $m->generic_name,
                'dose_display' => $m->dose_display ?: $this->buildDose($m),
                'timing'       => $m->timing,
                'custom'       => $m->custom_instruction,
                'duration'     => $this->duration($m),
            ]),
        ]);
    }

    protected function maskName(?string $name): string
    {
        if (! $name) return '';
        $parts = preg_split('/\s+/', trim($name));
        if (count($parts) === 1) return $parts[0];
        $first = array_shift($parts);
        return $first . ' ' . mb_strtoupper(mb_substr(end($parts), 0, 1)) . '.';
    }

    protected function buildAge($patient): string
    {
        if (! $patient) return '';
        $bits = [];
        if ($patient->age_years) $bits[] = $patient->age_years . 'y';
        if ($patient->age_months) $bits[] = $patient->age_months . 'm';
        return implode(' ', $bits);
    }

    protected function buildDose($m): string
    {
        $parts = [$m->dose_morning, $m->dose_noon, $m->dose_afternoon, $m->dose_night, $m->dose_bedtime];
        if (collect($parts)->every(fn ($v) => $v === null)) return '';
        return collect($parts)->map(fn ($v) => $v === null ? '0' : (string) $v)->implode('+');
    }

    protected function duration($m): string
    {
        if (! $m->duration_unit) return '';
        if ($m->duration_unit === 'continue') return 'continue';
        if ($m->duration_unit === 'N_A') return 'N/A';
        return $m->duration_value ? $m->duration_value . ' ' . $m->duration_unit : '';
    }
}
