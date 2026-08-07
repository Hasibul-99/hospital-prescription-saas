<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PlanRequest extends FormRequest
{
    /** Route middleware (`role:super_admin`) already gates every plan route. */
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $planId = $this->route('plan')?->id;

        return [
            // The code is the stable machine key other rows point at by name in
            // seeders and tests, so it is set once at create and never edited.
            'code' => $planId
                ? ['nullable']
                : ['required', 'string', 'max:50', 'regex:/^[a-z0-9_-]+$/', Rule::unique('plans', 'code')->withoutTrashed()],

            'name' => ['required', 'string', 'max:100'],
            'name_bn' => ['nullable', 'string', 'max:100'],
            'tagline' => ['nullable', 'string', 'max:255'],
            'tagline_bn' => ['nullable', 'string', 'max:255'],

            'price_monthly' => ['required', 'numeric', 'min:0', 'max:99999999'],
            'price_yearly' => ['nullable', 'numeric', 'min:0', 'max:99999999'],

            // NULL means unlimited, so these are nullable rather than required.
            'max_doctors' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'max_patients_per_month' => ['nullable', 'integer', 'min:1', 'max:10000000'],
            'max_prescriptions' => ['nullable', 'integer', 'min:1', 'max:10000000'],

            'trial_days' => ['required', 'integer', 'min:0', 'max:365'],

            'features' => ['nullable', 'array', 'max:20'],
            'features.*.en' => ['required', 'string', 'max:150'],
            'features.*.bn' => ['nullable', 'string', 'max:150'],

            'cta_label' => ['nullable', 'string', 'max:50'],
            'cta_label_bn' => ['nullable', 'string', 'max:50'],

            'is_public' => ['boolean'],
            'is_featured' => ['boolean'],
            'is_active' => ['boolean'],
            'sort_order' => ['required', 'integer', 'min:0', 'max:9999'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.regex' => 'The code may only contain lowercase letters, numbers, hyphens and underscores.',
            'features.*.en.required' => 'Every feature needs English text (Bangla is optional).',
        ];
    }

    /**
     * Blank number inputs arrive as empty strings from the antd form; they mean
     * "unlimited", which is NULL — not 0.
     */
    protected function prepareForValidation(): void
    {
        $nullable = ['max_doctors', 'max_patients_per_month', 'max_prescriptions', 'price_yearly'];
        $replacements = [];

        foreach ($nullable as $field) {
            if ($this->input($field) === '') {
                $replacements[$field] = null;
            }
        }

        // Drop feature rows the user left entirely blank rather than failing them.
        if (is_array($this->input('features'))) {
            $replacements['features'] = array_values(array_filter(
                $this->input('features'),
                fn ($row) => is_array($row) && trim((string) ($row['en'] ?? '')) !== ''
            ));
        }

        if ($replacements) {
            $this->merge($replacements);
        }
    }
}
