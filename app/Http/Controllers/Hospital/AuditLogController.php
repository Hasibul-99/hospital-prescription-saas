<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        abort_unless($user->isHospitalAdmin() || $user->isSuperAdmin(), 403);

        $filters = $this->filters($request);

        $logs = $this->query($user->hospital_id, $filters)
            ->with('user:id,name,role')
            ->latest()
            ->paginate(25)
            ->withQueryString()
            ->through(fn (AuditLog $log) => $this->row($log));

        return Inertia::render('Hospital/AuditLogs/Index', [
            'logs' => $this->paginateFor($logs),
            'filters' => $filters,
            'stats' => $this->stats($user->hospital_id, $filters),
            // Options carry counts so the admin can see where the volume is
            // before committing to a filter.
            'actions' => $this->actionOptions($user->hospital_id),
            'users' => User::query()
                ->whereIn('id', AuditLog::query()
                    ->where('hospital_id', $user->hospital_id)
                    ->distinct()
                    ->pluck('user_id')
                    ->filter())
                ->orderBy('name')
                ->get(['id', 'name', 'role']),
        ]);
    }

    /** @return array<string, string|null> */
    private function filters(Request $request): array
    {
        return [
            'search' => $request->input('search') ?: null,
            'action' => $request->input('action') ?: null,
            'user_id' => $request->input('user_id') ?: null,
            'date_from' => $request->input('date_from') ?: null,
            'date_to' => $request->input('date_to') ?: null,
        ];
    }

    private function query(?int $hospitalId, array $filters): Builder
    {
        return AuditLog::query()
            ->where('hospital_id', $hospitalId)
            ->when($filters['action'], function (Builder $q, string $action) {
                // A bare resource name ("prescription") matches the whole group;
                // a full key ("prescription.create") matches exactly.
                return str_contains($action, '.')
                    ? $q->where('action', $action)
                    : $q->where('action', 'like', "{$action}.%");
            })
            ->when($filters['user_id'], fn (Builder $q, $id) => $q->where('user_id', $id))
            ->when($filters['date_from'], fn (Builder $q, $d) => $q->whereDate('created_at', '>=', $d))
            ->when($filters['date_to'], fn (Builder $q, $d) => $q->whereDate('created_at', '<=', $d))
            ->when($filters['search'], function (Builder $q, string $term) {
                $like = "%{$term}%";

                return $q->where(function (Builder $q2) use ($like, $term) {
                    $q2->where('action', 'like', $like)
                        ->orWhere('ip_address', 'like', $like)
                        ->orWhere('subject_type', 'like', $like)
                        ->orWhereHas('user', fn (Builder $q3) => $q3->where('name', 'like', $like))
                        ->when(ctype_digit($term), fn (Builder $q3) => $q3->orWhere('subject_id', (int) $term));
                });
            });
    }

    private function row(AuditLog $log): array
    {
        return [
            'id' => $log->id,
            'action' => $log->action,
            'subject_type' => class_basename($log->subject_type),
            'subject_id' => $log->subject_id,
            'meta' => $log->meta,
            'ip_address' => $log->ip_address,
            'created_at' => $log->created_at?->toIso8601String(),
            'user' => $log->user
                ? ['id' => $log->user->id, 'name' => $log->user->name, 'role' => $log->user->role]
                : null,
        ];
    }

    /** Headline counts for the current filter, plus an unfiltered "today". */
    private function stats(?int $hospitalId, array $filters): array
    {
        $matching = $this->query($hospitalId, $filters);

        $top = $this->query($hospitalId, $filters)
            ->select('action', DB::raw('count(*) as total'))
            ->groupBy('action')
            ->orderByDesc('total')
            // Secondary sort so a tie resolves the same way every request
            // instead of drifting with whatever order the engine returns.
            ->orderBy('action')
            ->first();

        return [
            'matching' => (clone $matching)->count(),
            'total' => AuditLog::where('hospital_id', $hospitalId)->count(),
            'today' => AuditLog::where('hospital_id', $hospitalId)->whereDate('created_at', today())->count(),
            'actors' => (clone $matching)->distinct()->count('user_id'),
            'top_action' => $top?->action,
            'top_action_count' => (int) ($top?->total ?? 0),
        ];
    }

    /**
     * Distinct actions with row counts, grouped by the resource before the dot
     * so the filter reads as "Prescription › Created" rather than a flat list.
     */
    private function actionOptions(?int $hospitalId): array
    {
        return AuditLog::query()
            ->where('hospital_id', $hospitalId)
            ->select('action', DB::raw('count(*) as total'))
            ->groupBy('action')
            ->orderBy('action')
            ->get()
            ->map(fn ($r) => [
                'value' => $r->action,
                'group' => str_contains($r->action, '.') ? explode('.', $r->action)[0] : 'other',
                'count' => (int) $r->total,
            ])
            ->all();
    }
}
