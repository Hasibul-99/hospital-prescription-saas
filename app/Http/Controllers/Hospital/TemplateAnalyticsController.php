<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Models\DoctorTemplate;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TemplateAnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        abort_unless($user->isHospitalAdmin() || $user->isSuperAdmin(), 403);

        $range = (int) $request->input('days', 90);
        $since = now()->subDays($range);

        $top = DoctorTemplate::query()
            ->selectRaw('doctor_templates.*')
            ->with('doctor:id,name')
            ->where('use_count', '>', 0)
            ->orderByDesc('use_count')
            ->orderByDesc('last_used_at')
            ->limit(50)
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'disease_name' => $t->disease_name,
                'is_global' => (bool) $t->is_global,
                'use_count' => (int) $t->use_count,
                'last_used_at' => $t->last_used_at?->toDateTimeString(),
                'doctor_name' => $t->doctor?->name ?? '—',
                'medicine_count' => is_array($t->medicines) ? count($t->medicines) : 0,
            ]);

        $recent = DoctorTemplate::query()
            ->where('last_used_at', '>=', $since)
            ->orderByDesc('last_used_at')
            ->limit(20)
            ->with('doctor:id,name')
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'disease_name' => $t->disease_name,
                'doctor_name' => $t->doctor?->name ?? '—',
                'last_used_at' => $t->last_used_at?->toDateTimeString(),
            ]);

        $totals = [
            'total_templates' => DoctorTemplate::query()->count(),
            'global_templates' => DoctorTemplate::query()->where('is_global', true)->count(),
            'total_uses' => (int) DoctorTemplate::query()->sum('use_count'),
            'active_last_period' => DoctorTemplate::query()->where('last_used_at', '>=', $since)->count(),
        ];

        return Inertia::render('Hospital/Templates/Analytics', [
            'top' => $top,
            'recent' => $recent,
            'totals' => $totals,
            'filters' => ['days' => $range],
        ]);
    }
}
