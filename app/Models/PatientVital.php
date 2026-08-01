<?php

namespace App\Models;

use App\Traits\BelongsToHospital;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientVital extends Model
{
    use BelongsToHospital;

    protected $fillable = [
        'hospital_id', 'patient_id', 'recorded_by_user_id', 'recorded_at',
        'systolic', 'diastolic', 'pulse', 'temperature',
        'weight_kg', 'height_cm', 'spo2', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'recorded_at' => 'datetime',
            'systolic'    => 'integer',
            'diastolic'   => 'integer',
            'pulse'       => 'integer',
            'temperature' => 'decimal:1',
            'weight_kg'   => 'decimal:2',
            'height_cm'   => 'decimal:1',
            'spo2'        => 'integer',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by_user_id');
    }
}
