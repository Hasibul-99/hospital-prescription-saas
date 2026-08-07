<?php

namespace App\Http\Middleware;

use App\Support\Money;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? $user->loadMissing('hospital') : null,
            ],
            'csrf_token' => fn () => csrf_token(),
            'locale' => fn () => app()->getLocale(),
            // Money display currency for the current context: the tenant's own
            // currency inside a hospital, the platform base currency for super
            // admins and guests. Never a conversion — just which symbol to draw.
            'currency' => fn () => Money::config($user?->hospital?->currency),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
