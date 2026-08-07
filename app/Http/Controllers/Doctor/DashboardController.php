<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Prescription;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /** Ranges the volume chart can be switched between. */
    private const RANGES = [14, 30, 90];

    public function index(Request $request)
    {
        $doctorId = auth()->id();
        $hospitalId = auth()->user()->hospital_id;
        $today = now()->toDateString();

        $days = (int) $request->input('days', 14);
        if (! in_array($days, self::RANGES, true)) {
            $days = 14;
        }

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

        $totalPatients = Patient::where('hospital_id', $hospitalId)->count();

        // Comparison window for the "vs previous period" hints. Same length as
        // the chart range so the two always agree.
        $periodStart = now()->subDays($days - 1)->startOfDay();
        $previousStart = now()->subDays($days * 2 - 1)->startOfDay();

        $thisPeriod = Prescription::where('doctor_id', $doctorId)
            ->where('created_at', '>=', $periodStart)
            ->count();

        $previousPeriod = Prescription::where('doctor_id', $doctorId)
            ->whereBetween('created_at', [$previousStart, $periodStart])
            ->count();

        // ── Recent prescriptions (last 8) ─────────────────────────
        $recent = Prescription::with(['patient', 'medicines.medicine'])
            ->where('doctor_id', $doctorId)
            ->orderByDesc('created_at')
            ->limit(8)
            ->get()
            ->map(function (Prescription $rx) {
                $firstMed = $rx->medicines->first();
                $medicineName = $firstMed?->medicine?->name;
                $moreCount = max(0, $rx->medicines->count() - 1);

                return [
                    'id' => $rx->id,
                    'prescription_uid' => $rx->prescription_uid ?? 'RX-' . $rx->id,
                    'patient_name' => $rx->patient?->name ?? '—',
                    'patient_uid' => $rx->patient?->patient_uid ?? '—',
                    'medicine_summary' => $medicineName
                        ? ($moreCount > 0 ? "{$medicineName} +{$moreCount}" : $medicineName)
                        : '—',
                    'freq_summary' => $firstMed?->dose_display ?? '',
                    'status' => $rx->status,
                    'date' => $rx->date ?? $rx->created_at->toDateString(),
                ];
            });

        // ── Today's queue ─────────────────────────────────────────
        // Appointments are serial-based, not clock-based — this list shows the
        // real serial order and status rather than invented time slots.
        $schedule = Appointment::with('patient:id,name,patient_uid')
            ->where('doctor_id', $doctorId)
            ->where('appointment_date', $today)
            ->orderBy('serial_number')
            ->limit(8)
            ->get()
            ->map(fn (Appointment $appt) => [
                'id' => $appt->id,
                'serial_number' => $appt->serial_number,
                'patient_name' => $appt->patient?->name ?? 'Patient',
                'patient_uid' => $appt->patient?->patient_uid,
                'reason' => $appt->notes ?: ucfirst(str_replace('_', ' ', $appt->type)),
                'status' => $appt->status,
            ]);

        // ── Prescription volume over the selected range ───────────
        $counts = Prescription::where('doctor_id', $doctorId)
            ->where('created_at', '>=', $periodStart)
            ->get(['created_at'])
            ->groupBy(fn ($rx) => $rx->created_at->toDateString())
            ->map->count();

        $volume = collect(range($days - 1, 0))
            ->map(function (int $offset) use ($counts) {
                $date = now()->subDays($offset);

                return [
                    'date' => $date->toDateString(),
                    // Fewer points on a long range, so label density has to drop
                    // with it or the axis becomes unreadable.
                    'label' => $date->format('j M'),
                    'count' => (int) ($counts[$date->toDateString()] ?? 0),
                ];
            })
            ->all();

        return Inertia::render('Doctor/Dashboard', [
            'stats' => [
                'active_prescriptions' => $activePrescriptions,
                'patients_today' => $patientsToday,
                'pending_drafts' => $pendingDrafts,
                'total_patients' => $totalPatients,
                'period_prescriptions' => $thisPeriod,
                'previous_period_prescriptions' => $previousPeriod,
            ],
            'recent_prescriptions' => $recent,
            'todays_queue' => $schedule,
            'volume' => $volume,
            'days' => $days,
            'today_label' => now()->format('F j, Y'),
        ]);
    }
}
