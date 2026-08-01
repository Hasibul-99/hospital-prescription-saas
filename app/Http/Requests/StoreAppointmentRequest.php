<?php

namespace App\Http\Requests;

use App\Models\Appointment;
use Illuminate\Foundation\Http\FormRequest;

class StoreAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Appointment::class);
    }

    public function rules(): array
    {
        $user = $this->user();

        return [
            'patient_id' => 'required|exists:patients,id',
            'doctor_id' => [
                $user->isDoctor() ? 'nullable' : 'required',
                'exists:users,id',
            ],
            'chamber_id' => 'nullable|exists:chambers,id',
            'appointment_date' => 'required|date|after_or_equal:today',
            'type' => 'required|in:new_visit,follow_up,emergency',
            'fee_amount' => 'nullable|numeric|min:0',
            'fee_paid' => 'boolean',
            'payment_method' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:1000',
        ];
    }
}
