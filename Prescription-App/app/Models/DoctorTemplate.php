<?php

namespace App\Models;

use App\Traits\BelongsToHospital;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DoctorTemplate extends Model
{
    use BelongsToHospital;

    protected $fillable = [
        'doctor_id', 'hospital_id', 'disease_name',
        'complaints', 'examinations', 'medicines', 'advices', 'investigations',
        'is_global', 'last_used_at', 'use_count',
    ];

    protected function casts(): array
    {
        return [
            'complaints' => 'array',
            'examinations' => 'array',
            'medicines' => 'array',
            'advices' => 'array',
            'investigations' => 'array',
            'is_global' => 'boolean',
            'last_used_at' => 'datetime',
        ];
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function hospital(): BelongsTo
    {
        return $this->belongsTo(Hospital::class);
    }
}
