<?php

namespace App\Models;

use App\Traits\BelongsToHospital;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Chamber extends Model
{
    use BelongsToHospital;

    protected $fillable = [
        'doctor_id', 'hospital_id', 'name', 'room_number',
        'floor', 'building', 'schedule', 'daily_slot_cap', 'is_active',
        'share_model', 'share_percent_doctor', 'rent_amount_monthly', 'share_notes',
    ];

    protected function casts(): array
    {
        return [
            'schedule' => 'array',
            'is_active' => 'boolean',
            'daily_slot_cap' => 'integer',
            'share_percent_doctor' => 'decimal:2',
            'rent_amount_monthly' => 'decimal:2',
        ];
    }

    /**
     * Split a day's revenue for this chamber between the doctor and the hospital.
     * Returns [doctor_share, hospital_share] in the same currency unit.
     */
    public function splitRevenue(float $revenue, \DateTimeInterface $date): array
    {
        return match ($this->share_model ?? 'full') {
            'split' => (function () use ($revenue) {
                $pct = (float) ($this->share_percent_doctor ?? 100);
                $doc = round($revenue * $pct / 100, 2);
                return [$doc, round($revenue - $doc, 2)];
            })(),
            'rent'  => (function () use ($revenue, $date) {
                $daysInMonth = (int) $date->format('t');
                $daily = round(((float) ($this->rent_amount_monthly ?? 0)) / max(1, $daysInMonth), 2);
                return [round($revenue - $daily, 2), $daily];
            })(),
            default => [$revenue, 0.0],  // full
        };
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function hospital(): BelongsTo
    {
        return $this->belongsTo(Hospital::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }
}
