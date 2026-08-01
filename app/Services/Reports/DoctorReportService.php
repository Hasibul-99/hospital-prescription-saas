<?php

namespace App\Services\Reports;

use App\Models\Appointment;
use App\Models\Prescription;
use App\Models\PrescriptionMedicine;
use App\Models\PrescriptionSection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DoctorReportService
{
    public function patientCount(int $doctorId, int $hospitalId, string $bucket, Carbon $from, Carbon $to): array
    {
        $key = "rpt:doc:{$doctorId}:patient_count:{$bucket}:{$from->toDateString()}:{$to->toDateString()}";

        return Cache::remember($key, now()->addHour(), function () use ($doctorId, $hospitalId, $bucket, $from, $to) {
            $expr = $this->bucketExpression('appointment_date', $bucket);

            return Appointment::query()
                ->where('hospital_id', $hospitalId)
                ->where('doctor_id', $doctorId)
                ->whereBetween('appointment_date', [$from->toDateString(), $to->toDateString()])
                ->whereIn('status', ['completed', 'in_progress'])
                ->groupBy('bucket')
                ->orderBy('bucket')
                ->selectRaw("$expr as bucket, COUNT(DISTINCT patient_id) as count")
                ->get()
                ->map(fn ($r) => ['bucket' => $r->bucket, 'count' => (int) $r->count])
                ->toArray();
        });
    }

    public function diseaseBreakdown(int $doctorId, int $hospitalId, Carbon $from, Carbon $to): array
    {
        $key = "rpt:doc:{$doctorId}:disease:{$from->toDateString()}:{$to->toDateString()}";

        return Cache::remember($key, now()->addHour(), function () use ($doctorId, $hospitalId, $from, $to) {
            return PrescriptionSection::query()
                ->join('prescriptions', 'prescriptions.id', '=', 'prescription_sections.prescription_id')
                ->where('prescriptions.hospital_id', $hospitalId)
                ->where('prescriptions.doctor_id', $doctorId)
                ->whereBetween('prescriptions.date', [$from->toDateString(), $to->toDateString()])
                ->where('prescription_sections.section_type', 'diagnosis')
                ->groupBy('prescription_sections.content')
                ->orderByDesc(DB::raw('COUNT(*)'))
                ->limit(15)
                ->selectRaw('prescription_sections.content as label, COUNT(*) as value')
                ->get()
                ->map(fn ($r) => ['label' => $r->label, 'value' => (int) $r->value])
                ->toArray();
        });
    }

    public function topMedicines(int $doctorId, int $hospitalId, Carbon $from, Carbon $to, int $limit = 15): array
    {
        $key = "rpt:doc:{$doctorId}:top_med:{$from->toDateString()}:{$to->toDateString()}:{$limit}";

        return Cache::remember($key, now()->addHour(), function () use ($doctorId, $hospitalId, $from, $to, $limit) {
            return PrescriptionMedicine::query()
                ->join('prescriptions', 'prescriptions.id', '=', 'prescription_medicines.prescription_id')
                ->where('prescriptions.hospital_id', $hospitalId)
                ->where('prescriptions.doctor_id', $doctorId)
                ->whereBetween('prescriptions.date', [$from->toDateString(), $to->toDateString()])
                ->groupBy('prescription_medicines.medicine_name')
                ->orderByDesc(DB::raw('COUNT(*)'))
                ->limit($limit)
                ->selectRaw('prescription_medicines.medicine_name as label, COUNT(*) as value')
                ->get()
                ->map(fn ($r) => ['label' => $r->label, 'value' => (int) $r->value])
                ->toArray();
        });
    }

    public function followUpCompliance(int $doctorId, int $hospitalId, Carbon $from, Carbon $to): array
    {
        $key = "rpt:doc:{$doctorId}:fu_comp:{$from->toDateString()}:{$to->toDateString()}";

        return Cache::remember($key, now()->addHour(), function () use ($doctorId, $hospitalId, $from, $to) {
            $rxWithFu = Prescription::query()
                ->where('hospital_id', $hospitalId)
                ->where('doctor_id', $doctorId)
                ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
                ->whereNotNull('follow_up_date')
                ->get(['id', 'patient_id', 'follow_up_date']);

            $expected = $rxWithFu->count();
            if ($expected === 0) {
                return ['expected' => 0, 'returned' => 0, 'rate' => 0];
            }

            $returned = 0;
            foreach ($rxWithFu as $rx) {
                $hit = Appointment::query()
                    ->where('hospital_id', $hospitalId)
                    ->where('doctor_id', $doctorId)
                    ->where('patient_id', $rx->patient_id)
                    ->where('appointment_date', '>=', $rx->follow_up_date)
                    ->where('appointment_date', '<=', Carbon::parse($rx->follow_up_date)->addDays(14)->toDateString())
                    ->whereIn('status', ['completed', 'in_progress'])
                    ->exists();
                if ($hit) {
                    $returned++;
                }
            }

            return [
                'expected' => $expected,
                'returned' => $returned,
                'rate' => round(($returned / $expected) * 100, 1),
            ];
        });
    }

    protected function bucketExpression(string $col, string $bucket): string
    {
        $driver = DB::connection()->getDriverName();
        return match ($bucket) {
            'daily' => $driver === 'sqlite'
                ? "strftime('%Y-%m-%d', {$col})"
                : "DATE({$col})",
            'weekly' => $driver === 'sqlite'
                ? "strftime('%Y-W%W', {$col})"
                : "DATE_FORMAT({$col}, '%x-W%v')",
            'monthly' => $driver === 'sqlite'
                ? "strftime('%Y-%m', {$col})"
                : "DATE_FORMAT({$col}, '%Y-%m')",
            default => "DATE({$col})",
        };
    }
}
