<?php

namespace App\Observers;

use App\Models\Appointment;
use App\Services\AuditLogger;
use Illuminate\Support\Facades\Auth;

class AppointmentObserver
{
    public function __construct(private readonly AuditLogger $audit)
    {
    }

    public function deleted(Appointment $appointment): void
    {
        if (! Auth::check()) {
            return;
        }

        $this->audit->record('appointment.delete', $appointment, [
            'serial_number'    => $appointment->serial_number,
            'appointment_date' => (string) $appointment->appointment_date,
            'doctor_id'        => $appointment->doctor_id,
        ]);
    }
}
