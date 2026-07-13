<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Request;
use Throwable;

class AuditLogger
{
    public function record(string $action, Model $subject, array $meta = []): void
    {
        // Auditing must never break the operation it records. Swallow and log
        // any failure (e.g. a transient DB error writing the log row).
        try {
            $user = Auth::user();

            AuditLog::create([
                'user_id' => $user?->id,
                'hospital_id' => $user?->hospital_id ?? ($subject->hospital_id ?? null),
                'action' => $action,
                'subject_type' => $subject::class,
                'subject_id' => $subject->getKey(),
                'meta' => $meta,
                'ip_address' => Request::ip(),
            ]);
        } catch (Throwable $e) {
            Log::warning('Audit log write failed', [
                'action' => $action,
                'error'  => $e->getMessage(),
            ]);
        }
    }
}
