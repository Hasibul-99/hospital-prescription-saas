<?php

namespace App\Models;

use App\Support\Money;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Hospital extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'slug', 'logo', 'address', 'phone', 'email', 'website',
        'plan_id', 'billing_cycle', 'currency', 'subscription_status',
        'subscription_starts_at', 'subscription_ends_at', 'trial_ends_at',
        'prescription_quota_used', 'prescription_quota_reset_at',
        'max_doctors_override', 'max_patients_per_month_override',
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
            'max_doctors_override' => 'integer',
            'max_patients_per_month_override' => 'integer',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
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

    /**
     * A subscription is live only if the status says so AND the relevant date
     * has not passed. Status alone is not enough — nothing flips it on expiry,
     * so a date-expired hospital would otherwise pass forever.
     */
    public function isSubscriptionActive(): bool
    {
        if (! in_array($this->subscription_status, ['active', 'trial'], true)) {
            return false;
        }

        $expiresAt = $this->subscription_status === 'trial'
            ? $this->trial_ends_at
            : $this->subscription_ends_at;

        return $expiresAt === null || $expiresAt->isFuture();
    }

    // ─── Plan limits ──────────────────────────────────────────────────────
    //
    // Effective limit = per-hospital override ?? the plan's own limit.
    // NULL at either level means UNLIMITED — never zero.

    public function effectiveMaxDoctors(): ?int
    {
        return $this->max_doctors_override ?? $this->plan?->max_doctors;
    }

    public function effectiveMaxPatientsPerMonth(): ?int
    {
        return $this->max_patients_per_month_override ?? $this->plan?->max_patients_per_month;
    }

    public function effectiveMaxPrescriptions(): ?int
    {
        return $this->plan?->max_prescriptions;
    }

    /** Doctors that count against the cap — disabled ones are free. */
    public function activeDoctorCount(): int
    {
        return $this->users()
            ->where('role', 'doctor')
            ->where('is_active', true)
            ->count();
    }

    public function canAddDoctor(): bool
    {
        $limit = $this->effectiveMaxDoctors();

        return $limit === null || $this->activeDoctorCount() < $limit;
    }

    /**
     * True if this hospital can create another prescription under its plan.
     * Plans with a NULL max_prescriptions are unmetered.
     */
    public function hasFreeQuotaRemaining(): bool
    {
        $limit = $this->effectiveMaxPrescriptions();

        return $limit === null || $this->prescription_quota_used < $limit;
    }

    /**
     * Increment the usage counter. Atomic — safe under concurrent Rx creates.
     */
    public function incrementRxUsage(): void
    {
        $this->increment('prescription_quota_used');
    }

    /** Resolved currency config (symbol, decimals, position) for money display. */
    public function currencyConfig(): array
    {
        return Money::config($this->currency);
    }
}
