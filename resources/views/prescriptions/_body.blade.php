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
        /** Convert any Bangla numerals (০-৯) in a value to English (0-9). */
        function _rxToEn($v): string {
            if ($v === null) return '';
            return strtr((string) $v, [
                '০' => '0', '১' => '1', '২' => '2', '৩' => '3', '৪' => '4',
                '৫' => '5', '৬' => '6', '৭' => '7', '৮' => '8', '৯' => '9',
            ]);
        }
        function _rxTimingLabel($t) {
            return match($t) {
                'before_meal' => 'Before meal',
                'after_meal' => 'After meal',
                'empty_stomach' => 'Empty stomach',
                'with_food' => 'With meal',
                'bedtime' => 'Bedtime',
                'as_needed' => 'As needed',
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
            return collect($parts)->map(fn ($v) => ($v === null || $v === '') ? '0' : _rxToEn($v))->implode('+');
        }
        function _rxDuration($value, $unit) {
            if (!$unit) return '';
            if ($unit === 'continue') return 'continue';
            if ($unit === 'N_A') return 'N/A';
            if (!$value) return '';
            return _rxToEn($value) . ' ' . $unit;
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
                        @if($profile?->degrees)<div class="degrees">{{ $profile->degrees }}</div>@endif
                        @php $role = collect([$profile?->designation, $profile?->specialization])->filter()->implode(' · '); @endphp
                        @if($role)<div class="meta">{{ $role }}</div>@endif
                        @if($profile?->bmdc_number)
                            <div class="reg">
                                <span class="reg-label">BMDC Reg. No.</span>
                                <span class="reg-no">{{ $profile->bmdc_number }}</span>
                                @if($profile->bmdc_verified)
                                    {{-- Plain inline mark: a filled pill reads as a
                                         web badge and wastes ink on paper. --}}
                                    <span class="reg-ok">&#10003; Verified</span>
                                @endif
                            </div>
                        @endif
                    </div>
                    <div class="col right">
                        @if($showLogo && $hospital?->logo)
                            <img src="{{ public_path('storage/'.$hospital->logo) }}" alt="">
                        @endif
                        <div class="org">{{ $hospital?->name }}</div>
                        @if($hospital?->address)<div class="meta">{{ $hospital->address }}</div>@endif
                        @if($hospital?->phone)<div class="meta">{{ $hospital->phone }}</div>@endif
                    </div>
                </div>
                @if($profile?->prescription_header_text)
                    <div class="hdr-note">{{ $profile->prescription_header_text }}</div>
                @endif
            @endif
        </div>
    @endif

    <div class="patient-bar">
        <div class="c">
            <strong>Name:</strong> {{ $patient?->name }}
            <span class="muted">|</span>
            <strong>Age:</strong>
            @if($patient?->age_years) {{ _rxToEn($patient->age_years) }} Y @endif
            @if($patient?->age_months) {{ _rxToEn($patient->age_months) }} M @endif
            <span class="muted">|</span>
            <strong>Sex:</strong> {{ ucfirst($patient?->gender ?? '') }}
        </div>
        <div class="c r">
            <strong>Date:</strong> {{ \Carbon\Carbon::parse($rx->date)->format('d-M-Y') }}
            <span class="muted">|</span>
            <strong>ID:</strong> {{ $patient?->patient_uid }}
        </div>
    </div>

    @php
        $allergies = $patient?->allergies?->pluck('allergen')->filter()->values() ?? collect();
    @endphp
    @if($allergies->isNotEmpty())
        <div class="allergy-line" style="margin-top:6px;padding:4px 8px;background:#fee2e2;border-left:3px solid #dc2626;font-size:12px;color:#7f1d1d;">
            <strong>Drug allergies:</strong> {{ $allergies->implode(', ') }}
        </div>
    @endif

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
                $secGroups = [
                    'diagnosis'         => ['Diagnosis',           $rx->sections->where('section_type', 'diagnosis')],
                    'investigation'     => ['Investigations',      $rx->sections->where('section_type', 'investigation')],
                    'past_history'      => ['Past History',        $rx->sections->where('section_type', 'past_history')],
                    'drug_history'      => ['Drug History',        $rx->sections->where('section_type', 'drug_history')],
                    'negative_history'  => ['Negative History',    $rx->sections->where('section_type', 'negative_history')],
                    'gynae_history'     => ['Gynae History',       $rx->sections->where('section_type', 'gynae_history')],
                    'obstetric_history' => ['Obstetric History',   $rx->sections->where('section_type', 'obstetric_history')],
                    'breast_local'      => ['Breast / Local Exam', $rx->sections->where('section_type', 'breast_local')],
                    'previous_reports'  => ['Previous Reports',    $rx->sections->where('section_type', 'previous_reports')],
                    'referred_by'       => ['Referred By',         $rx->sections->where('section_type', 'referred_by')],
                ];
            @endphp

            @foreach($secGroups as [$title, $items])
                @if($items->isNotEmpty())
                    <h3>{{ $title }}</h3>
                    <ul>
                        @foreach($items as $s)
                            <li>{{ _rxToEn($s->content) }}</li>
                        @endforeach
                    </ul>
                @endif
            @endforeach
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
                                    $tim = $m->custom_instruction ? _rxToEn($m->custom_instruction) : _rxTimingLabel($m->timing);
                                    $dur = _rxDuration($m->duration_value, $m->duration_unit);
                                @endphp
                                {{ $dose ?: '—' }}
                                @if($tim)<span class="muted">|</span> {{ $tim }}@endif
                                @if($dur)<span class="muted">|</span> {{ $dur }}@endif
                            </div>
                            @foreach(($m->additional_doses ?? []) as $ad)
                                @php
                                    $adDose = $ad['dose_display'] ?? _rxDose($ad);
                                    $adTim = isset($ad['custom_instruction']) ? _rxToEn($ad['custom_instruction']) : null;
                                    $adDur = _rxDuration($ad['duration_value'] ?? null, $ad['duration_unit'] ?? null);
                                @endphp
                                <div class="addl">
                                    <span class="muted">and,</span>
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
                $rightGroups = [
                    ['Advices',       $rx->sections->where('section_type', 'advice')],
                    ['Next Plans',    $rx->sections->where('section_type', 'next_plan')],
                    ['Hospitalization / Referrals', $rx->sections->where('section_type', 'hospitalization')],
                    ['Operation Note', $rx->sections->where('section_type', 'operation_note')],
                    ['Lab Referrals', $rx->sections->where('section_type', 'lab_referral')],
                    ['Notes',         $rx->sections->where('section_type', 'notes')],
                ];
            @endphp
            @foreach($rightGroups as [$title, $items])
                @if($items->isNotEmpty())
                    <h3>{{ $title }}</h3>
                    <ul>
                        @foreach($items as $s)
                            <li>{{ _rxToEn($s->content) }}</li>
                        @endforeach
                    </ul>
                @endif
            @endforeach

            @if($rx->follow_up_date)
                <div class="followup">
                    <strong>Follow up:</strong>
                    @if($rx->follow_up_duration_value && $rx->follow_up_duration_unit)
                        {{ _rxToEn($rx->follow_up_duration_value) }} {{ $rx->follow_up_duration_unit }} later
                        ({{ \Carbon\Carbon::parse($rx->follow_up_date)->format('d-M-Y') }})
                    @else
                        {{ \Carbon\Carbon::parse($rx->follow_up_date)->format('d-M-Y') }}
                    @endif
                </div>
            @endif
        </div>
    </div>

    @if($rx->share_token)
        @php
            try {
                $verifyUrl = route('public.rx.verify', $rx->share_token);
                $qrSvg = \SimpleSoftwareIO\QrCode\Facades\QrCode::format('svg')
                    ->size(110)->margin(0)->generate($verifyUrl);
            } catch (\Throwable $e) {
                $qrSvg = null;
                $verifyUrl = null;
            }
        @endphp
        @if($qrSvg)
            {{-- DomPDF does not implement flexbox, so this is laid out with a
                 table to keep the code beside the text instead of above it. --}}
            <table class="verify" style="width:100%;margin-top:14px;border:1px solid #cbd5e1;border-radius:4px;border-collapse:separate;font-size:10px;color:#475569;page-break-inside:avoid;">
                <tr>
                    <td style="width:86px;padding:7px;vertical-align:top;">
                        {{-- Padding preserves the quiet zone scanners need. --}}
                        <div style="width:72px;height:72px;padding:3px;border:1px solid #e2e8f0;background:#ffffff;">{!! $qrSvg !!}</div>
                    </td>
                    <td style="padding:7px 7px 7px 0;vertical-align:middle;line-height:1.45;">
                        <div style="font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#0f4c81;">
                            Verify this prescription
                        </div>
                        <div style="color:#64748b;">Scan the code, or open the link below, to confirm this prescription is genuine.</div>
                        <div style="margin-top:3px;">
                            <span style="color:#94a3b8;">Rx ID</span>
                            <span style="font-family:monospace;font-weight:700;color:#0f172a;">{{ $rx->prescription_uid }}</span>
                            @if($patient?->patient_uid)
                                <span style="color:#94a3b8;padding-left:14px;">Patient ID</span>
                                <span style="font-family:monospace;font-weight:700;color:#0f172a;">{{ $patient->patient_uid }}</span>
                            @endif
                        </div>
                        @if($verifyUrl)
                            <div style="margin-top:2px;font-family:monospace;font-size:8.5px;color:#94a3b8;word-break:break-all;">{{ $verifyUrl }}</div>
                        @endif
                    </td>
                </tr>
            </table>
        @endif
    @endif

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
                    @if($profile?->bmdc_number)
                            <div class="meta">
                                BMDC: {{ $profile->bmdc_number }}
                                @if($profile->bmdc_verified)
                                    <span style="margin-left:4px;padding:1px 6px;background:#d1fae5;color:#065f46;border-radius:9px;font-size:9px;">&check; Verified</span>
                                @endif
                            </div>
                        @endif
                </div>
            @endif
            @if($profile?->prescription_footer_text)
                <div class="meta" style="margin-top:4px">{{ $profile->prescription_footer_text }}</div>
            @endif
        </div>
    @endif

    <div class="uid">{{ $rx->prescription_uid }}</div>
</div>
