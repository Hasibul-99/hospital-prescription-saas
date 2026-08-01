<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OtpVerification extends Model
{
    protected $fillable = [
        'email', 'code', 'purpose', 'expires_at', 'attempts', 'last_sent_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at'   => 'datetime',
            'last_sent_at' => 'datetime',
            'attempts'     => 'integer',
        ];
    }

    public function isExpired(): bool
    {
        return $this->expires_at?->isPast() ?? true;
    }
}
