<x-mail::message>
# {{ $isReset ? 'Reset your password' : 'Verify your email' }}

{{ $isReset
    ? 'Use the code below to reset your password.'
    : 'Welcome! Use the code below to verify your email address.' }}

<div style="text-align:center;margin:32px 0;">
    <div style="display:inline-block;font-size:42px;font-weight:700;letter-spacing:14px;padding:16px 28px;background:#f3f4f6;border-radius:8px;font-family:'SFMono-Regular',Consolas,Menlo,monospace;">
        {{ $code }}
    </div>
</div>

This code expires in **{{ $expiryMinutes }} minutes**.

@if ($isReset)
If you didn't request a password reset, you can safely ignore this email — your password will stay the same.
@else
If you didn't sign up, you can safely ignore this email.
@endif

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
