<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Prescription;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FollowUpController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $from = $request->input('date_from', now()->toDateString());
        $to = $request->input('date_to', now()->addMonth()->toDateString());

        $followUps = Prescription::query()
            ->with([
                'patient:id,patient_uid,name,phone,gender,age_years,age_months,age_days',
                'appointment:id,appointment_date,status',
            ])
            ->where('doctor_id', $user->id)
            ->whereNotNull('follow_up_date')
            ->whereBetween('follow_up_date', [$from, $to])
            ->orderBy('follow_up_date')
            ->get()
            ->map(function (Prescription $rx) {
                $due = \Carbon\Carbon::parse($rx->follow_up_date);
                $today = now()->startOfDay();
                $status = $due->lt($today) ? 'overdue' : ($due->eq($today) ? 'due' : 'upcoming');

                return [
                    'id' => $rx->id,
                    'prescription_uid' => $rx->prescription_uid,
                    'original_date' => $rx->date->toDateString(),
                    'follow_up_date' => $rx->follow_up_date->toDateString(),
                    'patient' => $rx->patient,
                    'status' => $status,
                    'has_booking' => (bool) $rx->appointment,
                ];
            });

        return Inertia::render('Doctor/FollowUps/Index', [
            'follow_ups' => $followUps,
            'filters' => ['date_from' => $from, 'date_to' => $to],
        ]);
    }
}
