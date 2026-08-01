<?php

namespace App\Models;

use App\Observers\AppointmentObserver;
use App\Traits\BelongsToHospital;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

#[ObservedBy([AppointmentObserver::class])]
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
     * Serialize serial-number assignment. nextSerial() reads "max + 1", so two
     * concurrent bookings for the same (doctor, date) can otherwise pick the
     * same serial (there is no unique constraint to catch it — chamber_id is
     * nullable, so a composite unique wouldn't cover chamber-less clinics).
     *
     * Lock the (doctor, date) range for the duration of generate + insert. On
     * MySQL/InnoDB the lockForUpdate takes gap locks on the
     * (doctor_id, appointment_date, serial_number) index even when no rows
     * exist yet, blocking a concurrent booking until this one commits; on
     * SQLite the write transaction serializes regardless.
     */
    public function save(array $options = [])
    {
        if ($this->exists || ! empty($this->serial_number) || empty($this->doctor_id) || empty($this->appointment_date)) {
            return parent::save($options);
        }

        return DB::transaction(function () use ($options) {
            static::withoutGlobalScopes()
                ->where('doctor_id', $this->doctor_id)
                ->whereDate('appointment_date', \Carbon\Carbon::parse($this->appointment_date)->toDateString())
                ->lockForUpdate()
                ->get();

            return parent::save($options);
        });
    }

    /**
     * Next serial number for (doctor, chamber, date) scope. Resets daily.
     */
    public static function nextSerial(int $doctorId, ?int $chamberId, $date): int
    {
        $date = \Carbon\Carbon::parse($date)->toDateString();

        // whereDate (date-only compare) rather than a raw equality: a `date`
        // column keeps a "00:00:00" time component on SQLite, so a plain
        // string match against 'Y-m-d' silently misses every row there even
        // though it matches on MySQL. whereDate is correct on both drivers.
        $max = static::withoutGlobalScopes()
            ->where('doctor_id', $doctorId)
            ->where('chamber_id', $chamberId)
            ->whereDate('appointment_date', $date)
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
