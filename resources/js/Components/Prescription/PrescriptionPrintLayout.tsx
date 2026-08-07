import { DoctorProfile, Hospital, Patient, Prescription, PrescriptionMedicine } from '@/types';
import { timingLabel } from '@/utils/timingLabel';
import { toEnglishNumerals } from '@/utils/numerals';

interface Props {
    prescription: Prescription & {
        patient?: Patient;
        doctor?: { id: number; name: string; email?: string };
    };
    profile?: DoctorProfile | null;
    hospital?: Hospital | null;
    verifyUrl?: string | null;
    /** Pre-rendered SVG for DomPDF; on the web preview a <svg>-based QR is drawn client-side. */
    qrSvg?: string | null;
}

export default function PrescriptionPrintLayout({ prescription, profile, hospital, verifyUrl, qrSvg }: Props) {
    // Guard the type, not just the truthiness: anything other than a string
    // would render as "[object Object]" inside dangerouslySetInnerHTML.
    const hasQr = typeof qrSvg === 'string' && qrSvg.trim().length > 0;
    const p = (profile ?? {}) as Partial<DoctorProfile>;
    const showHeader = p.print_show_header ?? true;
    const showFooter = p.print_show_footer ?? true;
    const showLogo = p.print_show_logo ?? true;
    const headerMode: string = p.print_header_mode ?? 'text';
    const footerMode: string = p.print_footer_mode ?? 'signature';
    const fontSize = ({ small: 11, large: 15 } as Record<string, number>)[p.print_font_size as string] ?? 13;

    const patient = prescription.patient;
    const doctor = prescription.doctor;
    const complaints = prescription.complaints ?? [];
    const examinations = prescription.examinations ?? [];
    const sections = prescription.sections ?? [];
    const diagnosis = sections.filter((s) => s.section_type === 'diagnosis');
    const investigations = sections.filter((s) => s.section_type === 'investigation');
    const advices = sections.filter((s) => s.section_type === 'advice');
    const pastHistory = sections.filter((s) => s.section_type === 'past_history');
    const drugHistory = sections.filter((s) => s.section_type === 'drug_history');
    const nextPlan = sections.filter((s) => s.section_type === 'next_plan');
    const negativeHistory = sections.filter((s) => s.section_type === 'negative_history');
    const gynaeHistory = sections.filter((s) => s.section_type === 'gynae_history');
    const obstetricHistory = sections.filter((s) => s.section_type === 'obstetric_history');
    const breastLocal = sections.filter((s) => s.section_type === 'breast_local');
    const previousReports = sections.filter((s) => s.section_type === 'previous_reports');
    const referredBy = sections.filter((s) => s.section_type === 'referred_by');
    const notes = sections.filter((s) => s.section_type === 'notes');
    const labReferrals = sections.filter((s) => s.section_type === 'lab_referral');
    const hospitalization = sections.filter((s) => s.section_type === 'hospitalization');
    const operationNote = sections.filter((s) => s.section_type === 'operation_note');
    const medicines = prescription.medicines ?? [];

    const storagePath = (rel?: string | null) => (rel ? `/storage/${rel}` : '');

    return (
        <div
            id="rx-print-area"
            className="rx-print mx-auto bg-white text-gray-900 shadow"
            style={{
                width: '210mm',
                minHeight: '297mm',
                padding: `${p.print_margin_top ?? 10}mm ${p.print_margin_right ?? 10}mm ${p.print_margin_bottom ?? 10}mm ${p.print_margin_left ?? 10}mm`,
                fontSize: `${fontSize}px`,
                fontFamily: "'Noto Sans Bengali', 'Noto Sans', system-ui, sans-serif",
            }}
        >
            {showHeader && (
                <header className="mb-3">
                    {headerMode === 'image' && p.prescription_header_image ? (
                        <img src={storagePath(p.prescription_header_image)} alt="Header" className="w-full object-contain" style={{ maxHeight: '110px' }} />
                    ) : headerMode !== 'none' ? (
                        <div className="flex items-start justify-between gap-6 pb-2">
                            {/* Prescriber identity — the legally significant half
                                of a letterhead, so it leads and carries the weight. */}
                            <div className="min-w-0">
                                <div className="text-[1.55em] font-bold leading-tight text-[#0f4c81]">
                                    {doctor?.name}
                                </div>

                                {p.degrees && (
                                    <div className="mt-0.5 text-[0.92em] font-medium text-gray-800">{p.degrees}</div>
                                )}

                                {(p.specialization || p.designation) && (
                                    <div className="text-[0.85em] text-gray-600">
                                        {[p.designation, p.specialization].filter(Boolean).join(' · ')}
                                    </div>
                                )}

                                {p.bmdc_number && (
                                    <div className="mt-1 inline-flex items-center gap-1 text-[0.8em] text-gray-700">
                                        <span>
                                            <span className="text-gray-500">BMDC Reg. No.</span>{' '}
                                            <span className="font-semibold tracking-wide">{p.bmdc_number}</span>
                                        </span>
                                        {p.bmdc_verified && (
                                            /* A discreet inline mark: a filled pill
                                               reads as a web badge and burns ink. */
                                            <span className="inline-flex items-center gap-0.5 border-l border-gray-300 pl-1.5 text-[#0f4c81]">
                                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                    <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
                                                    <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <span className="font-medium">Verified</span>
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Practice / chamber block. */}
                            <div className="flex-none text-right">
                                {showLogo && hospital?.logo && (
                                    <img
                                        src={storagePath(hospital.logo)}
                                        alt=""
                                        className="ml-auto mb-1 object-contain"
                                        style={{ maxHeight: '54px' }}
                                    />
                                )}
                                <div className="text-[1em] font-semibold leading-tight text-gray-900">
                                    {hospital?.name}
                                </div>
                                {hospital?.address && (
                                    <div className="mt-0.5 max-w-[62mm] text-[0.8em] leading-snug text-gray-600">
                                        {hospital.address}
                                    </div>
                                )}
                                {hospital?.phone && (
                                    <div className="text-[0.8em] text-gray-600">{hospital.phone}</div>
                                )}
                            </div>
                        </div>
                    ) : null}

                    {p.prescription_header_text && (
                        // pre-line: doctors type multi-line letterheads in here and
                        // HTML would otherwise collapse every newline into a space.
                        <div
                            className="pb-1.5 text-[0.8em] leading-snug text-gray-600"
                            style={{ whiteSpace: 'pre-line' }}
                        >
                            {p.prescription_header_text}
                        </div>
                    )}

                    {/* Weighted rule: a solid accent over a hairline gives the
                        letterhead a definite edge without a heavy printed band. */}
                    <div style={{ height: 2, background: '#0f4c81' }} />
                    <div style={{ height: 1, background: '#cbd5e1', marginTop: 1 }} />
                </header>
            )}

            <div className="mb-2 flex items-center justify-between border-y border-dashed border-gray-500 py-1">
                <div>
                    <strong>Name:</strong> {patient?.name}
                    <span className="mx-2 text-gray-400">|</span>
                    <strong>Age:</strong> {formatAge(patient)}
                    <span className="mx-2 text-gray-400">|</span>
                    <strong>Sex:</strong> {patient?.gender ? patient.gender[0].toUpperCase() + patient.gender.slice(1) : ''}
                </div>
                <div className="text-right">
                    <strong>Date:</strong> {formatDate(prescription.date)}
                    <span className="mx-2 text-gray-400">|</span>
                    <strong>ID:</strong> {patient?.patient_uid}
                </div>
            </div>

            {patient?.allergies && patient.allergies.length > 0 && (
                <div className="mb-2 border-l-4 border-red-500 bg-red-50 px-2 py-1 text-xs text-red-800">
                    <strong>Drug allergies:</strong>{' '}
                    {patient.allergies.map((a) => a.allergen).join(', ')}
                </div>
            )}

            <div className="grid gap-3" style={{ gridTemplateColumns: '35% 65%' }}>
                <div className="border-r border-gray-200 pr-2">
                    {complaints.length > 0 && (
                        <Section title="Patient Complaints">
                            <ul className="list-disc pl-4">
                                {complaints.map((c) => (
                                    <li key={c.id}>
                                        {c.complaint_name}
                                        {c.duration_text && ` — ${c.duration_text}`}
                                        {c.note && <div className="text-xs text-gray-500">{c.note}</div>}
                                    </li>
                                ))}
                            </ul>
                        </Section>
                    )}

                    {examinations.length > 0 && (
                        <Section title="On Examination">
                            <ul className="list-disc pl-4">
                                {examinations.map((e) => (
                                    <li key={e.id}>
                                        {e.examination_name}
                                        {e.finding_value && `: ${e.finding_value}`}
                                        {e.note && <div className="text-xs text-gray-500">{e.note}</div>}
                                    </li>
                                ))}
                            </ul>
                        </Section>
                    )}

                    {diagnosis.length > 0 && (
                        <Section title="Diagnosis">
                            <ul className="list-disc pl-4">
                                {diagnosis.map((d) => <li key={d.id}>{d.content}</li>)}
                            </ul>
                        </Section>
                    )}

                    {investigations.length > 0 && (
                        <Section title="Investigations">
                            <ul className="list-disc pl-4">
                                {investigations.map((d) => <li key={d.id}>{d.content}</li>)}
                            </ul>
                        </Section>
                    )}

                    {pastHistory.length > 0 && (
                        <Section title="Past History">
                            <ul className="list-disc pl-4">{pastHistory.map((s) => <li key={s.id}>{s.content}</li>)}</ul>
                        </Section>
                    )}
                    {drugHistory.length > 0 && (
                        <Section title="Drug History">
                            <ul className="list-disc pl-4">{drugHistory.map((s) => <li key={s.id}>{s.content}</li>)}</ul>
                        </Section>
                    )}
                    {negativeHistory.length > 0 && (
                        <Section title="Negative History">
                            <ul className="list-disc pl-4">{negativeHistory.map((s) => <li key={s.id}>{s.content}</li>)}</ul>
                        </Section>
                    )}
                    {gynaeHistory.length > 0 && (
                        <Section title="Gynae History">
                            <ul className="list-disc pl-4">{gynaeHistory.map((s) => <li key={s.id}>{s.content}</li>)}</ul>
                        </Section>
                    )}
                    {obstetricHistory.length > 0 && (
                        <Section title="Obstetric History">
                            <ul className="list-disc pl-4">{obstetricHistory.map((s) => <li key={s.id}>{s.content}</li>)}</ul>
                        </Section>
                    )}
                    {breastLocal.length > 0 && (
                        <Section title="Breast / Local Exam">
                            <ul className="list-disc pl-4">{breastLocal.map((s) => <li key={s.id}>{s.content}</li>)}</ul>
                        </Section>
                    )}
                    {previousReports.length > 0 && (
                        <Section title="Previous Reports">
                            <ul className="list-disc pl-4">{previousReports.map((s) => <li key={s.id}>{s.content}</li>)}</ul>
                        </Section>
                    )}
                    {referredBy.length > 0 && (
                        <Section title="Referred By">
                            <ul className="list-disc pl-4">{referredBy.map((s) => <li key={s.id}>{s.content}</li>)}</ul>
                        </Section>
                    )}
                </div>

                <div className="pl-2">
                    <div className="text-2xl font-bold text-[#0f4c81]">Rx</div>
                    {medicines.length > 0 ? (
                        <ol className="mt-1 list-decimal space-y-1 pl-5">
                            {medicines.map((m) => (
                                <li key={m.id}>
                                    <div className="font-semibold">{medicineLabel(m)}</div>
                                    <div className="pl-1">
                                        {buildDose(m) || '—'}
                                        {timingText(m) && <><span className="mx-2 text-gray-400">|</span>{timingText(m)}</>}
                                        {durationText(m) && <><span className="mx-2 text-gray-400">|</span>{durationText(m)}</>}
                                    </div>
                                    {(m.additional_doses ?? []).map((ad, i) => (
                                        <div key={i} className="pl-4 text-gray-700">
                                            <span className="text-gray-500">and,</span>{' '}
                                            {buildAdditionalDose(ad) || '—'}
                                            {ad.custom_instruction && <><span className="mx-2 text-gray-400">|</span>{toEnglishNumerals(ad.custom_instruction)}</>}
                                            {formatDuration(ad.duration_value, ad.duration_unit) && (
                                                <><span className="mx-2 text-gray-400">|</span>{formatDuration(ad.duration_value, ad.duration_unit)}</>
                                            )}
                                        </div>
                                    ))}
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <div className="text-gray-500">No medicines</div>
                    )}

                    {advices.length > 0 && (
                        <Section title="Advices">
                            <ul className="list-disc pl-4">
                                {advices.map((a) => <li key={a.id}>{a.content}</li>)}
                            </ul>
                        </Section>
                    )}

                    {nextPlan.length > 0 && (
                        <Section title="Next Plans">
                            <ul className="list-disc pl-4">{nextPlan.map((s) => <li key={s.id}>{s.content}</li>)}</ul>
                        </Section>
                    )}

                    {hospitalization.length > 0 && (
                        <Section title="Hospitalization / Referrals">
                            <ul className="list-disc pl-4">{hospitalization.map((s) => <li key={s.id}>{s.content}</li>)}</ul>
                        </Section>
                    )}

                    {operationNote.length > 0 && (
                        <Section title="Operation Note">
                            <ul className="list-disc pl-4">{operationNote.map((s) => <li key={s.id}>{s.content}</li>)}</ul>
                        </Section>
                    )}

                    {labReferrals.length > 0 && (
                        <Section title="Lab Referrals">
                            <ul className="list-disc pl-4">{labReferrals.map((s) => <li key={s.id}>{s.content}</li>)}</ul>
                        </Section>
                    )}

                    {notes.length > 0 && (
                        <Section title="Notes">
                            <ul className="list-disc pl-4">{notes.map((s) => <li key={s.id}>{s.content}</li>)}</ul>
                        </Section>
                    )}

                    {prescription.follow_up_date && (
                        <div className="mt-3 border-l-4 border-[#0f4c81] bg-gray-100 px-2 py-1">
                            <strong>Follow up:</strong>{' '}
                            {prescription.follow_up_duration_value && prescription.follow_up_duration_unit
                                ? `${toEnglishNumerals(prescription.follow_up_duration_value)} ${prescription.follow_up_duration_unit} later (${formatDate(prescription.follow_up_date)})`
                                : formatDate(prescription.follow_up_date)}
                        </div>
                    )}
                </div>
            </div>

            {(verifyUrl || hasQr) && (
                <div
                    className="mt-4 flex items-stretch gap-3 rounded border border-gray-300 p-2.5 text-[10px] leading-tight text-gray-700"
                    style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                >
                    {/* Framed with padding so the code keeps its quiet zone —
                        scanners need white margin around the modules. */}
                    <div className="flex-none self-start rounded border border-gray-200 bg-white p-1">
                        {hasQr ? (
                            <div
                                style={{ width: 120, height: 120 }}
                                dangerouslySetInnerHTML={{ __html: qrSvg as string }}
                            />
                        ) : (
                            <div className="grid h-[120px] w-[120px] place-items-center text-center text-[9px] text-gray-400">
                                QR unavailable
                            </div>
                        )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                        <div className="flex items-center gap-1.5">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path
                                    d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"
                                    stroke="#0f4c81"
                                    strokeWidth="2"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="m9 12 2 2 4-4"
                                    stroke="#0f4c81"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <span className="font-semibold uppercase tracking-wide text-[#0f4c81]">
                                Verify this prescription
                            </span>
                        </div>

                        <div className="text-gray-600">
                            Scan the code, or open the link below, to confirm this prescription is genuine.
                        </div>

                        {/* Labelled pairs rather than a run of "X: Y" lines, so the
                            IDs stay findable when read off paper. */}
                        <div className="mt-0.5 flex flex-wrap gap-x-5 gap-y-0.5">
                            <div>
                                <span className="text-gray-500">Rx ID</span>{' '}
                                <span className="font-mono font-semibold text-gray-900">
                                    {prescription.prescription_uid}
                                </span>
                            </div>
                            {patient?.patient_uid && (
                                <div>
                                    <span className="text-gray-500">Patient ID</span>{' '}
                                    <span className="font-mono font-semibold text-gray-900">
                                        {patient.patient_uid}
                                    </span>
                                </div>
                            )}
                        </div>

                        {verifyUrl && (
                            <div className="break-all font-mono text-[8.5px] text-gray-400">{verifyUrl}</div>
                        )}
                    </div>
                </div>
            )}

            {showFooter && (
                <footer className="mt-6 border-t border-gray-300 pt-2">
                    {footerMode === 'image' && p.prescription_footer_image ? (
                        <img src={storagePath(p.prescription_footer_image)} alt="Footer" className="w-full object-contain" style={{ maxHeight: '90px' }} />
                    ) : footerMode === 'signature' ? (
                        <div className="text-right">
                            {p.signature_image && (
                                <img src={storagePath(p.signature_image)} alt="Signature" className="ml-auto object-contain" style={{ maxHeight: '60px' }} />
                            )}
                            <div className="font-semibold">{doctor?.name}</div>
                            {p.bmdc_number && (
                                <div className="text-xs text-gray-600">
                                    BMDC: {p.bmdc_number}
                                    {p.bmdc_verified && (
                                        <span title="BMDC verified by admin" className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800">✓ Verified</span>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : null}
                    {p.prescription_footer_text && <div className="mt-1 text-xs text-gray-700">{p.prescription_footer_text}</div>}
                </footer>
            )}

            <div className="mt-1 text-right text-xs text-gray-500">{prescription.prescription_uid}</div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="mt-2">
            <h3 className="border-b border-gray-200 pb-0.5 text-sm font-semibold text-[#0f4c81]">{title}</h3>
            <div className="mt-1 text-sm">{children}</div>
        </div>
    );
}

function medicineLabel(m: PrescriptionMedicine): string {
    const abbr = abbreviate(m.medicine_type ?? '');
    return `${abbr ? abbr + '. ' : ''}${m.medicine_name}${m.strength ? ' ' + m.strength : ''}`;
}

function buildDose(m: PrescriptionMedicine): string {
    if (m.dose_display) return toEnglishNumerals(m.dose_display);
    const parts = [m.dose_morning, m.dose_noon, m.dose_afternoon, m.dose_night, m.dose_bedtime];
    if (parts.every((v) => v == null)) return '';
    return parts.map((v) => (v == null ? '0' : toEnglishNumerals(v))).join('+');
}

function buildAdditionalDose(ad: NonNullable<PrescriptionMedicine['additional_doses']>[number]): string {
    if (ad.dose_display) return toEnglishNumerals(ad.dose_display);
    const parts = [ad.dose_morning, ad.dose_noon, ad.dose_afternoon, ad.dose_night, ad.dose_bedtime];
    if (parts.every((v) => v == null)) return '';
    return parts.map((v) => (v == null ? '0' : toEnglishNumerals(v))).join('+');
}

function timingText(m: PrescriptionMedicine): string {
    if (m.custom_instruction?.trim()) return toEnglishNumerals(m.custom_instruction.trim());
    return timingLabel(m.timing);
}

function durationText(m: PrescriptionMedicine): string {
    return formatDuration(m.duration_value, m.duration_unit);
}

function formatDuration(value?: number | null, unit?: string | null): string {
    if (!unit) return '';
    if (unit === 'continue') return 'continue';
    if (unit === 'N_A') return 'N/A';
    if (!value) return '';
    return `${toEnglishNumerals(value)} ${unit}`;
}


function abbreviate(type: string): string {
    const t = type.toLowerCase();
    if (t.startsWith('tab')) return 'Tab';
    if (t.startsWith('cap')) return 'Cap';
    if (t.startsWith('syr')) return 'Syr';
    if (t.startsWith('inj')) return 'Inj';
    if (t.startsWith('sup')) return 'Supp';
    if (t.startsWith('cre')) return 'Cream';
    if (t.startsWith('oin')) return 'Oint';
    if (t.startsWith('dro')) return 'Drops';
    if (t.startsWith('gel')) return 'Gel';
    if (t.startsWith('pow')) return 'Pwd';
    return type;
}

function formatDate(d: string): string {
    if (!d) return '';
    try {
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return d;
        return toEnglishNumerals(dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
    } catch {
        return d;
    }
}

function formatAge(patient?: Patient): string {
    if (!patient) return '';
    const parts: string[] = [];
    if (patient.age_years) parts.push(`${toEnglishNumerals(patient.age_years)} Y`);
    if (patient.age_months) parts.push(`${toEnglishNumerals(patient.age_months)} M`);
    return parts.length ? parts.join(' ') : toEnglishNumerals(patient.age_display ?? '');
}
