<?php

namespace App\Models;

use App\Traits\BelongsToHospital;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyStatement extends Model
{
    use BelongsToHospital;

    protected $fillable = [
        'hospital_id', 'doctor_id', 'date',
        'total_patients', 'total_new_patients', 'total_follow_ups',
        'total_earned', 'total_paid', 'total_unpaid',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'total_earned' => 'decimal:2',
            'total_paid' => 'decimal:2',
            'total_unpaid' => 'decimal:2',
        ];
    }

    public function hospital(): BelongsTo
    {
        return $this->belongsTo(Hospital::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }
}
