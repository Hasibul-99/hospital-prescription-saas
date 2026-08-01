<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Block new prescription creation when the hospital is on the free plan
 * and has already used its 30-Rx allowance. Paid plans pass through
 * without a query.
 */
class EnsurePrescriptionQuota
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $hospital = $user?->hospital;

        if ($hospital && ! $hospital->hasFreeQuotaRemaining()) {
            $wantsJson = $request->expectsJson()
                || $request->header('X-Inertia')
                || $request->input('_json');

            $message = 'Free tier limit reached — upgrade your plan to create more prescriptions.';

            if ($wantsJson && ! $request->header('X-Inertia')) {
                return response()->json(['message' => $message], 402);
            }

            return back()->with('error', $message);
        }

        return $next($request);
    }
}
