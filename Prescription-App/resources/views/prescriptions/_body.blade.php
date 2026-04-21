@php
    $fontSize = match($profile?->print_font_size ?? 'medium') {
        'small' => '11px',
        'large' => '15px',
        default => '13px',
    };
    $showHeader = $profile?->print_show_header ?? true;
    $showFooter = $profile?->print_show_footer ?? true;
    $showLogo = $profile?->print_show_logo ?? true;
    $headerMode = $profile?->print_header_mode ?? 'text';
    $footerMode = $profile?->print_footer_mode ?? 'signature';

    if (!function_exists('App\Print\timingLabel')) {
        function _rxTimingLabel($t) {
            return match($t) {
                'before_meal' => 'খাবারের আগে',
                'after_meal' => 'খাবারের পরে',
                'empty_stomach' => 'Empty stomach',
                'with_food' => 'খাবারের সাথে',
                default => '',
            };
        }
        function _rxAbbr($type) {
            $t = strtolower((string) $type);
            if (str_starts_with($t, 'tab')) return 'Tab';
            if (str_starts_with($t, 'cap')) return 'Cap';
            if (str_starts_with($t, 'syr')) return 'Syr';
            if (str_starts_with($t, 'inj')) return 'Inj';
            if (str_starts_with($t, 'sup')) return 'Supp';
            if (str_starts_with($t, 'cre')) return 'Cream';
            if (str_starts_with($t, 'oin')) return 'Oint';
            if (str_starts_with($t, 'dro')) return 'Drops';
            if (str_starts_with($t, 'gel')) return 'Gel';
            if (str_starts_with($t, 'pow')) return 'Pwd';
            return $type;
        }
        function _rxDose($row) {
            $parts = [
                $row['dose_morning'] ?? null,
                $row['dose_noon'] ?? null,
                $row['dose_afternoon'] ?? null,
                $row['dose_night'] ?? null,
                $row['dose_bedtime'] ?? null,
            ];
            if (collect($parts)->every(fn ($v) => $v === null || $v === '')) return '';
            return collect($parts)->map(fn ($v) => ($v === null || $v === '') ? '0' : (string) $v)->implode('+');
        }
        function _rxDuration($value, $unit) {
            if (!$unit) return '';
            if ($unit === 'continue') return 'চলবে';
            if ($unit === 'N_A') return 'N/A';
            if (!$value) return '';
            return "{$value} {$unit}";
        }
    }
@endphp

<div class="sheet" style="font-size: {{ $fontSize }};">
    @if($showHeader)
        <div class="hdr">
            @if($headerMode === 'image' && $profile?->prescription_header_image)
                <img src="{{ public_path('storage/'.$profile->prescription_header_image) }}" alt="Header">
            @elseif($headerMode !== 'none')
                <div class="hdr-text">
                    <div class="col">
                        <div class="doc-name">{{ $doctor?->name }}</div>
                        @if($profile?->degrees)<div class="meta">{{ $profile->degrees }}</div>@endif
                        @if($profile?->specialization)<div class="meta">{{ $profile->specialization }}</div>@endif
                        @if($profile?->designation)<div class="meta">{{ $profile->designation }}</div>@endif
                        @if($profile?->bmdc_number)<div class="meta">BMDC: {{ $profile->bmdc_number }}</div>@endif
                    </div>
                    <div class="col right">
                        @if($showLogo && $hospital?->logo)
                            <img src="{{ public_path('storage/'.$hospital->logo) }}" alt="Logo">
                        @endif
                        <div class="meta">{{ $hospital?->name }}</div>
                        @if($hospital?->address)<div class="meta">{{ $hospital->address }}</div>@endif
                        @if($hospital?->phone)<div class="meta">Phone: {{ $hospital->phone }}</div>@endif
                    </div>
                </div>
                @if($profile?->prescription_header_text)
                    <div class="meta" style="margin-top:4px">{{ $profile->prescription_header_text }}</div>
                @endif
            @endif
        </div>
    @endif

    <div class="patient-bar">
        <div class="c">
            <strong>Name:</strong> {{ $patient?->name }}
            <span class="muted">|</span>
            <strong>Age:</strong>
            @if($patient?->age_years) {{ $patient->age_years }} Y @endif
            @if($patient?->age_months) {{ $patient->age_months }} M @endif
            <span class="muted">|</span>
            <strong>Sex:</strong> {{ ucfirst($patient?->gender ?? '') }}
        </div>
        <div class="c r">
            <strong>Date:</strong> {{ \Carbon\Carbon::parse($rx->date)->format('d-M-Y') }}
            <span class="muted">|</span>
            <strong>ID:</strong> {{ $patient?->patient_uid }}
        </div>
    </div>

    <div class="body">
        <div class="left">
            @if($rx->complaints->isNotEmpty())
                <h3>Patient Complaints</h3>
                <ul>
                    @foreach($rx->complaints as $c)
                        <li>
                            {{ $c->complaint_name }}
                            @if($c->duration_text) — {{ $c->duration_text }}@endif
                            @if($c->note)<br><span class="muted">{{ $c->note }}</span>@endif
                        </li>
                    @endforeach
                </ul>
            @endif

            @if($rx->examinations->isNotEmpty())
                <h3>On Examination</h3>
                <ul>
                    @foreach($rx->examinations as $e)
                        <li>
                            {{ $e->examination_name }}@if($e->finding_value): {{ $e->finding_value }}@endif
                            @if($e->note)<br><span class="muted">{{ $e->note }}</span>@endif
                        </li>
                    @endforeach
                </ul>
            @endif

            @php
                $diagnosis = $rx->sections->where('section_type', 'diagnosis');
                $investigations = $rx->sections->where('section_type', 'investigation');
            @endphp

            @if($diagnosis->isNotEmpty())
                <h3>Diagnosis</h3>
                <ul>
                    @foreach($diagnosis as $d)
                        <li>{{ $d->content }}</li>
                    @endforeach
                </ul>
            @endif

            @if($investigations->isNotEmpty())
                <h3>Investigations</h3>
                <ul>
                    @foreach($investigations as $i)
                        <li>{{ $i->content }}</li>
                    @endforeach
                </ul>
            @endif
        </div>

        <div class="right">
            <div class="rx-big">Rx</div>
            @if($rx->medicines->isNotEmpty())
                <ol style="padding-left: 18px; margin-top: 4px;">
                    @foreach($rx->medicines as $m)
                        <li class="rx-item">
                            <div class="name">
                                {{ _rxAbbr($m->medicine_type) ? _rxAbbr($m->medicine_type).'. ' : '' }}{{ $m->medicine_name }}@if($m->strength) {{ $m->strength }}@endif
                            </div>
                            <div class="dose">
                                @php
                                    $dose = $m->dose_display ?: _rxDose($m->toArray());
                                    $tim = $m->custom_instruction ?: _rxTimingLabel($m->timing);
                                    $dur = _rxDuration($m->duration_value, $m->duration_unit);
                                @endphp
                                {{ $dose ?: '—' }}
                                @if($tim)<span class="muted">|</span> {{ $tim }}@endif
                                @if($dur)<span class="muted">|</span> {{ $dur }}@endif
                            </div>
                            @foreach(($m->additional_doses ?? []) as $ad)
                                @php
                                    $adDose = $ad['dose_display'] ?? _rxDose($ad);
                                    $adTim = $ad['custom_instruction'] ?? null;
                                    $adDur = _rxDuration($ad['duration_value'] ?? null, $ad['duration_unit'] ?? null);
                                @endphp
                                <div class="addl">
                                    <span class="muted">এবং,</span>
                                    {{ $adDose ?: '—' }}
                                    @if($adTim)<span class="muted">|</span> {{ $adTim }}@endif
                                    @if($adDur)<span class="muted">|</span> {{ $adDur }}@endif
                                </div>
                            @endforeach
                        </li>
                    @endforeach
                </ol>
            @else
                <div class="muted">No medicines</div>
            @endif

            @php
                $advices = $rx->sections->where('section_type', 'advice');
            @endphp
            @if($advices->isNotEmpty())
                <h3>Advices</h3>
                <ul>
                    @foreach($advices as $a)
                        <li>{{ $a->content }}</li>
                    @endforeach
                </ul>
            @endif

            @if($rx->follow_up_date)
                <div class="followup">
                    <strong>Follow up:</strong>
                    @if($rx->follow_up_duration_value && $rx->follow_up_duration_unit)
                        {{ $rx->follow_up_duration_value }} {{ $rx->follow_up_duration_unit }} later
                        ({{ \Carbon\Carbon::parse($rx->follow_up_date)->format('d-M-Y') }})
                    @else
                        {{ \Carbon\Carbon::parse($rx->follow_up_date)->format('d-M-Y') }}
                    @endif
                </div>
            @endif
        </div>
    </div>

    @if($showFooter)
        <div class="footer">
            @if($footerMode === 'image' && $profile?->prescription_footer_image)
                <img class="full" src="{{ public_path('storage/'.$profile->prescription_footer_image) }}" alt="Footer">
            @elseif($footerMode === 'signature')
                <div class="sig">
                    @if($profile?->signature_image)
                        <img src="{{ public_path('storage/'.$profile->signature_image) }}" alt="Signature">
                    @endif
                    <div class="name">{{ $doctor?->name }}</div>
                    @if($profile?->bmdc_number)<div class="meta">BMDC: {{ $profile->bmdc_number }}</div>@endif
                </div>
            @endif
            @if($profile?->prescription_footer_text)
                <div class="meta" style="margin-top:4px">{{ $profile->prescription_footer_text }}</div>
            @endif
        </div>
    @endif

    <div class="uid">{{ $rx->prescription_uid }}</div>
</div>
