<!DOCTYPE html>
<html lang="en">
<body style="font-family: sans-serif; color:#222;">
    <p>Dear {{ $patient->name ?? 'Patient' }},</p>
    <p>This is a reminder for your follow-up appointment with Dr. {{ $doctor->name ?? '' }} scheduled for <strong>{{ \Illuminate\Support\Carbon::parse($date)->format('d M Y') }}</strong>.</p>
    <p>Please arrive 10 minutes early. Reply to this email if you need to reschedule.</p>
    <p>Regards,<br>{{ config('app.name') }}</p>
</body>
</html>
