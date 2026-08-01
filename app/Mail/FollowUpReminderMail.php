<?php

namespace App\Mail;

use App\Models\Prescription;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FollowUpReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Prescription $prescription)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Follow-up reminder');
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.follow-up-reminder',
            with: [
                'patient' => $this->prescription->patient,
                'doctor' => $this->prescription->doctor,
                'date' => $this->prescription->follow_up_date,
            ],
        );
    }
}
