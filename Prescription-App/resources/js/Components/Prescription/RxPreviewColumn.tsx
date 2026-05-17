import { useState } from 'react';
import { MedicineInput } from '@/hooks/usePrescriptionReducer';
import { timingLabel } from '@/utils/timingLabel';

const HOSPITALIZATION_PRESETS = [
    'Routine follow-up',
    'Emergency review if condition worsens',
    'Admission considered if no improvement in 48 h',
    'Referred to specialist',
];

const FOLLOW_UP_QUICK = [3, 7, 14, 30];

interface Props {
    medicines: MedicineInput[];
    followUpDate: string | null;
    followUpDurationValue: number | null;
    followUpDurationUnit: 'days' | 'months' | 'years' | null;
    onOpenMedicineModal: () => void;
    onEditMedicine: (index: number) => void;
    onRemoveMedicine: (index: number) => void;
    onFollowUpChange: (
        date: string | null,
        value: number | null,
        unit: 'days' | 'months' | 'years' | null,
    ) => void;
}

export default function RxPreviewColumn({
    medicines,
    followUpDate,
    followUpDurationValue,
    followUpDurationUnit,
    onOpenMedicineModal,
    onEditMedicine,
    onRemoveMedicine,
    onFollowUpChange,
}: Props) {
    const [hospitalizations, setHospitalizations] = useState<string[]>([]);

    return (
        <div style={{
            height: '100%', overflowY: 'auto', padding: '12px 12px 12px 6px',
            display: 'flex', flexDirection: 'column', gap: 10,
            fontFamily: "'Inter', system-ui, sans-serif",
        }}>

            {/* ── Prescription card ── */}
            <RxCard
                icon={<span style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: 18, fontWeight: 700, color: '#0a8754' }}>℞</span>}
                title="Prescription"
                badge={medicines.length > 0 ? `${medicines.length} medicine${medicines.length !== 1 ? 's' : ''}` : undefined}
            >
                {medicines.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '16px 8px', color: '#9aa8a0' }}>
                        <div style={{ fontSize: 22, marginBottom: 4, opacity: 0.35 }}>⊕</div>
                        <div style={{ fontSize: 12.5 }}>No medicines yet. Click below to add.</div>
                    </div>
                ) : (
                    medicines.map((m, i) => <MedRow key={i} index={i} medicine={m} onEdit={() => onEditMedicine(i)} onRemove={() => onRemoveMedicine(i)} />)
                )}

                <button
                    type="button"
                    onClick={onOpenMedicineModal}
                    style={{
                        marginTop: medicines.length ? 10 : 6, width: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '8px 10px', borderRadius: 8,
                        background: '#f0f8f3', color: '#0d6e46', fontWeight: 600, fontSize: 13,
                        border: '1px dashed rgba(10,135,84,.35)', cursor: 'pointer',
                        fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#e6f4ec'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f0f8f3'; }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add medicines
                    <span style={{ opacity: 0.6, fontSize: 11, marginLeft: 'auto' }}>⌘K</span>
                </button>
            </RxCard>

            {/* ── Hospitalization / Referrals card ── */}
            <RxCard title="Hospitalization / Referrals" badge={hospitalizations.length > 0 ? `${hospitalizations.length} added` : undefined}>
                {hospitalizations.map((h, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontWeight: 500, fontSize: 13, color: '#0f1a14' }}>{h}</span>
                        <button
                            type="button"
                            onClick={() => setHospitalizations((prev) => prev.filter((_, idx) => idx !== i))}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9aa8a0', display: 'grid', placeItems: 'center', padding: 2 }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#b3261e'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#9aa8a0'; }}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 6L18 18M6 18L18 6"/></svg>
                        </button>
                    </div>
                ))}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: hospitalizations.length ? 8 : 0 }}>
                    {HOSPITALIZATION_PRESETS.filter((p) => !hospitalizations.includes(p)).map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => setHospitalizations((prev) => [...prev, p])}
                            style={chipStyle}
                        >
                            + {p}
                        </button>
                    ))}
                </div>
            </RxCard>

            {/* ── Follow-up card ── */}
            <RxCard title="Follow-up" subtitle="When should patient return?">
                {/* On date */}
                <div style={{ marginBottom: 10 }}>
                    <div style={rowLabel}>On date</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                            type="date"
                            value={followUpDate ?? ''}
                            onChange={(e) => onFollowUpChange(e.target.value || null, followUpDurationValue, followUpDurationUnit)}
                            style={{
                                flex: 1, padding: '6px 10px', border: '1px solid #e3e7e3',
                                borderRadius: 7, fontSize: 13, fontFamily: 'inherit', outline: 'none',
                            }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = '#0a8754'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = '#e3e7e3'; }}
                        />
                        {followUpDate && (
                            <button
                                type="button"
                                onClick={() => onFollowUpChange(null, followUpDurationValue, followUpDurationUnit)}
                                style={{ fontSize: 11.5, color: '#6a7a72', padding: '4px 8px', borderRadius: 5, border: '1px solid #e3e7e3', background: '#fff', cursor: 'pointer' }}
                            >Clear</button>
                        )}
                    </div>
                </div>

                {/* Or after */}
                <div>
                    <div style={rowLabel}>Or after</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <input
                            type="number"
                            min="1"
                            value={followUpDurationValue ?? ''}
                            onChange={(e) => onFollowUpChange(followUpDate, e.target.value === '' ? null : Number(e.target.value), followUpDurationUnit ?? 'days')}
                            style={{ width: 60, padding: '6px 8px', border: '1px solid #e3e7e3', borderRadius: 7, fontSize: 13, fontFamily: 'inherit', outline: 'none', textAlign: 'center' }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = '#0a8754'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = '#e3e7e3'; }}
                        />
                        {/* Unit toggle */}
                        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid #e3e7e3' }}>
                            {(['days', 'months', 'years'] as const).map((u) => {
                                const active = (followUpDurationUnit ?? 'days') === u;
                                return (
                                    <button
                                        key={u}
                                        type="button"
                                        onClick={() => onFollowUpChange(followUpDate, followUpDurationValue, u)}
                                        style={{
                                            padding: '5px 9px', fontSize: 12, fontWeight: 500,
                                            border: 'none', background: active ? '#0a8754' : '#fff',
                                            color: active ? '#fff' : '#6a7a72', cursor: 'pointer',
                                            borderRight: u !== 'months' ? '1px solid #e3e7e3' : 'none',
                                            fontFamily: 'inherit',
                                        }}
                                    >{u}</button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick day chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                        {FOLLOW_UP_QUICK.map((d) => {
                            const active = followUpDurationValue === d && (followUpDurationUnit ?? 'days') === 'days' && !followUpDate;
                            return (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => onFollowUpChange(null, d, 'days')}
                                    style={{
                                        padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                                        border: `1px solid ${active ? '#0a8754' : '#e3e7e3'}`,
                                        background: active ? '#0a8754' : '#fff',
                                        color: active ? '#fff' : '#2b3a32', cursor: 'pointer',
                                        fontFamily: 'inherit',
                                    }}
                                >{d} days</button>
                            );
                        })}
                    </div>
                </div>
            </RxCard>
        </div>
    );
}

/* ── Sub-components ── */

function RxCard({ icon, title, subtitle, badge, children }: {
    icon?: React.ReactNode; title: string; subtitle?: string;
    badge?: string; children: React.ReactNode;
}) {
    return (
        <div style={{ background: '#fff', border: '1px solid #e3e7e3', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px 8px',
                borderBottom: '1px solid #e3e7e3',
            }}>
                {icon && <div style={{ flexShrink: 0 }}>{icon}</div>}
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: '#0f1a14' }}>{title}</div>
                    {subtitle && <div style={{ fontSize: 11.5, color: '#6a7a72', marginTop: 1 }}>{subtitle}</div>}
                </div>
                {badge && (
                    <span style={{ background: '#e6f4ec', color: '#0d6e46', fontSize: 11, padding: '1px 7px', borderRadius: 999, fontWeight: 600 }}>
                        {badge}
                    </span>
                )}
            </div>
            <div style={{ padding: '10px 14px 14px' }}>{children}</div>
        </div>
    );
}

function MedRow({ index, medicine: m, onEdit, onRemove }: {
    index: number; medicine: MedicineInput; onEdit: () => void; onRemove: () => void;
}) {
    const abbr = abbreviate(m.medicine_type ?? '');
    const doseStr = [m.dose_morning, m.dose_noon, m.dose_afternoon, m.dose_night]
        .map((v) => v ?? 0).join('+');
    const hasAnyDose = [m.dose_morning, m.dose_noon, m.dose_afternoon, m.dose_night].some((v) => v != null && v > 0);

    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '7px 0', borderBottom: '1px solid #f0f2f0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6a7a72', minWidth: 18, marginTop: 2 }}>
                {index + 1}.
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: '#0f1a14' }}>
                    {abbr ? `${abbr}. ` : ''}{m.medicine_name}
                    {m.strength && <span style={{ fontWeight: 400, fontSize: 12, color: '#6a7a72', marginLeft: 4 }}>{m.strength}</span>}
                </div>
                <div style={{ fontSize: 11.5, color: '#6a7a72', marginTop: 2, display: 'flex', flexWrap: 'wrap', gap: '2px 6px', fontFamily: "'Noto Sans Bengali', 'Inter', sans-serif" }}>
                    {hasAnyDose && <span style={{ fontFamily: 'monospace', color: '#0a8754', fontWeight: 700 }}>{doseStr}</span>}
                    {m.timing && <span>· {timingLabel(m.timing)}</span>}
                    {m.duration_value && <span>· {m.duration_value} {m.duration_unit ?? 'days'}</span>}
                    {m.custom_instruction && <span style={{ fontStyle: 'italic' }}>· {m.custom_instruction}</span>}
                </div>
            </div>
            <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                <button
                    type="button"
                    onClick={onEdit}
                    style={iconBtn}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#0a8754'; e.currentTarget.style.borderColor = '#0a8754'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#9aa8a0'; e.currentTarget.style.borderColor = '#e3e7e3'; }}
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
                <button
                    type="button"
                    onClick={onRemove}
                    style={iconBtn}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fdecec'; e.currentTarget.style.color = '#b3261e'; e.currentTarget.style.borderColor = '#f5c6c6'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9aa8a0'; e.currentTarget.style.borderColor = '#e3e7e3'; }}
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                </button>
            </div>
        </div>
    );
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
    return type;
}

const chipStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500,
    background: '#fff', border: '1px solid #e3e7e3', color: '#2b3a32',
    whiteSpace: 'nowrap', cursor: 'pointer', lineHeight: 1.4, fontFamily: 'inherit',
};

const iconBtn: React.CSSProperties = {
    width: 24, height: 24, borderRadius: 5, border: '1px solid #e3e7e3',
    background: 'transparent', color: '#9aa8a0', cursor: 'pointer',
    display: 'grid', placeItems: 'center', flexShrink: 0,
};

const rowLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: '#6a7a72', letterSpacing: '0.04em',
    textTransform: 'uppercase', marginBottom: 6,
};
