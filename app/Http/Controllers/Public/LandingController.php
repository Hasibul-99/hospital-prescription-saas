<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Support\Money;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/**
 * The public marketing page. Its pricing section is driven entirely by the
 * `plans` table, so the super admin changes prices without a deploy.
 */
class LandingController extends Controller
{
    public function index()
    {
        return Inertia::render('Welcome', [
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
            'plans' => $this->publicPlans(),
            // Plan prices are always in the platform base currency — a visitor
            // is not inside any tenant, so no hospital currency applies.
            'currency' => Money::config(Money::platformCurrency()),
        ]);
    }

    /**
     * Cached for an hour; the Plan model flushes this key on every save/delete,
     * so an edited price is visible immediately.
     */
    private function publicPlans(): array
    {
        return Cache::remember(Plan::PUBLIC_CACHE_KEY, now()->addHour(), function () {
            return Plan::query()
                ->public()
                ->active()
                ->ordered()
                ->get([
                    'id', 'code', 'name', 'name_bn', 'tagline', 'tagline_bn',
                    'price_monthly', 'price_yearly', 'max_doctors', 'trial_days',
                    'features', 'cta_label', 'cta_label_bn', 'is_featured', 'sort_order',
                ])
                ->map(fn (Plan $plan) => [
                    ...$plan->only([
                        'id', 'code', 'name', 'name_bn', 'tagline', 'tagline_bn',
                        'features', 'cta_label', 'cta_label_bn', 'is_featured', 'trial_days',
                    ]),
                    'price_monthly' => (float) $plan->price_monthly,
                    'price_yearly' => $plan->price_yearly === null ? null : (float) $plan->price_yearly,
                    'yearly_discount_percent' => $plan->yearlyDiscountPercent(),
                ])
                ->all();
        });
    }
}
