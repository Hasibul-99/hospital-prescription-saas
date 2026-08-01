<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\UserNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = UserNotification::query()
            ->where('user_id', $request->user()->id)
            ->unread()
            ->orderByDesc('created_at')
            ->limit(50)
            ->get(['id', 'type', 'data', 'created_at'])
            ->map(fn ($n) => [
                'id' => $n->id,
                'type' => $n->type,
                'data' => $n->data,
                'created_at' => $n->created_at?->toIso8601String(),
            ]);

        return response()->json(['items' => $items]);
    }

    public function ack(Request $request, int $id): JsonResponse
    {
        $notification = UserNotification::query()
            ->where('user_id', $request->user()->id)
            ->where('id', $id)
            ->firstOrFail();

        $notification->update(['read_at' => now()]);

        return response()->json(['ok' => true]);
    }
}
