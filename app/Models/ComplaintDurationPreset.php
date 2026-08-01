<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ComplaintDurationPreset extends Model
{
    protected $fillable = [
        'complaint_master_id', 'duration_text_en', 'duration_text_bn', 'sort_order',
    ];

    public function complaintMaster(): BelongsTo
    {
        return $this->belongsTo(ComplaintMaster::class);
    }
}
