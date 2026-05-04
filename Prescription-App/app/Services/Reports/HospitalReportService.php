<?php

namespace App\Services\Reports;

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\PrescriptionMedicine;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class HospitalReportService
{
    public function doctorPatientLoad(int $hospitalId, Carbon $from, Carbon $to): array
    {
        $key = "rpt:hosp:{$hospitalId}:doc_load:{$from->toDateString()}:{$to->toDateString()}";

        return Cache::remember($key, now()->addHour(), function () use ($hospitalId, $from, $to) {
            return Appointment::query()
                ->join('users', 'users.id', '=', 'appointments.doctor_id')
                ->where('appointments.hospital_id', $hospitalId)
                ->whereBetween('appointments.appointment_date', [$from->toDateString(), $to->toDateString()])
                ->whereIn('appointments.status', ['completed', 'in_progress'])
                ->groupBy('users.id', 'users.name')
                ->orderByDesc(DB::raw('COUNT(*)'))
                ->selectRaw('users.id as doctor_id, users.name as doctor_name, COUNT(*) as visits, COUNT(DISTINCT appointments.patient_id) as unique_patients')
                ->get()
                ->map(fn ($r) => [
                    'doctor_id' => (int) $r->doctor_id,
                    'doctor_name' => $r->doctor_name,
                    'visits' => (int) $r->visits,
                    'unique_patients' => (int) $r->unique_patients,
                ])
                ->toArray();
        });
    }

    public function revenue(int $hospitalId, string $bucket, Carbon $from, Carbon $to): array
    {
        $key = "rpt:hosp:{$hospitalId}:revenue:{$bucket}:{$from->toDateString()}:{$to->toDateString()}";

        return Cache::remember($key, now()->addHour(), function () use ($hospitalId, $bucket, $from, $to) {
            $expr = $this->bucketExpression('appointment_date', $bucket);

            return Appointment::query()
                ->where('hospital_id', $hospitalId)
                ->where('fee_paid', true)
                ->whereBetween('appointment_date', [$from->toDateString(), $to->toDateString()])
                ->groupBy('bucket')
                ->orderBy('bucket')
                ->selectRaw("$expr as bucket, SUM(fee_amount) as total")
                ->get()
                ->map(fn ($r) => ['bucket' => $r->bucket, 'total' => (float) $r->total])
                ->toArray();
        });
    }

    public function revenueByDoctor(int $hospitalId, Carbon $from, Carbon $to): array
    {
        $key = "rpt:hosp:{$hospitalId}:revenue_by_doc:{$from->toDateString()}:{$to->toDateString()}";

        return Cache::remember($key, now()->addHour(), function () use ($hospitalId, $from, $to) {
            return Appointment::query()
                ->join('users', 'users.id', '=', 'appointments.doctor_id')
                ->where('appointments.hospital_id', $hospitalId)
                ->where('appointments.fee_paid', true)
                ->whereBetween('appointments.appointment_date', [$from->toDateString(), $to->toDateString()])
                ->groupBy('users.id', 'users.name')
                ->orderByDesc(DB::raw('SUM(appointments.fee_amount)'))
                ->selectRaw('users.id as doctor_id, users.name as doctor_name, SUM(appointments.fee_amount) as total')
                ->get()
                ->map(fn ($r) => [
                    'doctor_id' => (int) $r->doctor_id,
                    'doctor_name' => $r->doctor_name,
                    'total' => (float) $r->total,
                ])
                ->toArray();
        });
    }

    public function demographics(int $hospitalId): array
    {
        $key = "rpt:hosp:{$hospitalId}:demographics";

        return Cache::remember($key, now()->addHour(), function () use ($hospitalId) {
            $byGender = Patient::query()
                ->where('hospital_id', $hospitalId)
                ->groupBy('gender')
                ->selectRaw('gender, COUNT(*) as count')
                ->get()
                ->map(fn ($r) => ['gender' => $r->gender, 'count' => (int) $r->count])
                ->toArray();

            $buckets = [
                ['label' => '0-12',   'min' => 0,  'max' => 12],
                ['label' => '13-25',  'min' => 13, 'max' => 25],
                ['label' => '26-40',  'min' => 26, 'max' => 40],
                ['label' => '41-60',  'min' => 41, 'max' => 60],
                ['label' => '61+',    'min' => 61, 'max' => 200],
            ];

            $byAge = [];
            foreach ($buckets as $b) {
                $byAge[] = [
                    'bucket' => $b['label'],
                    'count' => Patient::query()
                        ->where('hospital_id', $hospitalId)
                        ->whereBetween('age_years', [$b['min'], $b['max']])
                        ->count(),
                ];
            }

            return [
                'by_gender' => $byGender,
                'by_age' => $byAge,
            ];
        });
    }

    public function topMedicines(int $hospitalId, Carbon $from, Carbon $to, int $limit = 15): array
    {
        $key = "rpt:hosp:{$hospitalId}:top_med:{$from->toDateString()}:{$to->toDateString()}:{$limit}";

        return Cache::remember($key, now()->addHour(), function () use ($hospitalId, $from, $to, $limit) {
            return PrescriptionMedicine::query()
                ->join('prescriptions', 'prescriptions.id', '=', 'prescription_medicines.prescription_id')
                ->where('prescriptions.hospital_id', $hospitalId)
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

    public function newVsReturning(int $hospitalId, Carbon $from, Carbon $to): array
    {
        $key = "rpt:hosp:{$hospitalId}:new_vs_ret:{$from->toDateString()}:{$to->toDateString()}";

        return Cache::remember($key, now()->addHour(), function () use ($hospitalId, $from, $to) {
            $appts = Appointment::query()
                ->where('hospital_id', $hospitalId)
                ->whereBetween('appointment_date', [$from->toDateString(), $to->toDateString()])
                ->whereIn('status', ['completed', 'in_progress'])
                ->select(['patient_id', 'appointment_date'])
                ->get();

            $newCount = 0;
            $returningCount = 0;
            foreach ($appts as $a) {
                $hadEarlier = Appointment::query()
                    ->where('hospital_id', $hospitalId)
                    ->where('patient_id', $a->patient_id)
                    ->where('appointment_date', '<', $a->appointment_date)
                    ->whereIn('status', ['completed', 'in_progress'])
                    ->exists();
                if ($hadEarlier) {
                    $returningCount++;
                } else {
                    $newCount++;
                }
            }

            return ['new' => $newCount, 'returning' => $returningCount];
        });
    }

    public function utilization(int $hospitalId, Carbon $from, Carbon $to): array
    {
        $totalAppointments = Appointment::query()
            ->where('hospital_id', $hospitalId)
            ->whereBetween('appointment_date', [$from->toDateString(), $to->toDateString()])
            ->count();

        $completed = Appointment::query()
            ->where('hospital_id', $hospitalId)
            ->whereBetween('appointment_date', [$from->toDateString(), $to->toDateString()])
            ->where('status', 'completed')
            ->count();

        $absent = Appointment::query()
            ->where('hospital_id', $hospitalId)
            ->whereBetween('appointment_date', [$from->toDateString(), $to->toDateString()])
            ->where('status', 'absent')
            ->count();

        $totalDoctors = User::query()
            ->where('hospital_id', $hospitalId)
            ->where('role', 'doctor')
            ->where('is_active', true)
            ->count();

        return [
            'total_appointments' => $totalAppointments,
            'completed' => $completed,
            'absent' => $absent,
            'completion_rate' => $totalAppointments > 0 ? round(($completed / $totalAppointments) * 100, 1) : 0,
            'absent_rate' => $totalAppointments > 0 ? round(($absent / $totalAppointments) * 100, 1) : 0,
            'active_doctors' => $totalDoctors,
        ];
    }

    protected function bucketExpression(string $col, string $bucket): string
    {
        $driver = DB::connection()->getDriverName();
        return match ($bucket) {
            'daily' => $driver === 'sqlite' ? "strftime('%Y-%m-%d', {$col})" : "DATE({$col})",
            'weekly' => $driver === 'sqlite' ? "strftime('%Y-W%W', {$col})" : "DATE_FORMAT({$col}, '%x-W%v')",
            'monthly' => $driver === 'sqlite' ? "strftime('%Y-%m', {$col})" : "DATE_FORMAT({$col}, '%Y-%m')",
            default => "DATE({$col})",
        };
    }
}
