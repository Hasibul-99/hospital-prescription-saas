<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StatementController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $from = $request->input('date_from', now()->startOfMonth()->toDateString());
        $to = $request->input('date_to', now()->toDateString());

        $rows = Appointment::query()
            ->with(['patient:id,patient_uid,name,phone', 'chamber:id,name'])
            ->where('doctor_id', $user->id)
            ->whereBetween('appointment_date', [$from, $to])
            ->whereNotIn('status', ['cancelled'])
            ->orderBy('appointment_date')
            ->orderBy('serial_number')
            ->get();

        $summary = [
            'total_patients' => $rows->count(),
            'new_patients' => $rows->where('type', 'new_visit')->count(),
            'follow_ups' => $rows->where('type', 'follow_up')->count(),
            'emergency' => $rows->where('type', 'emergency')->count(),
            'total_earned' => (float) $rows->sum('fee_amount'),
            'total_paid' => (float) $rows->where('fee_paid', true)->sum('fee_amount'),
            'total_unpaid' => (float) $rows->where('fee_paid', false)->sum('fee_amount'),
        ];

        return Inertia::render('Doctor/Statements/Index', [
            'rows' => $rows,
            'summary' => $summary,
            'filters' => ['date_from' => $from, 'date_to' => $to],
        ]);
    }
}
