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

    public function prescription(): BelongsTo
    {
        return $this->belongsTo(Prescription::class);
    }

    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }
}
