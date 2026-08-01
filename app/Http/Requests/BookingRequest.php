<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'doctor_slug'    => ['required', 'string', 'exists:doctor_profiles,public_slug'],
            'chamber_id'     => ['required', 'integer', 'exists:chambers,id'],
            'date'           => ['required', 'date', 'after_or_equal:today'],
            'patient_name'   => ['required', 'string', 'max:255'],
            'patient_phone'  => ['required', 'string', 'max:30'],
            'patient_email'  => ['required', 'email', 'max:255'],
        ];
    }
}
