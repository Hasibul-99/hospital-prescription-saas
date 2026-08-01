<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DoctorMedicineDefault extends Model
{
    protected $fillable = [
        'doctor_id', 'medicine_id',
        'dose_morning', 'dose_noon', 'dose_afternoon', 'dose_night', 'dose_bedtime',
        'timing', 'duration_value', 'duration_unit', 'custom_instruction',
    ];

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }
}
