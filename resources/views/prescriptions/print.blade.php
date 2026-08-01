@php
    $mt = ($profile?->print_margin_top ?? 10).'mm';
    $mb = ($profile?->print_margin_bottom ?? 10).'mm';
    $ml = ($profile?->print_margin_left ?? 10).'mm';
    $mr = ($profile?->print_margin_right ?? 10).'mm';
    $lang = $profile?->default_prescription_language ?? 'both';
@endphp
<!DOCTYPE html>
<html lang="{{ $lang === 'en' ? 'en' : 'bn' }}">
<head>
    <meta charset="UTF-8">
    <title>{{ $rx->prescription_uid }}</title>
    <style>
        @page { margin: {{ $mt }} {{ $mr }} {{ $mb }} {{ $ml }}; }
        * { box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; color: #111; margin: 0; }
        .sheet { width: 100%; }
        .hdr { border-bottom: 1px solid #888; padding-bottom: 6px; margin-bottom: 8px; }
        .hdr img { max-height: 110px; width: 100%; object-fit: contain; }
        .hdr-text { display: table; width: 100%; }
        .hdr-text .col { display: table-cell; vertical-align: top; }
        .hdr-text .doc-name { font-size: 1.4em; font-weight: bold; color: #0f4c81; }
        .hdr-text .meta { font-size: 0.9em; color: #333; margin-top: 2px; }
        .hdr-text .right { text-align: right; }
        .hdr-text .right img { max-height: 70px; }
        .patient-bar { display: table; width: 100%; border-top: 1px dashed #888; border-bottom: 1px dashed #888; padding: 4px 0; margin-bottom: 8px; }
        .patient-bar .c { display: table-cell; width: 50%; vertical-align: middle; }
        .patient-bar .c.r { text-align: right; }
        .body { display: table; width: 100%; table-layout: fixed; }
        .body .left { display: table-cell; width: 35%; vertical-align: top; padding-right: 10px; border-right: 1px solid #e5e7eb; }
        .body .right { display: table-cell; width: 65%; vertical-align: top; padding-left: 10px; }
        h3 { font-size: 1em; margin: 8px 0 4px; color: #0f4c81; border-bottom: 1px solid #e5e7eb; padding-bottom: 2px; }
        ul { margin: 0; padding-left: 14px; }
        li { margin-bottom: 4px; }
        .rx-big { font-size: 1.6em; font-weight: bold; color: #0f4c81; }
        .rx-item { margin-bottom: 6px; }
        .rx-item .name { font-weight: bold; }
        .rx-item .dose { color: #222; padding-left: 6px; }
        .rx-item .addl { color: #444; padding-left: 18px; font-size: 0.95em; }
        .muted { color: #888; margin: 0 4px; }
        .followup { margin-top: 8px; padding: 4px 6px; background: #f3f4f6; border-left: 3px solid #0f4c81; }
        .footer { margin-top: 18px; border-top: 1px solid #ccc; padding-top: 6px; }
        .footer .sig { text-align: right; }
        .footer .sig img { max-height: 60px; }
        .footer .sig .name { font-weight: bold; }
        .footer img.full { width: 100%; max-height: 90px; object-fit: contain; }
        .uid { font-size: 0.8em; color: #666; text-align: right; margin-top: 4px; }
        .page-break { page-break-after: always; }
    </style>
</head>
<body>
    @include('prescriptions._body', ['rx' => $rx, 'doctor' => $doctor, 'profile' => $profile, 'hospital' => $hospital, 'patient' => $patient])
</body>
</html>
