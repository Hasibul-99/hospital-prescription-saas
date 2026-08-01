<?php

namespace App\Models;

use App\Traits\BelongsToHospital;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HospitalHoliday extends Model
{
    use BelongsToHospital;

    protected $fillable = [
        'hospital_id', 'date', 'title', 'is_recurring_yearly',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'is_recurring_yearly' => 'boolean',
        ];
    }

    public function hospital(): BelongsTo
    {
        return $this->belongsTo(Hospital::class);
    }
}
