<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        $this->configureRateLimiters();
    }

    protected function configureRateLimiters(): void
    {
        // Email-keyed throttle for endpoints that take an `email` body field
        // and trigger an OTP send. Limits both per IP and per (IP + email)
        // so a single attacker can't pin a single victim address either.
        RateLimiter::for('otp-email-send', function (Request $request) {
            $email = strtolower(trim((string) $request->input('email', '')));

            return [
                Limit::perMinute(5)->by($request->ip()),
                Limit::perMinute(3)->by($request->ip().':'.$email),
            ];
        });
    }
}
