<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureHospitalActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && !$user->isSuperAdmin() && $user->hospital) {
            if (!$user->hospital->is_active || !$user->hospital->isSubscriptionActive()) {
                if ($request->wantsJson()) {
                    return response()->json([
                        'message' => 'Your hospital subscription is inactive or expired.',
                    ], 403);
                }
                return inertia('Error/SubscriptionExpired', [
                    'hospital' => $user->hospital->name,
                ]);
            }
        }

        return $next($request);
    }
}
