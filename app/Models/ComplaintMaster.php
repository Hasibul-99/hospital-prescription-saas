<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ComplaintMaster extends Model
{
    protected $fillable = [
        'name_en', 'name_bn', 'category', 'sort_order', 'is_active',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function durationPresets(): HasMany
    {
        return $this->hasMany(ComplaintDurationPreset::class)->orderBy('sort_order');
    }
}
