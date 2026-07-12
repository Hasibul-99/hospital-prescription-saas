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

        if ($user && !$user->isSuperAdmin()) {
            // A non-super-admin with no hospital has no tenant to operate in.
            // Block outright rather than letting them reach tenant routes.
            if (!$user->hospital_id || !$user->hospital) {
                if ($request->wantsJson()) {
                    return response()->json(['message' => 'No active hospital for this account.'], 403);
                }
                abort(403, 'Your account is not linked to a hospital.');
            }

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
