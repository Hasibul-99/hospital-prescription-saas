<?php

namespace App\Http\Requests;

use App\Models\Prescription;
use Illuminate\Foundation\Http\FormRequest;

class StorePrescriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Prescription::class);
    }

    public function rules(): array
    {
        return [
            'patient_id' => 'required|exists:patients,id',
            'appointment_id' => 'nullable|exists:appointments,id',
            'date' => 'nullable|date',
            'status' => 'nullable|in:draft,finalized,printed',
            'template_id' => 'nullable|exists:doctor_templates,id',

            'complaints' => 'nullable|array',
            'complaints.*.complaint_name' => 'required_with:complaints|string|max:255',
            'complaints.*.duration_text' => 'nullable|string|max:255',
            'complaints.*.note' => 'nullable|string|max:1000',

            'examinations' => 'nullable|array',
            'examinations.*.examination_name' => 'required_with:examinations|string|max:255',
            'examinations.*.finding_value' => 'nullable|string|max:255',
            'examinations.*.note' => 'nullable|string|max:1000',

            'sections' => 'nullable|array',
            'sections.*.section_type' => 'required_with:sections|in:past_history,drug_history,investigation,diagnosis,advice,next_plan,hospitalization,operation_note',
            'sections.*.content' => 'required_with:sections|string|max:5000',

            'medicines' => 'nullable|array',
            'medicines.*.medicine_id' => 'nullable|exists:medicines,id',
            'medicines.*.medicine_name' => 'required_with:medicines|string|max:255',
            'medicines.*.medicine_type' => 'nullable|string|max:100',
            'medicines.*.strength' => 'nullable|string|max:100',
            'medicines.*.generic_name' => 'nullable|string|max:255',
            'medicines.*.dose_morning' => 'nullable|numeric|min:0',
            'medicines.*.dose_noon' => 'nullable|numeric|min:0',
            'medicines.*.dose_afternoon' => 'nullable|numeric|min:0',
            'medicines.*.dose_night' => 'nullable|numeric|min:0',
            'medicines.*.dose_bedtime' => 'nullable|numeric|min:0',
            'medicines.*.timing' => 'nullable|in:before_meal,after_meal,empty_stomach,with_food,custom',
            'medicines.*.duration_value' => 'nullable|integer|min:0',
            'medicines.*.duration_unit' => 'nullable|in:days,weeks,months,years,continue,N_A',
            'medicines.*.custom_instruction' => 'nullable|string|max:1000',

            'follow_up_date' => 'nullable|date',
            'follow_up_duration_value' => 'nullable|integer|min:0',
            'follow_up_duration_unit' => 'nullable|in:days,months,years',

            'save_as_template' => 'nullable|boolean',
            'template_name' => 'nullable|required_if:save_as_template,true|string|max:150',
        ];
    }
}
