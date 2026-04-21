<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Medicine extends Model
{
    protected $fillable = [
        'brand_name', 'generic_name', 'type', 'strength',
        'manufacturer', 'price', 'is_active',
        'is_pending_approval', 'submitted_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'is_active' => 'boolean',
            'is_pending_approval' => 'boolean',
        ];
    }
}
