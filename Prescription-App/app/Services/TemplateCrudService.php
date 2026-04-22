<?php

namespace App\Services;

use App\Models\DoctorTemplate;
use App\Models\User;

class TemplateCrudService
{
    public function create(User $user, array $data, bool $asGlobal = false): DoctorTemplate
    {
        return DoctorTemplate::create([
            'doctor_id' => $asGlobal ? null : $user->id,
            'hospital_id' => $user->hospital_id,
            'disease_name' => $data['disease_name'],
            'complaints' => $this->normalizeComplaints($data['complaints'] ?? []),
            'examinations' => $this->normalizeExaminations($data['examinations'] ?? []),
            'medicines' => $this->normalizeMedicines($data['medicines'] ?? []),
            'advices' => $this->normalizeSections($data['advices'] ?? [], 'advice'),
            'investigations' => $this->normalizeSections($data['investigations'] ?? [], 'investigation'),
            'is_global' => $asGlobal,
            'use_count' => 0,
        ]);
    }

    public function update(DoctorTemplate $template, array $data): DoctorTemplate
    {
        $template->update([
            'disease_name' => $data['disease_name'] ?? $template->disease_name,
            'complaints' => $this->normalizeComplaints($data['complaints'] ?? []),
            'examinations' => $this->normalizeExaminations($data['examinations'] ?? []),
            'medicines' => $this->normalizeMedicines($data['medicines'] ?? []),
            'advices' => $this->normalizeSections($data['advices'] ?? [], 'advice'),
            'investigations' => $this->normalizeSections($data['investigations'] ?? [], 'investigation'),
        ]);

        return $template->fresh();
    }

    public function duplicate(User $user, DoctorTemplate $source): DoctorTemplate
    {
        return DoctorTemplate::create([
            'doctor_id' => $user->id,
            'hospital_id' => $user->hospital_id,
            'disease_name' => $source->disease_name . ' (copy)',
            'complaints' => $source->complaints,
            'examinations' => $source->examinations,
            'medicines' => $source->medicines,
            'advices' => $source->advices,
            'investigations' => $source->investigations,
            'is_global' => false,
            'use_count' => 0,
        ]);
    }

    public function recordUse(DoctorTemplate $template): void
    {
        $template->forceFill([
            'use_count' => ($template->use_count ?? 0) + 1,
            'last_used_at' => now(),
        ])->save();
    }

    protected function normalizeComplaints(array $rows): array
    {
        $out = [];
        foreach ($rows as $r) {
            if (empty($r['complaint_name'])) continue;
            $out[] = [
                'complaint_name' => $r['complaint_name'],
                'duration_text' => $r['duration_text'] ?? null,
                'note' => $r['note'] ?? null,
            ];
        }
        return $out;
    }

    protected function normalizeExaminations(array $rows): array
    {
        $out = [];
        foreach ($rows as $r) {
            if (empty($r['examination_name'])) continue;
            $out[] = [
                'examination_name' => $r['examination_name'],
                'finding_value' => $r['finding_value'] ?? null,
                'note' => $r['note'] ?? null,
            ];
        }
        return $out;
    }

    protected function normalizeMedicines(array $rows): array
    {
        $out = [];
        foreach ($rows as $r) {
            if (empty($r['medicine_name'])) continue;
            $out[] = [
                'medicine_id' => $r['medicine_id'] ?? null,
                'medicine_name' => $r['medicine_name'],
                'medicine_type' => $r['medicine_type'] ?? null,
                'strength' => $r['strength'] ?? null,
                'generic_name' => $r['generic_name'] ?? null,
                'dose_morning' => $r['dose_morning'] ?? null,
                'dose_noon' => $r['dose_noon'] ?? null,
                'dose_afternoon' => $r['dose_afternoon'] ?? null,
                'dose_night' => $r['dose_night'] ?? null,
                'dose_bedtime' => $r['dose_bedtime'] ?? null,
                'timing' => $r['timing'] ?? null,
                'duration_value' => $r['duration_value'] ?? null,
                'duration_unit' => $r['duration_unit'] ?? null,
                'custom_instruction' => $r['custom_instruction'] ?? null,
                'additional_doses' => $r['additional_doses'] ?? null,
            ];
        }
        return $out;
    }

    protected function normalizeSections(array $rows, string $type): array
    {
        $out = [];
        foreach ($rows as $r) {
            $content = is_string($r) ? $r : ($r['content'] ?? null);
            if (!$content) continue;
            $out[] = ['section_type' => $type, 'content' => $content];
        }
        return $out;
    }
}
