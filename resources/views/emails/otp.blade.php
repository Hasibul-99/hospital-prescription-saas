<x-mail::message>
@php
    $isBooking = $isBooking ?? false;
    $heading = $isReset ? 'Reset your password' : ($isBooking ? 'Confirm your appointment' : 'Verify your email');
    $lead = $isReset
        ? 'Use the code below to reset your password.'
        : ($isBooking
            ? 'Use the code below to confirm your appointment booking.'
            : 'Welcome! Use the code below to verify your email address.');
@endphp
# {{ $heading }}

{{ $lead }}

<div style="text-align:center;margin:32px 0;">
    <div style="display:inline-block;font-size:42px;font-weight:700;letter-spacing:14px;padding:16px 28px;background:#f3f4f6;border-radius:8px;font-family:'SFMono-Regular',Consolas,Menlo,monospace;">
        {{ $code }}
    </div>
</div>

This code expires in **{{ $expiryMinutes }} minutes**.

@if ($isReset)
If you didn't request a password reset, you can safely ignore this email — your password will stay the same.
@elseif ($isBooking)
If you didn't request this booking, you can safely ignore this email — no appointment will be created.
@else
If you didn't sign up, you can safely ignore this email.
@endif

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
