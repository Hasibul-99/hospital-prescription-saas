import { DoctorProfile, Hospital, Patient, Prescription, PrescriptionMedicine } from '@/types';

interface Props {
    prescription: Prescription & {
        patient?: Patient;
        doctor?: { id: number; name: string; email?: string };
    };
    profile?: DoctorProfile | null;
    hospital?: Hospital | null;
}

export default function PrescriptionPrintLayout({ prescription, profile, hospital }: Props) {
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
                <header className="mb-2 border-b border-gray-400 pb-2">
                    {headerMode === 'image' && p.prescription_header_image ? (
                        <img src={storagePath(p.prescription_header_image)} alt="Header" className="w-full object-contain" style={{ maxHeight: '110px' }} />
                    ) : headerMode !== 'none' ? (
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-xl font-bold text-[#0f4c81]">{doctor?.name}</div>
                                {p.degrees && <div className="text-xs text-gray-700">{p.degrees}</div>}
                                {p.specialization && <div className="text-xs text-gray-700">{p.specialization}</div>}
                                {p.designation && <div className="text-xs text-gray-700">{p.designation}</div>}
                                {p.bmdc_number && <div className="text-xs text-gray-700">BMDC: {p.bmdc_number}</div>}
                            </div>
                            <div className="text-right">
                                {showLogo && hospital?.logo && (
                                    <img src={storagePath(hospital.logo)} alt="Logo" className="ml-auto object-contain" style={{ maxHeight: '70px' }} />
                                )}
                                <div className="text-xs font-medium">{hospital?.name}</div>
                                {hospital?.address && <div className="text-xs text-gray-700">{hospital.address}</div>}
                                {hospital?.phone && <div className="text-xs text-gray-700">Phone: {hospital.phone}</div>}
                            </div>
                        </div>
                    ) : null}
                    {p.prescription_header_text && <div className="mt-1 text-xs text-gray-700">{p.prescription_header_text}</div>}
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
                                            <span className="text-gray-500">এবং,</span>{' '}
                                            {buildAdditionalDose(ad) || '—'}
                                            {ad.custom_instruction && <><span className="mx-2 text-gray-400">|</span>{ad.custom_instruction}</>}
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

                    {prescription.follow_up_date && (
                        <div className="mt-3 border-l-4 border-[#0f4c81] bg-gray-100 px-2 py-1">
                            <strong>Follow up:</strong>{' '}
                            {prescription.follow_up_duration_value && prescription.follow_up_duration_unit
                                ? `${prescription.follow_up_duration_value} ${prescription.follow_up_duration_unit} later (${formatDate(prescription.follow_up_date)})`
                                : formatDate(prescription.follow_up_date)}
                        </div>
                    )}
                </div>
            </div>

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
                            {p.bmdc_number && <div className="text-xs text-gray-600">BMDC: {p.bmdc_number}</div>}
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
    if (m.dose_display) return m.dose_display;
    const parts = [m.dose_morning, m.dose_noon, m.dose_afternoon, m.dose_night, m.dose_bedtime];
    if (parts.every((v) => v == null)) return '';
    return parts.map((v) => (v == null ? '0' : String(v))).join('+');
}

function buildAdditionalDose(ad: NonNullable<PrescriptionMedicine['additional_doses']>[number]): string {
    if (ad.dose_display) return ad.dose_display;
    const parts = [ad.dose_morning, ad.dose_noon, ad.dose_afternoon, ad.dose_night, ad.dose_bedtime];
    if (parts.every((v) => v == null)) return '';
    return parts.map((v) => (v == null ? '0' : String(v))).join('+');
}

function timingText(m: PrescriptionMedicine): string {
    if (m.custom_instruction?.trim()) return m.custom_instruction.trim();
    return timingLabel(m.timing);
}

function durationText(m: PrescriptionMedicine): string {
    return formatDuration(m.duration_value, m.duration_unit);
}

function formatDuration(value?: number | null, unit?: string | null): string {
    if (!unit) return '';
    if (unit === 'continue') return 'চলবে';
    if (unit === 'N_A') return 'N/A';
    if (!value) return '';
    return `${value} ${unit}`;
}

function timingLabel(t?: string | null): string {
    switch (t) {
        case 'before_meal': return 'খাবারের আগে';
        case 'after_meal': return 'খাবারের পরে';
        case 'empty_stomach': return 'Empty stomach';
        case 'with_food': return 'খাবারের সাথে';
        default: return '';
    }
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
        return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return d;
    }
}

function formatAge(patient?: Patient): string {
    if (!patient) return '';
    const parts: string[] = [];
    if (patient.age_years) parts.push(`${patient.age_years} Y`);
    if (patient.age_months) parts.push(`${patient.age_months} M`);
    return parts.length ? parts.join(' ') : (patient.age_display ?? '');
}
