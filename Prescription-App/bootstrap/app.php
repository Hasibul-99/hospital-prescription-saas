<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\HospitalScope::class,
            \App\Http\Middleware\SetLocale::class,
        ]);

        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'hospital.active' => \App\Http\Middleware\EnsureHospitalActive::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // If CSRF token expires on the logout request the session is gone anyway —
        // just redirect to the login page instead of showing a 419.
        $exceptions->render(function (\Illuminate\Session\TokenMismatchException $e, \Illuminate\Http\Request $request) {
            if ($request->is('logout') || $request->routeIs('logout')) {
                return redirect('/login');
            }
        });
    })->create();
