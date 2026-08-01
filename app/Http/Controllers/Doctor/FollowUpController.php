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
                    'contact_attempts' => $rx->contact_attempts,
                    'last_contact_at' => $rx->last_contact_at?->toIso8601String(),
                    'recall_status' => $rx->recall_status,
                ];
            });

        return Inertia::render('Doctor/FollowUps/Index', [
            'follow_ups' => $followUps,
            'filters' => ['date_from' => $from, 'date_to' => $to],
        ]);
    }

    /**
     * Mark multiple prescriptions with a recall status. Manual workflow —
     * doctor calls / texts patient out-of-band, then records the outcome.
     * SMS/WhatsApp delivery is deferred until the SMS gateway lands.
     */
    public function bulkMark(Request $request)
    {
        $data = $request->validate([
            'ids'    => ['required', 'array', 'min:1'],
            'ids.*'  => ['integer'],
            'status' => ['required', 'in:contacted,unreachable,completed'],
        ]);

        $user = $request->user();

        $rxs = Prescription::query()
            ->where('doctor_id', $user->id)
            ->whereIn('id', $data['ids'])
            ->get();

        foreach ($rxs as $rx) {
            $rx->increment('contact_attempts');
            $rx->update([
                'last_contact_at' => now(),
                'recall_status'   => $data['status'],
            ]);
        }

        return back()->with('success', "Marked {$rxs->count()} follow-up(s) as {$data['status']}.");
    }
}
