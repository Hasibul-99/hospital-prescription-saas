<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'disease_name' => 'required|string|max:150',
            'is_global' => 'nullable|boolean',

            'complaints' => 'nullable|array',
            'complaints.*.complaint_name' => 'required|string|max:200',
            'complaints.*.duration_text' => 'nullable|string|max:100',
            'complaints.*.note' => 'nullable|string|max:500',

            'examinations' => 'nullable|array',
            'examinations.*.examination_name' => 'required|string|max:200',
            'examinations.*.finding_value' => 'nullable|string|max:200',
            'examinations.*.note' => 'nullable|string|max:500',

            'medicines' => 'nullable|array',
            'medicines.*.medicine_name' => 'required|string|max:200',
            'medicines.*.medicine_id' => 'nullable|integer',
            'medicines.*.medicine_type' => 'nullable|string|max:50',
            'medicines.*.strength' => 'nullable|string|max:100',
            'medicines.*.generic_name' => 'nullable|string|max:200',
            'medicines.*.dose_morning' => 'nullable|numeric',
            'medicines.*.dose_noon' => 'nullable|numeric',
            'medicines.*.dose_afternoon' => 'nullable|numeric',
            'medicines.*.dose_night' => 'nullable|numeric',
            'medicines.*.dose_bedtime' => 'nullable|numeric',
            'medicines.*.timing' => 'nullable|string|max:50',
            'medicines.*.duration_value' => 'nullable|integer',
            'medicines.*.duration_unit' => 'nullable|string|max:20',
            'medicines.*.custom_instruction' => 'nullable|string|max:500',
            'medicines.*.additional_doses' => 'nullable|array',

            'advices' => 'nullable|array',
            'advices.*.content' => 'required_without:advices.*|string|max:500',

            'investigations' => 'nullable|array',
            'investigations.*.content' => 'required_without:investigations.*|string|max:500',
        ];
    }
}
