<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        abort_unless($user->isHospitalAdmin() || $user->isSuperAdmin(), 403);

        $action = $request->input('action');
        $userFilter = $request->input('user_id');

        $logs = AuditLog::query()
            ->with('user:id,name,role')
            ->where('hospital_id', $user->hospital_id)
            ->when($action, fn ($q) => $q->where('action', $action))
            ->when($userFilter, fn ($q) => $q->where('user_id', $userFilter))
            ->latest()
            ->paginate(25)
            ->withQueryString()
            ->through(fn ($log) => [
                'id' => $log->id,
                'action' => $log->action,
                'subject_type' => class_basename($log->subject_type),
                'subject_id' => $log->subject_id,
                'meta' => $log->meta,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at?->toDateTimeString(),
                'user' => $log->user ? ['id' => $log->user->id, 'name' => $log->user->name, 'role' => $log->user->role] : null,
            ]);

        $actions = AuditLog::query()
            ->where('hospital_id', $user->hospital_id)
            ->select('action')
            ->distinct()
            ->pluck('action');

        return Inertia::render('Hospital/AuditLogs/Index', [
            'logs' => $this->paginateFor($logs),
            'filters' => ['action' => $action, 'user_id' => $userFilter],
            'actions' => $actions,
        ]);
    }
}
