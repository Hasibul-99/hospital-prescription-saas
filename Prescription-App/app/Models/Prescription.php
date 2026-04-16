<?php

namespace App\Models;

use App\Traits\BelongsToHospital;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Prescription extends Model
{
    use BelongsToHospital, SoftDeletes;

    protected $fillable = [
        'hospital_id', 'doctor_id', 'patient_id', 'appointment_id',
        'prescription_uid', 'date', 'follow_up_date',
        'follow_up_duration_value', 'follow_up_duration_unit',
        'template_id', 'status', 'printed_at', 'printed_count',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'follow_up_date' => 'date',
            'printed_at' => 'datetime',
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

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function complaints(): HasMany
    {
        return $this->hasMany(PrescriptionComplaint::class)->orderBy('sort_order');
    }

    public function examinations(): HasMany
    {
        return $this->hasMany(PrescriptionExamination::class)->orderBy('sort_order');
    }

    public function sections(): HasMany
    {
        return $this->hasMany(PrescriptionSection::class)->orderBy('sort_order');
    }

    public function medicines(): HasMany
    {
        return $this->hasMany(PrescriptionMedicine::class)->orderBy('sort_order');
    }
}
