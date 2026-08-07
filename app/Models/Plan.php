<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Cache;

/**
 * A subscription tier, managed by the super admin.
 *
 * Global (shared) table — deliberately NOT hospital-scoped, so no
 * BelongsToHospital trait here. Replaces the old config/subscription.php array.
 *
 * Any nullable limit (max_doctors, max_patients_per_month, max_prescriptions)
 * means UNLIMITED, not zero.
 */
class Plan extends Model
{
    use HasFactory, SoftDeletes;

    /** Cache key for the public plan list rendered on the landing page. */
    public const PUBLIC_CACHE_KEY = 'plans:public';

    protected $fillable = [
        'code', 'name', 'name_bn', 'tagline', 'tagline_bn',
        'price_monthly', 'price_yearly',
        'max_doctors', 'max_patients_per_month', 'max_prescriptions',
        'trial_days', 'features',
        'cta_label', 'cta_label_bn',
        'is_public', 'is_featured', 'is_active', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'features' => 'array',
            'price_monthly' => 'decimal:2',
            'price_yearly' => 'decimal:2',
            'max_doctors' => 'integer',
            'max_patients_per_month' => 'integer',
            'max_prescriptions' => 'integer',
            'trial_days' => 'integer',
            'sort_order' => 'integer',
            'is_public' => 'boolean',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        // The landing page caches the public plan list for an hour and
        // PlatformReportService caches plan-priced revenue for the same. Without
        // this, a price edit would stay invisible for up to 60 minutes.
        $flush = function () {
            Cache::forget(self::PUBLIC_CACHE_KEY);
            Cache::forget('rpt:platform:revenue');
        };

        static::saved($flush);
        static::deleted($flush);
        static::restored($flush);
    }

    public function hospitals(): HasMany
    {
        return $this->hasMany(Hospital::class);
    }

    public function scopePublic(Builder $query): Builder
    {
        return $query->where('is_public', true);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('price_monthly');
    }

    public function isFree(): bool
    {
        return (float) $this->price_monthly === 0.0;
    }

    public function hasYearlyPrice(): bool
    {
        return $this->price_yearly !== null;
    }

    /**
     * How much a year of yearly billing saves against 12 monthly payments,
     * as a whole percentage. Null when there is no yearly price or no saving.
     */
    public function yearlyDiscountPercent(): ?int
    {
        $monthly = (float) $this->price_monthly;
        $yearly = $this->price_yearly === null ? null : (float) $this->price_yearly;

        if ($yearly === null || $monthly <= 0) {
            return null;
        }

        $fullYear = $monthly * 12;

        if ($yearly >= $fullYear) {
            return null;
        }

        return (int) round((($fullYear - $yearly) / $fullYear) * 100);
    }

    /** The price actually charged for one billing period. */
    public function priceFor(string $cycle): float
    {
        return $cycle === 'yearly' && $this->price_yearly !== null
            ? (float) $this->price_yearly
            : (float) $this->price_monthly;
    }

    /** Monthly-equivalent price, for revenue reporting across mixed cycles. */
    public function monthlyEquivalent(string $cycle): float
    {
        return $cycle === 'yearly' && $this->price_yearly !== null
            ? round((float) $this->price_yearly / 12, 2)
            : (float) $this->price_monthly;
    }

    /** Localised display name — `bn` falls back to English when untranslated. */
    public function displayName(string $locale = 'en'): string
    {
        return ($locale === 'bn' ? $this->name_bn : null) ?: $this->name;
    }
}
