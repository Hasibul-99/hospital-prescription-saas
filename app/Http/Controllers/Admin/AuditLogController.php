<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $action = $request->input('action');
        $hospitalId = $request->input('hospital_id');

        $logs = AuditLog::query()
            ->with('user:id,name,role')
            ->when($action, fn ($q) => $q->where('action', $action))
            ->when($hospitalId, fn ($q) => $q->where('hospital_id', $hospitalId))
            ->latest()
            ->paginate(25)
            ->withQueryString()
            ->through(fn ($log) => [
                'id' => $log->id,
                'action' => $log->action,
                'subject_type' => class_basename($log->subject_type),
                'subject_id' => $log->subject_id,
                'hospital_id' => $log->hospital_id,
                'meta' => $log->meta,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at?->toDateTimeString(),
                'user' => $log->user ? ['id' => $log->user->id, 'name' => $log->user->name, 'role' => $log->user->role] : null,
            ]);

        $actions = AuditLog::query()->select('action')->distinct()->pluck('action');

        return Inertia::render('Admin/AuditLogs/Index', [
            'logs' => $this->paginateFor($logs),
            'filters' => ['action' => $action, 'hospital_id' => $hospitalId],
            'actions' => $actions,
        ]);
    }
}
