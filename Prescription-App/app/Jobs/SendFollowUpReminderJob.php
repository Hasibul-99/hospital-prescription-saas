<?php

namespace App\Jobs;

use App\Mail\FollowUpReminderMail;
use App\Models\DoctorProfile;
use App\Models\Prescription;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendFollowUpReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(public int $prescriptionId)
    {
    }

    public function handle(): void
    {
        $rx = Prescription::with(['patient', 'doctor'])->find($this->prescriptionId);
        if (! $rx || ! $rx->follow_up_date) {
            return;
        }

        $email = $rx->patient?->email;
        if (! $email) {
            return;
        }

        $doctorPrefs = DoctorProfile::where('user_id', $rx->doctor_id)->first();
        if ($doctorPrefs && (! $doctorPrefs->notify_followup_reminders || ! $doctorPrefs->notify_email)) {
            return;
        }

        try {
            Mail::to($email)->send(new FollowUpReminderMail($rx));
        } catch (\Throwable $e) {
            Log::warning('Follow-up reminder email failed', [
                'prescription_id' => $rx->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
