<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HospitalScope
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && !$user->isSuperAdmin() && $user->hospital_id) {
            config(['app.current_hospital_id' => $user->hospital_id]);
        }

        return $next($request);
    }
}
