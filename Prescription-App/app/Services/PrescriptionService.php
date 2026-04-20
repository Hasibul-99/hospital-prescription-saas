<?php

namespace App\Services;

use App\Models\DoctorTemplate;
use App\Models\Prescription;
use App\Models\PrescriptionComplaint;
use App\Models\PrescriptionExamination;
use App\Models\PrescriptionMedicine;
use App\Models\PrescriptionSection;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class PrescriptionService
{
    /**
     * Create or update a prescription with all nested relations. Idempotent.
     */
    public function save(User $doctor, array $data, ?Prescription $existing = null): Prescription
    {
        return DB::transaction(function () use ($doctor, $data, $existing) {
            $attrs = [
                'hospital_id' => $doctor->hospital_id,
                'doctor_id' => $doctor->id,
                'patient_id' => $data['patient_id'],
                'appointment_id' => $data['appointment_id'] ?? null,
                'date' => $data['date'] ?? now()->toDateString(),
                'template_id' => $data['template_id'] ?? null,
                'status' => $data['status'] ?? 'draft',
                'follow_up_date' => $data['follow_up_date'] ?? null,
                'follow_up_duration_value' => $data['follow_up_duration_value'] ?? null,
                'follow_up_duration_unit' => $data['follow_up_duration_unit'] ?? null,
            ];

            $rx = $existing ?? new Prescription();
            $rx->fill($attrs)->save();

            $this->syncChildren($rx, $data);

            if (!empty($data['save_as_template']) && !empty($data['template_name'])) {
                $this->saveAsTemplate($doctor, $data);
            }

            return $rx->fresh(['complaints', 'examinations', 'sections', 'medicines']);
        });
    }

    protected function syncChildren(Prescription $rx, array $data): void
    {
        $rx->complaints()->delete();
        foreach ($data['complaints'] ?? [] as $i => $c) {
            PrescriptionComplaint::create([
                'prescription_id' => $rx->id,
                'complaint_name' => $c['complaint_name'],
                'duration_text' => $c['duration_text'] ?? null,
                'note' => $c['note'] ?? null,
                'sort_order' => $i,
            ]);
        }

        $rx->examinations()->delete();
        foreach ($data['examinations'] ?? [] as $i => $e) {
            PrescriptionExamination::create([
                'prescription_id' => $rx->id,
                'examination_name' => $e['examination_name'],
                'finding_value' => $e['finding_value'] ?? null,
                'note' => $e['note'] ?? null,
                'sort_order' => $i,
            ]);
        }

        $rx->sections()->delete();
        foreach ($data['sections'] ?? [] as $i => $s) {
            PrescriptionSection::create([
                'prescription_id' => $rx->id,
                'section_type' => $s['section_type'],
                'content' => $s['content'],
                'sort_order' => $i,
            ]);
        }

        $rx->medicines()->delete();
        foreach ($data['medicines'] ?? [] as $i => $m) {
            PrescriptionMedicine::create([
                'prescription_id' => $rx->id,
                'medicine_id' => $m['medicine_id'] ?? null,
                'medicine_name' => $m['medicine_name'],
                'medicine_type' => $m['medicine_type'] ?? null,
                'strength' => $m['strength'] ?? null,
                'generic_name' => $m['generic_name'] ?? null,
                'dose_morning' => $m['dose_morning'] ?? null,
                'dose_noon' => $m['dose_noon'] ?? null,
                'dose_afternoon' => $m['dose_afternoon'] ?? null,
                'dose_night' => $m['dose_night'] ?? null,
                'dose_bedtime' => $m['dose_bedtime'] ?? null,
                'dose_display' => $this->doseDisplay($m),
                'timing' => $m['timing'] ?? null,
                'duration_value' => $m['duration_value'] ?? null,
                'duration_unit' => $m['duration_unit'] ?? null,
                'custom_instruction' => $m['custom_instruction'] ?? null,
                'sort_order' => $i,
            ]);
        }
    }

    protected function doseDisplay(array $m): ?string
    {
        $parts = [
            $m['dose_morning'] ?? null,
            $m['dose_noon'] ?? null,
            $m['dose_afternoon'] ?? null,
            $m['dose_night'] ?? null,
            $m['dose_bedtime'] ?? null,
        ];

        if (!array_filter($parts, fn ($p) => $p !== null && $p !== '')) {
            return null;
        }

        return implode('+', array_map(fn ($p) => rtrim(rtrim((string) ($p ?? 0), '0'), '.') ?: '0', $parts));
    }

    protected function saveAsTemplate(User $doctor, array $data): DoctorTemplate
    {
        return DoctorTemplate::create([
            'doctor_id' => $doctor->id,
            'hospital_id' => $doctor->hospital_id,
            'disease_name' => $data['template_name'],
            'complaints' => $data['complaints'] ?? [],
            'examinations' => $data['examinations'] ?? [],
            'medicines' => $data['medicines'] ?? [],
            'advices' => $this->sectionsOfType($data, 'advice'),
            'investigations' => $this->sectionsOfType($data, 'investigation'),
            'is_global' => false,
        ]);
    }

    protected function sectionsOfType(array $data, string $type): array
    {
        return array_values(array_filter(
            $data['sections'] ?? [],
            fn ($s) => ($s['section_type'] ?? null) === $type
        ));
    }
}
