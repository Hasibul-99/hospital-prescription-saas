<?php

namespace App\Services;

use App\Models\Hospital;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

class DashboardStatsService
{
    public const TTL_SECONDS = 300;

    public function platformStats(): array
    {
        return Cache::remember('dash:platform:stats', self::TTL_SECONDS, fn () => [
            'total_hospitals' => Hospital::count(),
            'total_doctors' => User::where('role', 'doctor')->count(),
            'total_prescriptions' => Prescription::withoutGlobalScopes()->count(),
            'active_subscriptions' => Hospital::whereIn('subscription_status', ['active', 'trial'])->count(),
        ]);
    }

    public function hospitalStats(int $hospitalId): array
    {
        return Cache::remember("dash:hosp:{$hospitalId}:stats", self::TTL_SECONDS, fn () => [
            'doctors' => User::where('hospital_id', $hospitalId)->where('role', 'doctor')->count(),
            'patients' => Patient::where('hospital_id', $hospitalId)->count(),
            'prescriptions_today' => Prescription::where('hospital_id', $hospitalId)
                ->whereDate('date', now()->toDateString())
                ->count(),
            'prescriptions_total' => Prescription::where('hospital_id', $hospitalId)->count(),
        ]);
    }

    public function doctorStats(int $doctorId, int $hospitalId): array
    {
        return Cache::remember("dash:doc:{$doctorId}:stats", self::TTL_SECONDS, fn () => [
            'patients_today' => Prescription::where('hospital_id', $hospitalId)
                ->where('doctor_id', $doctorId)
                ->whereDate('date', now()->toDateString())
                ->distinct('patient_id')
                ->count('patient_id'),
            'prescriptions_total' => Prescription::where('hospital_id', $hospitalId)
                ->where('doctor_id', $doctorId)
                ->count(),
        ]);
    }

    public function invalidateForHospital(int $hospitalId): void
    {
        Cache::forget("dash:hosp:{$hospitalId}:stats");
        Cache::forget('dash:platform:stats');
    }

    public function invalidateForDoctor(int $doctorId, int $hospitalId): void
    {
        Cache::forget("dash:doc:{$doctorId}:stats");
        $this->invalidateForHospital($hospitalId);
    }
}
