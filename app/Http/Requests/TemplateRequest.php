<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Unique;

class TemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'disease_name' => [
                'required', 'string', 'max:150',
                $this->uniqueDiseaseName(),
            ],
            // Accepted but ignored: the controller decides whether a template is
            // global from the route it was reached through, never from input.
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
            'advices.*.content' => 'required|string|max:500',

            'investigations' => 'nullable|array',
            'investigations.*.content' => 'required|string|max:500',
        ];
    }

    /**
     * Two templates with the same disease name are indistinguishable in the
     * doctor's picker, so names are unique within their own scope: per hospital
     * for global templates, per doctor for personal ones.
     */
    protected function uniqueDiseaseName(): Unique
    {
        $user = $this->user();
        $template = $this->route('template');
        $isGlobal = $template ? (bool) $template->is_global : $this->routeIs('hospital.*');

        $rule = Rule::unique('doctor_templates', 'disease_name')
            ->where('hospital_id', $user->hospital_id)
            ->where('is_global', $isGlobal)
            ->whereNull('deleted_at');

        if (! $isGlobal) {
            $rule->where('doctor_id', $user->id);
        }

        return $template ? $rule->ignore($template->id) : $rule;
    }

    public function messages(): array
    {
        return [
            'disease_name.unique' => 'A template with this name already exists.',
        ];
    }
}
