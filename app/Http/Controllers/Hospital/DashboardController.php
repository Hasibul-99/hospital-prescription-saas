<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $hospitalId = $request->user()->hospital_id;
        $today      = now()->toDateString();

        $totalDoctors    = User::where('hospital_id', $hospitalId)->where('role', 'doctor')->count();
        $totalPatients   = Patient::where('hospital_id', $hospitalId)->count();
        $todayAppts      = Appointment::where('hospital_id', $hospitalId)->whereDate('appointment_date', $today)->count();
        $pendingAppts    = Appointment::where('hospital_id', $hospitalId)->whereDate('appointment_date', $today)->where('status', 'waiting')->count();
        $totalRx         = Prescription::where('hospital_id', $hospitalId)->count();
        $todayRx         = Prescription::where('hospital_id', $hospitalId)->whereDate('created_at', $today)->count();

        $recentPatients = Patient::where('hospital_id', $hospitalId)
            ->latest()
            ->take(5)
            ->get(['id', 'patient_uid', 'name', 'phone', 'created_at']);

        $recentPrescriptions = Prescription::where('hospital_id', $hospitalId)
            ->with(['patient:id,name,patient_uid', 'doctor:id,name'])
            ->latest()
            ->take(5)
            ->get(['id', 'prescription_uid', 'patient_id', 'doctor_id', 'status', 'created_at']);

        return Inertia::render('Hospital/Dashboard', [
            'stats' => [
                'total_doctors'   => $totalDoctors,
                'total_patients'  => $totalPatients,
                'today_appointments' => $todayAppts,
                'pending_appointments' => $pendingAppts,
                'total_prescriptions' => $totalRx,
                'today_prescriptions' => $todayRx,
            ],
            'recent_patients'       => $recentPatients,
            'recent_prescriptions'  => $recentPrescriptions,
        ]);
    }
}
