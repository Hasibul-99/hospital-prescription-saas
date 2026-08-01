<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Hospital extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Free-tier hard cap on total prescriptions per hospital.
     * "30 free prescriptions total (no monthly reset)" per marketing copy —
     * a per-hospital counter, incremented on every new Rx create by
     * PrescriptionService, gated by EnsurePrescriptionQuota middleware.
     */
    public const FREE_TIER_RX_LIMIT = 30;

    protected $fillable = [
        'name', 'slug', 'logo', 'address', 'phone', 'email', 'website',
        'subscription_plan', 'subscription_status',
        'subscription_starts_at', 'subscription_ends_at', 'trial_ends_at',
        'prescription_quota_used', 'prescription_quota_reset_at',
        'max_doctors', 'max_patients_per_month',
        'settings', 'is_active', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'settings' => 'array',
            'is_active' => 'boolean',
            'subscription_starts_at' => 'datetime',
            'subscription_ends_at' => 'datetime',
            'trial_ends_at' => 'datetime',
            'prescription_quota_reset_at' => 'datetime',
            'prescription_quota_used' => 'integer',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function doctors(): HasMany
    {
        return $this->hasMany(User::class)->where('role', 'doctor');
    }

    public function patients(): HasMany
    {
        return $this->hasMany(Patient::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class);
    }

    public function chambers(): HasMany
    {
        return $this->hasMany(Chamber::class);
    }

    public function holidays(): HasMany
    {
        return $this->hasMany(HospitalHoliday::class);
    }

    public function dailyStatements(): HasMany
    {
        return $this->hasMany(DailyStatement::class);
    }

    public function isSubscriptionActive(): bool
    {
        return in_array($this->subscription_status, ['active', 'trial']);
    }

    /**
     * True if this hospital can create another prescription under its plan.
     * Only the free plan is metered; paid plans always return true.
     */
    public function hasFreeQuotaRemaining(): bool
    {
        if ($this->subscription_plan !== 'free') {
            return true;
        }

        return $this->prescription_quota_used < self::FREE_TIER_RX_LIMIT;
    }

    /**
     * Increment the usage counter. Atomic — safe under concurrent Rx creates.
     */
    public function incrementRxUsage(): void
    {
        $this->increment('prescription_quota_used');
    }
}
