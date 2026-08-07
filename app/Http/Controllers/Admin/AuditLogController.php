<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Hospital;
use App\Models\User;
use App\Services\Reports\ReportExporter;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $filters = $this->filters($request);

        $logs = $this->query($filters)
            ->with(['user:id,name,role', 'hospital:id,name'])
            ->latest()
            ->paginate(25)
            ->withQueryString()
            ->through(fn (AuditLog $log) => $this->row($log));

        return Inertia::render('Admin/AuditLogs/Index', [
            'logs' => $this->paginateFor($logs),
            'filters' => $filters,
            'stats' => $this->stats($filters),
            // Options carry counts so the admin can see where the volume is
            // before committing to a filter.
            'actions' => $this->actionOptions(),
            'users' => User::query()
                ->whereIn('id', AuditLog::query()->distinct()->pluck('user_id')->filter())
                ->orderBy('name')
                ->get(['id', 'name', 'role']),
            'hospitals' => Hospital::query()
                ->whereIn('id', AuditLog::query()->distinct()->pluck('hospital_id')->filter())
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function exportCsv(Request $request, ReportExporter $exporter)
    {
        $filters = $this->filters($request);

        // Hard cap: an unbounded audit export can be millions of rows.
        $rows = $this->query($filters)
            ->with(['user:id,name,role', 'hospital:id,name'])
            ->latest()
            ->limit(5000)
            ->get()
            ->map(function (AuditLog $log) {
                $row = $this->row($log);

                return [
                    // Spreadsheet-friendly, unlike the ISO8601 the UI needs.
                    'created_at' => $log->created_at?->format('Y-m-d H:i:s'),
                    'user' => $row['user']['name'] ?? 'System',
                    'role' => $row['user']['role'] ?? '',
                    'action' => $row['action'],
                    'subject' => $row['subject_type'] . ($row['subject_id'] ? "#{$row['subject_id']}" : ''),
                    'hospital' => $row['hospital']['name'] ?? '',
                    'ip_address' => $row['ip_address'] ?? '',
                    'meta' => $row['meta'] ? json_encode($row['meta']) : '',
                ];
            })
            ->all();

        return $exporter->csvFromColumns('audit-logs-' . now()->format('Y-m-d') . '.csv', $rows, [
            'created_at' => 'When',
            'user' => 'User',
            'role' => 'Role',
            'action' => 'Action',
            'subject' => 'Subject',
            'hospital' => 'Hospital',
            'ip_address' => 'IP Address',
            'meta' => 'Details',
        ]);
    }

    /** @return array<string, string|null> */
    private function filters(Request $request): array
    {
        return [
            'search' => $request->input('search') ?: null,
            'action' => $request->input('action') ?: null,
            'user_id' => $request->input('user_id') ?: null,
            'hospital_id' => $request->input('hospital_id') ?: null,
            'date_from' => $request->input('date_from') ?: null,
            'date_to' => $request->input('date_to') ?: null,
        ];
    }

    private function query(array $filters): Builder
    {
        return AuditLog::query()
            ->when($filters['action'], function (Builder $q, string $action) {
                // A bare resource name ("prescription") matches the whole group;
                // a full key ("prescription.create") matches exactly.
                return str_contains($action, '.')
                    ? $q->where('action', $action)
                    : $q->where('action', 'like', "{$action}.%");
            })
            ->when($filters['user_id'], fn (Builder $q, $id) => $q->where('user_id', $id))
            ->when($filters['hospital_id'], fn (Builder $q, $id) => $q->where('hospital_id', $id))
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
            'hospital' => $log->hospital
                ? ['id' => $log->hospital->id, 'name' => $log->hospital->name]
                : null,
        ];
    }

    /** Headline counts for the current filter, plus an all-time "today". */
    private function stats(array $filters): array
    {
        $matching = $this->query($filters);

        $top = $this->query($filters)
            ->select('action', DB::raw('count(*) as total'))
            ->groupBy('action')
            ->orderByDesc('total')
            // Secondary sort so a tie resolves the same way every request
            // instead of drifting with whatever order the engine returns.
            ->orderBy('action')
            ->first();

        return [
            'matching' => (clone $matching)->count(),
            'total' => AuditLog::count(),
            'today' => AuditLog::whereDate('created_at', today())->count(),
            'actors' => (clone $matching)->distinct()->count('user_id'),
            'top_action' => $top?->action,
            'top_action_count' => (int) ($top?->total ?? 0),
        ];
    }

    /**
     * Distinct actions with row counts, grouped by the resource before the dot
     * so the filter reads as "Prescription › Created" rather than a flat list.
     */
    private function actionOptions(): array
    {
        return AuditLog::query()
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
