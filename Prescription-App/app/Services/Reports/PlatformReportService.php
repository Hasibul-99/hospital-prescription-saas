<?php

namespace App\Services\Reports;

use App\Models\Hospital;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class PlatformReportService
{
    public function subscriptionBreakdown(): array
    {
        return Cache::remember('rpt:platform:subs', now()->addHour(), function () {
            return Hospital::query()
                ->groupBy('subscription_status')
                ->orderBy('subscription_status')
                ->selectRaw('subscription_status as status, COUNT(*) as count')
                ->get()
                ->map(fn ($r) => ['status' => $r->status, 'count' => (int) $r->count])
                ->toArray();
        });
    }

    public function totals(): array
    {
        return Cache::remember('rpt:platform:totals', now()->addHour(), function () {
            return [
                'hospitals' => Hospital::count(),
                'doctors' => User::where('role', 'doctor')->count(),
                'patients' => Patient::count(),
                'prescriptions' => Prescription::count(),
            ];
        });
    }

    public function hospitalGrowth(int $months = 12): array
    {
        $key = "rpt:platform:growth:{$months}";

        return Cache::remember($key, now()->addHour(), function () use ($months) {
            $from = now()->subMonths($months - 1)->startOfMonth();
            $expr = $this->bucketExpression('created_at', 'monthly');

            return Hospital::query()
                ->where('created_at', '>=', $from)
                ->groupBy('bucket')
                ->orderBy('bucket')
                ->selectRaw("$expr as bucket, COUNT(*) as count")
                ->get()
                ->map(fn ($r) => ['bucket' => $r->bucket, 'count' => (int) $r->count])
                ->toArray();
        });
    }

    public function revenuePerHospital(): array
    {
        return Cache::remember('rpt:platform:revenue', now()->addHour(), function () {
            $plans = config('subscription.plans', []);

            return Hospital::query()
                ->orderByDesc('created_at')
                ->limit(50)
                ->get(['id', 'name', 'subscription_plan', 'subscription_status', 'subscription_ends_at'])
                ->map(fn ($h) => [
                    'id' => $h->id,
                    'name' => $h->name,
                    'plan' => $h->subscription_plan,
                    'monthly_fee' => (float) ($plans[$h->subscription_plan]['price'] ?? 0),
                    'status' => $h->subscription_status,
                    'ends_at' => $h->subscription_ends_at?->toDateString(),
                ])
                ->toArray();
        });
    }

    protected function bucketExpression(string $col, string $bucket): string
    {
        $driver = DB::connection()->getDriverName();
        return match ($bucket) {
            'monthly' => $driver === 'sqlite' ? "strftime('%Y-%m', {$col})" : "DATE_FORMAT({$col}, '%Y-%m')",
            default => "DATE({$col})",
        };
    }
}
