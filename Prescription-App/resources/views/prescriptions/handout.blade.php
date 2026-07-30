@php
    function _rxDoseHandout($m) {
        $parts = [$m->dose_morning, $m->dose_noon, $m->dose_afternoon, $m->dose_night, $m->dose_bedtime];
        if (collect($parts)->every(fn ($v) => $v === null || $v === '')) return '';
        return collect($parts)->map(fn ($v) => ($v === null || $v === '') ? '0' : (string) $v)->implode('+');
    }
    function _timingHandout($t) {
        return match($t) {
            'before_meal'  => 'Before meal',
            'after_meal'   => 'After meal',
            'empty_stomach'=> 'Empty stomach',
            'with_food'    => 'With meal',
            'bedtime'      => 'Bedtime',
            'as_needed'    => 'As needed',
            default        => '',
        };
    }
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Handout — {{ $rx->prescription_uid }}</title>
    <style>
        @page { margin: 15mm; }
        body { font-family: DejaVu Sans, sans-serif; color: #111; margin: 0; font-size: 14px; line-height: 1.5; }
        h1 { font-size: 20px; margin: 0 0 4px; color: #0f4c81; }
        h2 { font-size: 15px; margin: 14px 0 6px; color: #0f4c81; border-bottom: 2px solid #0f4c81; padding-bottom: 3px; }
        .hdr { display: table; width: 100%; border-bottom: 1px solid #888; padding-bottom: 8px; margin-bottom: 10px; }
        .hdr .l { display: table-cell; width: 60%; }
        .hdr .r { display: table-cell; text-align: right; font-size: 12px; color: #444; }
        .patient { background: #f8fafc; padding: 8px 10px; margin: 8px 0 10px; font-size: 13px; }
        .med { border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px; margin-bottom: 8px; background: #fff; }
        .med .name { font-size: 16px; font-weight: bold; color: #0f4c81; }
        .med .dose { font-size: 20px; margin: 6px 0; letter-spacing: 2px; color: #065f46; font-weight: bold; }
        .med .meta { font-size: 12px; color: #444; }
        .allergy { background: #fee2e2; border-left: 4px solid #dc2626; padding: 6px 10px; color: #7f1d1d; margin-bottom: 10px; }
        .advice { background: #ecfdf5; border-left: 4px solid #059669; padding: 6px 10px; margin-top: 8px; }
        .followup { background: #eff6ff; border-left: 4px solid #0f4c81; padding: 6px 10px; margin-top: 10px; font-size: 15px; }
        .disclaimer { margin-top: 20px; font-size: 11px; color: #6b7280; text-align: center; }
    </style>
</head>
<body>
    <div class="hdr">
        <div class="l">
            <h1>{{ $doctor?->name }}</h1>
            @if($profile?->specialization)<div>{{ $profile->specialization }}</div>@endif
        </div>
        <div class="r">
            <div><strong>{{ $hospital?->name }}</strong></div>
            @if($hospital?->phone)<div>Phone: {{ $hospital->phone }}</div>@endif
        </div>
    </div>

    <h1 style="text-align:center;">Your Prescription — Patient Guide</h1>

    <div class="patient">
        <strong>Name:</strong> {{ $patient?->name }} &nbsp;
        <strong>Date:</strong> {{ \Carbon\Carbon::parse($rx->date)->format('d M Y') }}
    </div>

    @php $allergies = $patient?->allergies?->pluck('allergen')->filter()->values() ?? collect(); @endphp
    @if($allergies->isNotEmpty())
        <div class="allergy"><strong>Drug allergies:</strong> {{ $allergies->implode(', ') }}</div>
    @endif

    @if($rx->medicines->isNotEmpty())
        <h2>Your medicines</h2>
        @foreach($rx->medicines as $m)
            @php
                $dose = $m->dose_display ?: _rxDoseHandout($m);
                $tim  = $m->custom_instruction ?: _timingHandout($m->timing);
                $dur  = $m->duration_value && $m->duration_unit && $m->duration_unit !== 'continue'
                        ? $m->duration_value.' '.$m->duration_unit
                        : ($m->duration_unit === 'continue' ? 'continue' : '');
            @endphp
            <div class="med">
                <div class="name">{{ $loop->iteration }}. {{ $m->medicine_name }}@if($m->strength) {{ $m->strength }}@endif</div>
                @if($dose)<div class="dose">{{ $dose }}</div>@endif
                <div class="meta">
                    @if($tim)<strong>{{ $tim }}</strong>@endif
                    @if($dur)&nbsp; · &nbsp; for <strong>{{ $dur }}</strong>@endif
                </div>
            </div>
        @endforeach
    @endif

    @php $advices = $rx->sections->where('section_type', 'advice'); @endphp
    @if($advices->isNotEmpty())
        <h2>Advice</h2>
        @foreach($advices as $a)
            <div class="advice">• {{ $a->content }}</div>
        @endforeach
    @endif

    @if($rx->follow_up_date)
        <div class="followup">
            <strong>Next visit:</strong> {{ \Carbon\Carbon::parse($rx->follow_up_date)->format('d M Y (l)') }}
        </div>
    @endif

    <div class="disclaimer">
        Rx ID: {{ $rx->prescription_uid }} · Patient ID: {{ $patient?->patient_uid }}<br>
        This handout is a patient-friendly summary. The signed prescription is the primary medical document.
    </div>
</body>
</html>
