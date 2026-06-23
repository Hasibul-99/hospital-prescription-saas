<?php

namespace App\Mail;

use App\Services\OtpService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OtpMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $code,
        public string $purpose,
    ) {}

    public function envelope(): Envelope
    {
        $subject = match ($this->purpose) {
            OtpService::PURPOSE_PASSWORD_RESET => 'Reset your password',
            default                            => 'Verify your email',
        };

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.otp',
            with: [
                'code'           => $this->code,
                'purpose'        => $this->purpose,
                'isReset'        => $this->purpose === OtpService::PURPOSE_PASSWORD_RESET,
                'expiryMinutes'  => OtpService::EXPIRY_MINUTES,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
