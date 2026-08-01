import { useState } from 'react';
import SectionAccordion from './SectionAccordion';
import { ExaminationInput } from '@/hooks/usePrescriptionReducer';

interface Props {
    items: ExaminationInput[];
    onAdd: (e: ExaminationInput) => void;
    onUpdate: (i: number, patch: Partial<ExaminationInput>) => void;
    onRemove: (i: number) => void;
}

const COMMON = [
    { name: 'Temperature', bn: '' },
    { name: 'BP', bn: '' },
    { name: 'Pulse', bn: '' },
    { name: 'SpO2', bn: '' },
    { name: 'Weight', bn: '' },
    { name: 'Height', bn: '' },
    { name: 'Pallor', bn: '' },
    { name: 'Jaundice', bn: '' },
    { name: 'Oedema', bn: '' },
    { name: 'Lymphadenopathy', bn: '' },
    { name: 'Chest — clear', bn: '' },
    { name: 'Abdomen — soft', bn: '' },
    { name: 'Heart sounds normal', bn: '' },
    { name: 'CNS — conscious', bn: '' },
];

const FINDING_PRESETS = ['Normal', 'Mild', 'Moderate', 'Severe', 'Bilateral', 'Unilateral', 'Pending', 'Absent'];

function computeBmi(items: ExaminationInput[]): string | null {
    const wItem = items.find((i) => i.examination_name.toLowerCase() === 'weight');
    const hItem = items.find((i) => i.examination_name.toLowerCase() === 'height');
    const w = wItem ? parseFloat(wItem.finding_value ?? '') : NaN;
    const h = hItem ? parseFloat(hItem.finding_value ?? '') : NaN;
    if (!w || !h) return null;
    const meters = h > 3 ? h / 100 : h;
    const bmi = w / (meters * meters);
    return Number.isFinite(bmi) ? bmi.toFixed(1) : null;
}

export default function ExaminationSection({ items, onAdd, onUpdate, onRemove }: Props) {
    const [bankOpen, setBankOpen] = useState(items.length === 0);
    const [openFindFor, setOpenFindFor] = useState<number | null>(null);

    const bmi = computeBmi(items);
    const bmiIdx = items.findIndex((i) => i.examination_name.toLowerCase() === 'bmi');
    if (bmi && bmiIdx !== -1 && items[bmiIdx].finding_value !== bmi) {
        setTimeout(() => onUpdate(bmiIdx, { finding_value: bmi }), 0);
    }

    const addedNames = new Set(items.map((i) => i.examination_name));

    function addExam(name: string) {
        if (addedNames.has(name)) return;
        onAdd({ examination_name: name, finding_value: '', note: '' });
    }

    function setFinding(i: number, v: string) {
        onUpdate(i, { finding_value: v });
        setOpenFindFor(null);
    }

    return (
        <SectionAccordion
            title="On Examination"
            titleBn="পরীক্ষায় প্রাপ্ত"
            itemCount={items.length}
            onAdd={() => setBankOpen((o) => !o)}
            addLabel={bankOpen ? 'Done' : '+ Add'}
        >
            {/* Added entries */}
            {items.map((item, i) => (
                <div key={i}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '7px 10px', background: '#f6f7f5',
                        border: '1px solid #e3e7e3', borderRadius: 8, marginTop: 8,
                    }}>
                        <span style={{ fontWeight: 600, fontSize: 13.5, color: '#2b3a32', whiteSpace: 'nowrap' }}>
                            {item.examination_name}
                        </span>
                        <span
                            onClick={() => setOpenFindFor(openFindFor === i ? null : i)}
                            style={{
                                fontSize: 12.5, color: item.finding_value ? '#6a7a72' : '#9aa8a0',
                                padding: '2px 8px', background: '#fff', borderRadius: 5,
                                border: '1px solid #e3e7e3', cursor: 'pointer',
                                fontStyle: item.finding_value ? 'normal' : 'italic',
                            }}
                        >
                            {item.finding_value || 'Set value…'}
                        </span>
                        <input
                            type="text"
                            value={item.note ?? ''}
                            onChange={(e) => onUpdate(i, { note: e.target.value })}
                            placeholder="Note…"
                            style={{
                                flex: 1, padding: '3px 8px', border: '1px solid #e3e7e3',
                                borderRadius: 5, fontSize: 12, background: '#fff',
                                outline: 'none', fontFamily: 'inherit',
                            }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = '#0a8754'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = '#e3e7e3'; }}
                        />
                        <button
                            type="button"
                            onClick={() => onRemove(i)}
                            style={{
                                color: '#9aa8a0', width: 22, height: 22,
                                borderRadius: 5, display: 'grid', placeItems: 'center',
                                border: 'none', background: 'transparent', cursor: 'pointer', flexShrink: 0,
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#fdecec'; e.currentTarget.style.color = '#b3261e'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9aa8a0'; }}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 6L18 18M6 18L18 6"/></svg>
                        </button>
                    </div>

                    {openFindFor === i && (
                        <div style={{
                            marginTop: 6, padding: 10, background: '#f0f8f3',
                            border: '1px solid rgba(10,135,84,.2)', borderRadius: 8,
                        }}>
                            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#0d6e46', marginBottom: 6 }}>Finding / Value</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {FINDING_PRESETS.map((p) => (
                                    <button key={p} type="button" onClick={() => setFinding(i, p)} style={chipStyle}>{p}</button>
                                ))}
                                <input
                                    placeholder="Custom value… e.g. 101°F"
                                    defaultValue={item.finding_value ?? ''}
                                    style={{ flex: 1, padding: '4px 8px', border: '1px solid #e3e7e3', borderRadius: 6, fontSize: 12, minWidth: 100, outline: 'none', fontFamily: 'inherit' }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = '#0a8754'; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = '#e3e7e3'; }}
                                    onKeyDown={(ev) => {
                                        if (ev.key === 'Enter') setFinding(i, ev.currentTarget.value.trim());
                                    }}
                                    onChange={(ev) => onUpdate(i, { finding_value: ev.target.value })}
                                />
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {/* Common chip bank */}
            {bankOpen && (
                <div style={{ marginTop: 10, background: '#f6f7f5', border: '1px solid #e3e7e3', borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#6a7a72', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>Quick add</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {COMMON.filter((c) => !addedNames.has(c.name)).map((c) => (
                            <button key={c.name} type="button" onClick={() => addExam(c.name)} style={chipStyle}>
                                + {c.name}
                            </button>
                        ))}
                        <input
                            placeholder="Custom examination…"
                            style={{ flex: 1, padding: '4px 8px', border: '1px solid #e3e7e3', borderRadius: 6, fontSize: 12, minWidth: 120, outline: 'none', fontFamily: 'inherit' }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = '#0a8754'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = '#e3e7e3'; }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                    addExam(e.currentTarget.value.trim());
                                    e.currentTarget.value = '';
                                }
                            }}
                        />
                    </div>
                    <button type="button" onClick={() => setBankOpen(false)} style={{ marginTop: 8, fontSize: 11, color: '#6a7a72', padding: '2px 6px', borderRadius: 4, border: 'none', background: 'transparent', cursor: 'pointer' }}>Done</button>
                </div>
            )}
        </SectionAccordion>
    );
}

const chipStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '4px 10px', borderRadius: 999, fontSize: 12.5, fontWeight: 500,
    background: '#fff', border: '1px solid #e3e7e3', color: '#2b3a32',
    whiteSpace: 'nowrap', cursor: 'pointer', lineHeight: 1.4,
    fontFamily: 'inherit',
};
