<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrescriptionComplaint extends Model
{
    protected $fillable = [
        'prescription_id', 'complaint_name', 'duration_text', 'note', 'sort_order',
    ];

    public function prescription(): BelongsTo
    {
        return $this->belongsTo(Prescription::class);
    }
}
