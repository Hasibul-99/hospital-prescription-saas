<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <style>
        @page { margin: 15mm; }
        body { font-family: DejaVu Sans, sans-serif; color: #111; margin: 0; font-size: 13px; line-height: 1.55; }
        .hdr { border-bottom: 1px solid #888; padding-bottom: 10px; margin-bottom: 12px; display: table; width: 100%; }
        .hdr .l { display: table-cell; width: 60%; vertical-align: top; }
        .hdr .r { display: table-cell; text-align: right; font-size: 11px; color: #444; }
        .doc-name { font-size: 18px; font-weight: bold; color: #0f4c81; }
        .meta { font-size: 11px; color: #333; }
        h1 { font-size: 18px; text-align: center; text-transform: uppercase; letter-spacing: 2px; margin: 24px 0 16px; color: #0f4c81; border-top: 2px double #0f4c81; border-bottom: 2px double #0f4c81; padding: 6px 0; }
        .patient-line { margin: 14px 0; }
        .body { margin: 18px 0; text-indent: 20px; text-align: justify; }
        .duration { background: #f3f4f6; padding: 6px 10px; margin: 12px 0; border-left: 3px solid #0f4c81; }
        .sig { margin-top: 40px; text-align: right; }
        .sig img { max-height: 60px; }
        .sig .name { font-weight: bold; }
        .date { margin-top: 20px; font-size: 12px; color: #444; }
    </style>
</head>
<body>
    <div class="hdr">
        <div class="l">
            @if($profile?->prescription_header_image)
                <img src="{{ public_path('storage/'.$profile->prescription_header_image) }}" alt="Header" style="max-height:110px;">
            @else
                <div class="doc-name">{{ $doctor?->name }}</div>
                @if($profile?->degrees)<div class="meta">{{ $profile->degrees }}</div>@endif
                @if($profile?->specialization)<div class="meta">{{ $profile->specialization }}</div>@endif
                @if($profile?->bmdc_number)
                    <div class="meta">
                        BMDC: {{ $profile->bmdc_number }}
                        @if($profile->bmdc_verified) <span style="background:#d1fae5;color:#065f46;padding:1px 6px;border-radius:9px;font-size:9px;">&check; Verified</span> @endif
                    </div>
                @endif
            @endif
        </div>
        <div class="r">
            <div><strong>{{ $hospital?->name }}</strong></div>
            @if($hospital?->address)<div>{{ $hospital->address }}</div>@endif
            @if($hospital?->phone)<div>Phone: {{ $hospital->phone }}</div>@endif
        </div>
    </div>

    <h1>{{ $title }}</h1>

    <div class="date">Date: {{ \Carbon\Carbon::parse($date)->format('d M Y') }}</div>

    @if($type === 'referral' && $referred_to)
        <div class="patient-line"><strong>To:</strong> {{ $referred_to }}</div>
    @endif

    <div class="patient-line">
        <strong>Patient:</strong> {{ $patient->name }}
        &nbsp;·&nbsp; <strong>ID:</strong> {{ $patient->patient_uid }}
        @if($patient->age_years)&nbsp;·&nbsp; <strong>Age:</strong> {{ $patient->age_years }} Y @endif
        &nbsp;·&nbsp; <strong>Sex:</strong> {{ ucfirst($patient->gender ?? '') }}
    </div>

    <div class="body">{!! nl2br(e($body_text)) !!}</div>

    @if($duration_text)
        <div class="duration"><strong>
            @if($type === 'sick_leave') Advised leave for:
            @elseif($type === 'fitness') Valid for:
            @else Duration:
            @endif
        </strong> {{ $duration_text }}</div>
    @endif

    <div class="sig">
        @if($profile?->signature_image)
            <img src="{{ public_path('storage/'.$profile->signature_image) }}" alt="Signature">
        @endif
        <div class="name">{{ $doctor?->name }}</div>
        @if($profile?->bmdc_number)<div class="meta">BMDC: {{ $profile->bmdc_number }}</div>@endif
    </div>
</body>
</html>
