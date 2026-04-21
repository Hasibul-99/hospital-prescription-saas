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
        'print_paper_size', 'print_show_header', 'print_show_footer', 'print_show_logo',
        'print_header_mode', 'print_footer_mode', 'print_font_size',
        'print_margin_top', 'print_margin_bottom', 'print_margin_left', 'print_margin_right',
    ];

    protected function casts(): array
    {
        return [
            'consultation_fee' => 'decimal:2',
            'follow_up_fee' => 'decimal:2',
            'print_show_header' => 'boolean',
            'print_show_footer' => 'boolean',
            'print_show_logo' => 'boolean',
            'print_margin_top' => 'integer',
            'print_margin_bottom' => 'integer',
            'print_margin_left' => 'integer',
            'print_margin_right' => 'integer',
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
