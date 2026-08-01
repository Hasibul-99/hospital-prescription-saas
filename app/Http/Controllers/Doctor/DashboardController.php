<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\PrescriptionMedicine;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $doctorId    = auth()->id();
        $hospitalId  = auth()->user()->hospital_id;
        $today       = now()->toDateString();

        // ── Stats ──────────────────────────────────────────────────
        $activePrescriptions = Prescription::where('doctor_id', $doctorId)
            ->where('status', '!=', 'draft')
            ->count();

        $patientsToday = Appointment::where('doctor_id', $doctorId)
            ->where('appointment_date', $today)
            ->count();

        $pendingDrafts = Prescription::where('doctor_id', $doctorId)
            ->where('status', 'draft')
            ->count();

        $totalPatients = Patient::where('hospital_id', $hospitalId)
            ->count();

        // ── Recent prescriptions (last 8) ─────────────────────────
        $recent = Prescription::with(['patient', 'medicines.medicine'])
            ->where('doctor_id', $doctorId)
            ->orderByDesc('created_at')
            ->limit(8)
            ->get()
            ->map(function (Prescription $rx) {
                $firstMed = $rx->medicines->first();
                $medicineName = $firstMed?->medicine?->name ?? null;
                $moreCount    = max(0, $rx->medicines->count() - 1);

                return [
                    'id'               => $rx->id,
                    'prescription_uid' => $rx->prescription_uid ?? 'RX-' . $rx->id,
                    'patient_name'     => $rx->patient?->name ?? '—',
                    'patient_uid'      => $rx->patient?->patient_uid ?? '—',
                    'medicine_summary' => $medicineName
                        ? ($moreCount > 0 ? "{$medicineName} +{$moreCount}" : $medicineName)
                        : '—',
                    'freq_summary'     => $firstMed?->dose_display ?? '',
                    'status'           => $rx->status,
                    'date'             => $rx->date ?? $rx->created_at->toDateString(),
                ];
            });

        // ── Today's schedule ──────────────────────────────────────
        $appointments = Appointment::with('patient')
            ->where('doctor_id', $doctorId)
            ->where('appointment_date', $today)
            ->orderBy('serial_number')
            ->limit(8)
            ->get();

        $nowHour = now()->hour;
        $schedule = $appointments->values()->map(function (Appointment $appt, int $idx) use ($nowHour) {
            $hour    = 9 + $idx;
            $timeStr = sprintf('%02d:00', $hour);

            return [
                'time'         => $timeStr,
                'patient_name' => $appt->patient?->name ?? 'Patient',
                'reason'       => $appt->notes ?? 'General consultation',
                'is_now'       => $hour === $nowHour,
                'is_next'      => $hour === $nowHour + 1,
            ];
        });

        // ── Chart data (last 14 days new vs refills) ─────────────
        $chartNew     = [];
        $chartRefills = [];
        for ($i = 13; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $chartNew[]     = (int) Prescription::where('doctor_id', $doctorId)->whereDate('created_at', $date)->count();
            $chartRefills[] = 0; // refill tracking not yet implemented
        }

        return Inertia::render('Doctor/Dashboard', [
            'stats' => [
                'active_prescriptions' => $activePrescriptions,
                'patients_today'       => $patientsToday,
                'pending_refills'      => $pendingDrafts,
                'total_patients'       => $totalPatients,
            ],
            'recent_prescriptions' => $recent,
            'todays_schedule'      => $schedule,
            'chart_data'           => [
                'new_rx'  => $chartNew,
                'refills' => $chartRefills,
            ],
            'today_label' => now()->format('F j, Y') . ' · ' . $patientsToday . ' patients',
        ]);
    }
}
