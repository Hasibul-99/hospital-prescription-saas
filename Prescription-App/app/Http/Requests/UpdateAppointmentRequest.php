<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('appointment'));
    }

    public function rules(): array
    {
        return [
            'chamber_id' => 'nullable|exists:chambers,id',
            'appointment_date' => 'sometimes|date',
            'type' => 'sometimes|in:new_visit,follow_up,emergency',
            'status' => 'sometimes|in:waiting,in_progress,completed,absent,cancelled',
            'fee_amount' => 'nullable|numeric|min:0',
            'fee_paid' => 'boolean',
            'payment_method' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:1000',
        ];
    }
}
