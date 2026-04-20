<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Chamber;
use App\Models\DoctorProfile;
use App\Models\HospitalHoliday;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class SerialQueueService
{
    /**
     * Fetch queue rows for a doctor on a given date + optional chamber.
     */
    public function queueFor(User $doctor, string $date, ?int $chamberId = null)
    {
        return Appointment::query()
            ->with([
                'patient:id,patient_uid,name,age_years,age_months,age_days,gender,phone',
                'chamber:id,name,room_number',
                'prescription:id,appointment_id,prescription_uid',
            ])
            ->where('doctor_id', $doctor->id)
            ->where('appointment_date', $date)
            ->when($chamberId, fn ($q, $id) => $q->where('chamber_id', $id))
            ->orderBy('serial_number')
            ->get();
    }

    /**
     * Aggregate stats: today's total, completed, waiting, follow-ups, absent, earned.
     */
    public function statsFor(User $doctor, string $date, ?int $chamberId = null): array
    {
        $base = Appointment::query()
            ->where('doctor_id', $doctor->id)
            ->where('appointment_date', $date)
            ->when($chamberId, fn ($q, $id) => $q->where('chamber_id', $id));

        $rows = (clone $base)->get();

        return [
            'total' => $rows->count(),
            'completed' => $rows->where('status', 'completed')->count(),
            'waiting' => $rows->where('status', 'waiting')->count(),
            'in_progress' => $rows->where('status', 'in_progress')->count(),
            'follow_ups' => $rows->where('type', 'follow_up')->count(),
            'absent' => $rows->where('status', 'absent')->count(),
            'total_earned' => (float) $rows->where('fee_paid', true)->sum('fee_amount'),
            'total_unpaid' => (float) $rows->where('fee_paid', false)->whereNotIn('status', ['cancelled'])->sum('fee_amount'),
        ];
    }

    /**
     * Move current in_progress → completed, pull next waiting → in_progress.
     */
    public function advance(User $doctor, string $date, ?int $chamberId = null): ?Appointment
    {
        $current = Appointment::query()
            ->where('doctor_id', $doctor->id)
            ->where('appointment_date', $date)
            ->when($chamberId, fn ($q, $id) => $q->where('chamber_id', $id))
            ->where('status', 'in_progress')
            ->first();

        if ($current) {
            $current->update(['status' => 'completed']);
        }

        $next = Appointment::query()
            ->where('doctor_id', $doctor->id)
            ->where('appointment_date', $date)
            ->when($chamberId, fn ($q, $id) => $q->where('chamber_id', $id))
            ->where('status', 'waiting')
            ->orderBy('serial_number')
            ->first();

        if ($next) {
            $next->update(['status' => 'in_progress']);
        }

        return $next;
    }

    /**
     * Break toggle stored per (doctor, date, chamber) in cache — cheap, no schema change.
     */
    public function breakKey(int $doctorId, string $date, ?int $chamberId): string
    {
        return "queue:break:{$doctorId}:{$date}:" . ($chamberId ?? 'all');
    }

    public function isOnBreak(int $doctorId, string $date, ?int $chamberId): bool
    {
        return (bool) Cache::get($this->breakKey($doctorId, $date, $chamberId), false);
    }

    public function setBreak(int $doctorId, string $date, ?int $chamberId, bool $on): void
    {
        $key = $this->breakKey($doctorId, $date, $chamberId);
        $on ? Cache::put($key, true, now()->endOfDay()) : Cache::forget($key);
    }

    /**
     * Holiday check: matches exact date OR recurring (month/day only).
     */
    public function isHoliday(int $hospitalId, string $date): ?HospitalHoliday
    {
        $carbon = Carbon::parse($date);

        return HospitalHoliday::query()
            ->where('hospital_id', $hospitalId)
            ->where(function ($q) use ($date, $carbon) {
                $q->where('date', $date)
                  ->orWhere(function ($q) use ($carbon) {
                      $q->where('is_recurring_yearly', true)
                        ->whereRaw("strftime('%m-%d', date) = ?", [$carbon->format('m-d')]);
                  });
            })
            ->first();
    }

    public function consultationFee(int $doctorId, int $hospitalId, string $type = 'new_visit'): float
    {
        $profile = DoctorProfile::query()
            ->where('user_id', $doctorId)
            ->where('hospital_id', $hospitalId)
            ->first();

        if (!$profile) {
            return 0.0;
        }

        return (float) ($type === 'follow_up' ? ($profile->follow_up_fee ?: $profile->consultation_fee) : $profile->consultation_fee);
    }

    public function chambersForDoctor(int $doctorId): \Illuminate\Support\Collection
    {
        return Chamber::query()
            ->where('doctor_id', $doctorId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'room_number', 'floor', 'building', 'schedule']);
    }
}
