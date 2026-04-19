<?php

namespace App\Models;

use App\Traits\BelongsToHospital;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Appointment extends Model
{
    use BelongsToHospital, SoftDeletes;

    protected $fillable = [
        'hospital_id', 'doctor_id', 'patient_id', 'chamber_id',
        'appointment_date', 'serial_number', 'status', 'type',
        'fee_amount', 'fee_paid', 'payment_method', 'notes', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'appointment_date' => 'date',
            'fee_amount' => 'decimal:2',
            'fee_paid' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Appointment $appt) {
            if (empty($appt->serial_number)) {
                $appt->serial_number = static::nextSerial(
                    $appt->doctor_id,
                    $appt->chamber_id,
                    $appt->appointment_date
                );
            }
        });
    }

    /**
     * Next serial number for (doctor, chamber, date) scope. Resets daily.
     */
    public static function nextSerial(int $doctorId, ?int $chamberId, $date): int
    {
        $date = \Carbon\Carbon::parse($date)->toDateString();

        $max = static::withoutGlobalScopes()
            ->where('doctor_id', $doctorId)
            ->where('chamber_id', $chamberId)
            ->where('appointment_date', $date)
            ->max('serial_number');

        return ($max ?? 0) + 1;
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

    public function chamber(): BelongsTo
    {
        return $this->belongsTo(Chamber::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function prescription(): HasOne
    {
        return $this->hasOne(Prescription::class);
    }
}
