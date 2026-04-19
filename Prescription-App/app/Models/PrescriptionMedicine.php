<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrescriptionMedicine extends Model
{
    protected $fillable = [
        'prescription_id', 'medicine_id', 'medicine_name', 'medicine_type',
        'strength', 'generic_name',
        'dose_morning', 'dose_noon', 'dose_afternoon', 'dose_night', 'dose_bedtime',
        'dose_display', 'timing', 'duration_value', 'duration_unit',
        'custom_instruction', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'dose_morning' => 'decimal:2',
            'dose_noon' => 'decimal:2',
            'dose_afternoon' => 'decimal:2',
            'dose_night' => 'decimal:2',
            'dose_bedtime' => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (PrescriptionMedicine $med) {
            $med->dose_display = static::buildDoseDisplay(
                $med->dose_morning,
                $med->dose_noon,
                $med->dose_afternoon,
                $med->dose_night,
                $med->dose_bedtime
            );
        });
    }

    /**
     * Build display string from 5 dose columns.
     * e.g., (1, 0, 1, 0, 1) → "1+0+1+0+1"
     */
    public static function buildDoseDisplay($morning, $noon, $afternoon, $night, $bedtime): ?string
    {
        $parts = [$morning, $noon, $afternoon, $night, $bedtime];

        // If all null, no display
        if (collect($parts)->every(fn ($v) => is_null($v))) {
            return null;
        }

        return collect($parts)
            ->map(fn ($v) => is_null($v) ? '0' : rtrim(rtrim(number_format((float) $v, 2), '0'), '.'))
            ->implode('+');
    }

    public function prescription(): BelongsTo
    {
        return $this->belongsTo(Prescription::class);
    }

    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }
}
