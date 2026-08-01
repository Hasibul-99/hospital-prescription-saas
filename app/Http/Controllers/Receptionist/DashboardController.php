<?php

namespace App\Http\Controllers\Receptionist;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $today = now()->toDateString();

        // Appointment + Patient are hospital-scoped by the BelongsToHospital
        // global scope, so these counts are already limited to the
        // receptionist's own hospital — no manual hospital_id filter needed.
        $todaysAppointments = Appointment::where('appointment_date', $today);

        $stats = [
            'appointments_today' => (clone $todaysAppointments)->count(),
            'waiting'            => (clone $todaysAppointments)->where('status', 'waiting')->count(),
            'in_progress'        => (clone $todaysAppointments)->where('status', 'in_progress')->count(),
            'completed'          => (clone $todaysAppointments)->where('status', 'completed')->count(),
            'patients_today'     => Patient::whereDate('created_at', $today)->count(),
            'active_doctors'     => User::where('role', 'doctor')->where('is_active', true)->count(),
        ];

        $queue = Appointment::with(['patient:id,name,patient_uid,phone', 'doctor:id,name'])
            ->where('appointment_date', $today)
            ->orderBy('serial_number')
            ->limit(12)
            ->get()
            ->map(fn (Appointment $appt) => [
                'id'            => $appt->id,
                'serial_number' => $appt->serial_number,
                'patient_name'  => $appt->patient?->name ?? '—',
                'patient_uid'   => $appt->patient?->patient_uid ?? '—',
                'doctor_name'   => $appt->doctor?->name ?? '—',
                'status'        => $appt->status,
            ]);

        return Inertia::render('Receptionist/Dashboard', [
            'stats'       => $stats,
            'queue'       => $queue,
            'today_label' => now()->format('F j, Y'),
        ]);
    }
}
