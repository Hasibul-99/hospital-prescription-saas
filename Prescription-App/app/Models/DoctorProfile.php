<?php

namespace App\Models;

use App\Traits\BelongsToHospital;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DoctorProfile extends Model
{
    use BelongsToHospital;

    protected $fillable = [
        'user_id', 'hospital_id', 'bmdc_number', 'degrees',
        'specialization', 'designation', 'consultation_fee', 'follow_up_fee',
        'prescription_header_image', 'prescription_footer_image',
        'prescription_header_text', 'prescription_footer_text',
        'signature_image', 'default_prescription_language',
    ];

    protected function casts(): array
    {
        return [
            'consultation_fee' => 'decimal:2',
            'follow_up_fee' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function hospital(): BelongsTo
    {
        return $this->belongsTo(Hospital::class);
    }
}
