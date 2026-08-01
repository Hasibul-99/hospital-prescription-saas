@php
    $mt = ($profile?->print_margin_top ?? 12).'mm';
    $mb = ($profile?->print_margin_bottom ?? 12).'mm';
    $ml = ($profile?->print_margin_left ?? 12).'mm';
    $mr = ($profile?->print_margin_right ?? 12).'mm';

    function _rxDoseSoap($m) {
        $parts = [$m->dose_morning, $m->dose_noon, $m->dose_afternoon, $m->dose_night, $m->dose_bedtime];
        if (collect($parts)->every(fn ($v) => $v === null || $v === '')) return '';
        return collect($parts)->map(fn ($v) => ($v === null || $v === '') ? '0' : (string) $v)->implode('+');
    }
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>SOAP — {{ $rx->prescription_uid }}</title>
    <style>
        @page { margin: {{ $mt }} {{ $mr }} {{ $mb }} {{ $ml }}; }
        body { font-family: DejaVu Sans, sans-serif; color: #111; margin: 0; font-size: 12px; line-height: 1.4; }
        h1 { font-size: 16px; margin: 0 0 6px; color: #0f4c81; }
        h2 { font-size: 12px; margin: 12px 0 4px; text-transform: uppercase; letter-spacing: 1px; color: #0f4c81; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px; }
        .hdr { border-bottom: 1px solid #888; padding-bottom: 6px; margin-bottom: 10px; display: table; width: 100%; }
        .hdr .l { display: table-cell; width: 60%; }
        .hdr .r { display: table-cell; width: 40%; text-align: right; font-size: 11px; color: #444; }
        .meta { color: #555; font-size: 11px; }
        ul { margin: 0; padding-left: 16px; }
        li { margin-bottom: 3px; }
        .patient { background: #f8fafc; padding: 6px 8px; margin: 6px 0 4px; }
        .sig { margin-top: 24px; text-align: right; }
        .sig .name { font-weight: bold; }
    </style>
</head>
<body>
    <div class="hdr">
        <div class="l">
            <h1>{{ $doctor?->name }}</h1>
            @if($profile?->degrees)<div class="meta">{{ $profile->degrees }}</div>@endif
            @if($profile?->specialization)<div class="meta">{{ $profile->specialization }}</div>@endif
            @if($profile?->bmdc_number)
                <div class="meta">
                    BMDC: {{ $profile->bmdc_number }}
                    @if($profile->bmdc_verified) <span>&check; Verified</span> @endif
                </div>
            @endif
        </div>
        <div class="r">
            <div><strong>{{ $hospital?->name }}</strong></div>
            @if($hospital?->address)<div>{{ $hospital->address }}</div>@endif
        </div>
    </div>

    <h1>SOAP Note</h1>
    <div class="patient">
        <strong>Patient:</strong> {{ $patient?->name }}
        &nbsp; <strong>ID:</strong> {{ $patient?->patient_uid }}
        &nbsp; <strong>Age:</strong>
        @if($patient?->age_years) {{ $patient->age_years }} Y @endif
        @if($patient?->age_months) {{ $patient->age_months }} M @endif
        &nbsp; <strong>Sex:</strong> {{ ucfirst($patient?->gender ?? '') }}
        &nbsp; <strong>Date:</strong> {{ \Carbon\Carbon::parse($rx->date)->format('d-M-Y') }}
    </div>

    <h2>S — Subjective</h2>
    @if($rx->complaints->isNotEmpty())
        <ul>
            @foreach($rx->complaints as $c)
                <li>{{ $c->complaint_name }}@if($c->duration_text) &mdash; {{ $c->duration_text }}@endif @if($c->note) &mdash; {{ $c->note }}@endif</li>
            @endforeach
        </ul>
    @else
        <div class="meta">No complaints recorded.</div>
    @endif
    @php $pastHx = $rx->sections->where('section_type', 'past_history'); @endphp
    @if($pastHx->isNotEmpty())
        <div class="meta" style="margin-top:4px;"><em>Past history:</em> {{ $pastHx->pluck('content')->implode('; ') }}</div>
    @endif

    <h2>O — Objective</h2>
    @if($rx->examinations->isNotEmpty())
        <ul>
            @foreach($rx->examinations as $e)
                <li>{{ $e->examination_name }}@if($e->finding_value) &mdash; {{ $e->finding_value }}@endif @if($e->note)({{ $e->note }})@endif</li>
            @endforeach
        </ul>
    @else
        <div class="meta">No examination findings recorded.</div>
    @endif

    <h2>A — Assessment</h2>
    @php $diag = $rx->sections->where('section_type', 'diagnosis'); @endphp
    @if($diag->isNotEmpty())
        <ul>@foreach($diag as $d)<li>{{ $d->content }}</li>@endforeach</ul>
    @else
        <div class="meta">No diagnosis recorded.</div>
    @endif

    <h2>P — Plan</h2>
    @if($rx->medicines->isNotEmpty())
        <div class="meta" style="margin-bottom:2px;">Medications:</div>
        <ul>
            @foreach($rx->medicines as $m)
                <li>
                    <strong>{{ $m->medicine_name }}</strong>@if($m->strength) {{ $m->strength }}@endif
                    &mdash; {{ $m->dose_display ?: _rxDoseSoap($m) }}
                    @if($m->duration_value && $m->duration_unit), {{ $m->duration_value }} {{ $m->duration_unit }}@endif
                    @if($m->custom_instruction) ({{ $m->custom_instruction }})@endif
                </li>
            @endforeach
        </ul>
    @endif

    @php
        $advices = $rx->sections->where('section_type', 'advice');
        $invest  = $rx->sections->where('section_type', 'investigation');
        $next    = $rx->sections->where('section_type', 'next_plan');
    @endphp
    @if($invest->isNotEmpty())
        <div class="meta" style="margin-top:6px;">Investigations:</div>
        <ul>@foreach($invest as $s)<li>{{ $s->content }}</li>@endforeach</ul>
    @endif
    @if($advices->isNotEmpty())
        <div class="meta" style="margin-top:6px;">Advice:</div>
        <ul>@foreach($advices as $s)<li>{{ $s->content }}</li>@endforeach</ul>
    @endif
    @if($next->isNotEmpty())
        <div class="meta" style="margin-top:6px;">Next plan:</div>
        <ul>@foreach($next as $s)<li>{{ $s->content }}</li>@endforeach</ul>
    @endif
    @if($rx->follow_up_date)
        <div class="meta" style="margin-top:6px;">Follow-up: {{ \Carbon\Carbon::parse($rx->follow_up_date)->format('d-M-Y') }}</div>
    @endif

    <div class="sig">
        @if($profile?->signature_image)
            <img src="{{ public_path('storage/'.$profile->signature_image) }}" alt="Signature" style="max-height:60px;">
        @endif
        <div class="name">{{ $doctor?->name }}</div>
        @if($profile?->bmdc_number)<div class="meta">BMDC: {{ $profile->bmdc_number }}</div>@endif
    </div>
</body>
</html>
