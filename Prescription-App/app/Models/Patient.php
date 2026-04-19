<?php

namespace App\Models;

use App\Traits\BelongsToHospital;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Patient extends Model
{
    use BelongsToHospital, SoftDeletes;

    protected $fillable = [
        'hospital_id', 'patient_uid', 'name',
        'age_years', 'age_months', 'age_days', 'date_of_birth',
        'gender', 'phone', 'email', 'address', 'blood_group',
        'profile_image', 'emergency_contact_name', 'emergency_contact_phone',
        'notes', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Patient $patient) {
            if (empty($patient->patient_uid) && $patient->hospital_id) {
                $patient->patient_uid = static::generateUid($patient->hospital_id);
            }
        });
    }

    /**
     * Generate patient_uid: P-H{hospital_id}-{5-digit sequence}
     * e.g., P-H001-00142
     */
    public static function generateUid(int $hospitalId): string
    {
        $code = 'H' . str_pad($hospitalId, 3, '0', STR_PAD_LEFT);

        $lastPatient = static::withoutGlobalScopes()
            ->where('hospital_id', $hospitalId)
            ->where('patient_uid', 'like', "P-{$code}-%")
            ->orderByRaw('CAST(SUBSTR(patient_uid, -5) AS UNSIGNED) DESC')
            ->first();

        $nextSeq = 1;
        if ($lastPatient) {
            $lastSeq = (int) substr($lastPatient->patient_uid, -5);
            $nextSeq = $lastSeq + 1;
        }

        return "P-{$code}-" . str_pad($nextSeq, 5, '0', STR_PAD_LEFT);
    }

    public function hospital(): BelongsTo
    {
        return $this->belongsTo(Hospital::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class);
    }

    public function getAgeDisplayAttribute(): string
    {
        $parts = [];
        if ($this->age_years) $parts[] = "{$this->age_years}Y";
        if ($this->age_months) $parts[] = "{$this->age_months}M";
        if ($this->age_days) $parts[] = "{$this->age_days}D";
        return implode(' ', $parts) ?: 'N/A';
    }
}
