import Modal from '@/Components/Modal';
import { MedicineInput } from '@/hooks/usePrescriptionReducer';
import { TIMING_OPTIONS } from '@/utils/timingLabel';
import { useEffect, useState } from 'react';

interface Props {
    show: boolean;
    onClose: () => void;
    medicine: MedicineInput | null;
    onSave: (patch: MedicineInput, saveAsDefault: boolean) => void;
    instructionPresets: string[];
    dayPresets: number[];
}

const SLOTS = [
    { key: 'dose_morning' as const,   label: 'Morning',  bn: 'সকাল'  },
    { key: 'dose_noon' as const,      label: 'Noon',     bn: 'দুপুর'  },
    { key: 'dose_afternoon' as const, label: 'Evening',  bn: 'বিকাল'  },
    { key: 'dose_night' as const,     label: 'Night',    bn: 'রাত'    },
];


const QUICK_NOTES = [
    { en: 'If fever ≥ 100°F',            bn: 'জ্বর ১০০°F বা তার বেশি হলে' },
    { en: 'If pain persists',             bn: 'ব্যথা থাকলে'                  },
    { en: 'Stop after symptoms resolve',  bn: ''                              },
    { en: 'Take only if needed',          bn: ''                              },
];

const TAKE_FOR_PRESETS = [1, 3, 5, 7, 10, 14, 30];

export default function DoseConfigModal({ show, onClose, medicine, onSave, dayPresets }: Props) {
    const [form, setForm] = useState<MedicineInput | null>(medicine);
    const [saveAsDefault, setSaveAsDefault] = useState(false);

    useEffect(() => {
        setForm(medicine);
        setSaveAsDefault(false);
    }, [medicine]);

    if (!form) return null;

    function getSlot(key: typeof SLOTS[number]['key']): number {
        return (form as any)[key] ?? 0;
    }

    function toggleSlot(key: typeof SLOTS[number]['key']) {
        const cur = getSlot(key);
        setForm((f) => f ? { ...f, [key]: cur > 0 ? null : 1 } : f);
    }

    function setSlotQty(key: typeof SLOTS[number]['key'], delta: number) {
        const next = Math.max(0, (getSlot(key) || 0) + delta);
        setForm((f) => f ? { ...f, [key]: next === 0 ? null : next } : f);
    }

    function setSlotRaw(key: typeof SLOTS[number]['key'], val: string) {
        const n = val === '' ? null : parseFloat(val);
        setForm((f) => f ? { ...f, [key]: (n === null || isNaN(n)) ? null : n } : f);
    }

    const dosePattern = SLOTS.map((s) => getSlot(s.key) || 0).join('+');
    const anyActive = SLOTS.some((s) => (form as any)[s.key] != null && (form as any)[s.key] > 0);

    const header = [
        form.medicine_type ? abbreviate(form.medicine_type) + '.' : '',
        form.medicine_name,
        form.strength ?? '',
    ].filter(Boolean).join(' ');

    function commit() {
        if (!form) return;
        onSave(form, saveAsDefault);
    }

    const allPresets = [...new Set([...TAKE_FOR_PRESETS, ...(dayPresets ?? [])])].sort((a, b) => a - b);

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", maxHeight: '85vh', overflowY: 'auto' }}>

                {/* Header */}
                <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #e3e7e3' }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#0f1a14' }}>{header}</div>
                    <div style={{ fontSize: 12, color: '#6a7a72', marginTop: 2 }}>Configure dose schedule</div>
                </div>

                <div style={{ padding: '16px 20px 20px' }}>

                    {/* Dose schedule section */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={sectionLabel}>
                            Dosing schedule
                            <span style={{ color: '#9aa8a0', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 11.5 }}>
                                {' '}— tap slot to toggle, use +/− to set quantity
                            </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                            {SLOTS.map((s) => {
                                const qty = getSlot(s.key);
                                const active = qty != null && (form as any)[s.key] != null;
                                return (
                                    <div
                                        key={s.key}
                                        onClick={() => toggleSlot(s.key)}
                                        style={{
                                            borderRadius: 10, padding: '10px 8px',
                                            border: `1px solid ${active ? 'rgba(10,135,84,.4)' : '#e3e7e3'}`,
                                            background: active ? 'rgba(10,135,84,.06)' : '#f6f7f5',
                                            cursor: 'pointer', userSelect: 'none',
                                            transition: 'all .12s',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <div style={{ fontSize: 11, fontWeight: 600, color: active ? '#0a8754' : '#6a7a72' }}>
                                                {s.label}
                                            </div>
                                            <div style={{
                                                width: 16, height: 16, borderRadius: 4,
                                                border: `1.5px solid ${active ? '#0a8754' : '#c8d0c8'}`,
                                                background: active ? '#0a8754' : 'transparent',
                                                display: 'grid', placeItems: 'center', flexShrink: 0,
                                            }}>
                                                {active && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 11, color: '#9aa8a0', fontFamily: "'Noto Sans Bengali', sans-serif", marginBottom: 10 }}>
                                            {s.bn}
                                        </div>
                                        {/* qty row — stop propagation so click doesn't toggle */}
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setSlotQty(s.key, -1)}
                                                disabled={!active || qty <= 0}
                                                style={qtyBtn(active)}
                                            >−</button>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.5"
                                                value={active ? (qty ?? 0) : 0}
                                                onChange={(e) => setSlotRaw(s.key, e.target.value)}
                                                onClick={() => { if (!active) toggleSlot(s.key); }}
                                                style={{
                                                    flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 600,
                                                    border: `1px solid ${active ? 'rgba(10,135,84,.3)' : '#e3e7e3'}`,
                                                    borderRadius: 5, padding: '3px 0',
                                                    background: active ? '#fff' : '#eff0ee',
                                                    color: active ? '#0f1a14' : '#9aa8a0',
                                                    outline: 'none',
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => { if (!active) toggleSlot(s.key); setSlotQty(s.key, 1); }}
                                                style={qtyBtn(true)}
                                            >+</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {anyActive && (
                            <div style={{ marginTop: 8, fontSize: 12, color: '#6a7a72' }}>
                                Pattern:{' '}
                                <span style={{ fontFamily: 'monospace', color: '#0a8754', fontWeight: 700 }}>{dosePattern}</span>
                            </div>
                        )}
                    </div>

                    {/* Two-column: Instruction + Take for */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                        {/* Instruction */}
                        <div>
                            <div style={sectionLabel}>Instruction</div>
                            <select
                                value={form.timing ?? ''}
                                onChange={(e) => setForm({ ...form, timing: e.target.value || null })}
                                style={selectStyle}
                            >
                                <option value="">— None —</option>
                                {TIMING_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value ?? ''}>{o.en}{o.bn ? ` — ${o.bn}` : ''}</option>
                                ))}
                            </select>
                        </div>

                        {/* Take for */}
                        <div>
                            <div style={sectionLabel}>Take for</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                                {allPresets.map((n) => {
                                    const active = form.duration_value === n && form.duration_unit === 'days';
                                    return (
                                        <button
                                            key={n}
                                            type="button"
                                            onClick={() => setForm({ ...form, duration_value: n, duration_unit: 'days' })}
                                            style={{
                                                padding: '3px 8px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                                                border: `1px solid ${active ? '#0a8754' : '#e3e7e3'}`,
                                                background: active ? '#0a8754' : '#fff',
                                                color: active ? '#fff' : '#2b3a32',
                                                cursor: 'pointer',
                                            }}
                                        >{n}</button>
                                    );
                                })}
                                <input
                                    type="number"
                                    min="1"
                                    value={form.duration_value ?? ''}
                                    onChange={(e) => setForm({
                                        ...form,
                                        duration_value: e.target.value === '' ? null : Number(e.target.value),
                                        duration_unit: form.duration_unit ?? 'days',
                                    })}
                                    placeholder="#"
                                    style={{ width: 48, padding: '3px 6px', border: '1px solid #e3e7e3', borderRadius: 6, fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = '#0a8754'; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = '#e3e7e3'; }}
                                />
                                {/* Unit toggle */}
                                <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid #e3e7e3' }}>
                                    {(['days', 'months', 'years', 'N/A'] as const).map((u) => {
                                        const active = (form.duration_unit ?? 'days') === u;
                                        return (
                                            <button
                                                key={u}
                                                type="button"
                                                onClick={() => setForm({ ...form, duration_unit: u })}
                                                style={{
                                                    padding: '3px 7px', fontSize: 11, fontWeight: 500,
                                                    border: 'none',
                                                    background: active ? '#0a8754' : '#fff',
                                                    color: active ? '#fff' : '#6a7a72',
                                                    cursor: 'pointer',
                                                    borderRight: u !== 'N/A' ? '1px solid #e3e7e3' : 'none',
                                                }}
                                            >{u}</button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Custom note */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={sectionLabel}>Custom note / Bengali instruction</div>
                        <textarea
                            value={form.custom_instruction ?? ''}
                            onChange={(e) => setForm({ ...form, custom_instruction: e.target.value })}
                            placeholder="e.g. জ্বর ১০০°F বা তার বেশি হলে খাবেন"
                            rows={2}
                            style={{
                                width: '100%', padding: '8px 10px', border: '1px solid #e3e7e3', borderRadius: 7,
                                fontSize: 13, fontFamily: "'Noto Sans Bengali', 'Inter', sans-serif",
                                outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                            }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = '#0a8754'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = '#e3e7e3'; }}
                        />
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                            {QUICK_NOTES.map((n) => (
                                <button
                                    key={n.en}
                                    type="button"
                                    onClick={() => setForm({ ...form, custom_instruction: n.bn || n.en })}
                                    style={{
                                        padding: '3px 10px', borderRadius: 999, fontSize: 12,
                                        border: '1px solid #e3e7e3', background: '#fff', color: '#2b3a32',
                                        cursor: 'pointer', fontFamily: "'Noto Sans Bengali', 'Inter', sans-serif",
                                    }}
                                >
                                    {n.bn || n.en}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Save as default */}
                    {form.medicine_id && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#2b3a32', cursor: 'pointer', marginBottom: 16 }}>
                            <input
                                type="checkbox"
                                checked={saveAsDefault}
                                onChange={(e) => setSaveAsDefault(e.target.checked)}
                                style={{ accentColor: '#0a8754' }}
                            />
                            Save as default dose for {form.medicine_name}
                        </label>
                    )}

                    {/* Footer buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 500,
                                border: '1px solid #e3e7e3', background: '#fff', color: '#2b3a32', cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f6f7f5'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                        >Cancel</button>
                        <button
                            type="button"
                            onClick={commit}
                            style={{
                                padding: '7px 20px', borderRadius: 7, fontSize: 13, fontWeight: 600,
                                border: 'none', background: '#0a8754', color: '#fff', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#0d6e46'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#0a8754'; }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            {form.medicine_id ? 'Update' : 'Add to Rx'}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

const sectionLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
    textTransform: 'uppercase', color: '#0d6e46', marginBottom: 8,
};

const selectStyle: React.CSSProperties = {
    width: '100%', padding: '7px 10px', border: '1px solid #e3e7e3',
    borderRadius: 7, fontSize: 13, fontFamily: 'inherit', outline: 'none',
    background: '#fff', color: '#0f1a14',
};

function qtyBtn(active: boolean): React.CSSProperties {
    return {
        width: 22, height: 22, borderRadius: 5, border: `1px solid ${active ? 'rgba(10,135,84,.3)' : '#e3e7e3'}`,
        background: active ? '#fff' : '#eff0ee', color: active ? '#0a8754' : '#9aa8a0',
        fontSize: 14, fontWeight: 600, cursor: active ? 'pointer' : 'not-allowed',
        display: 'grid', placeItems: 'center', flexShrink: 0,
    };
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
