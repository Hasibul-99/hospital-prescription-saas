import { useMemo, useState } from 'react';
import SectionAccordion from './SectionAccordion';
import { ComplaintMaster } from '@/types';
import { ComplaintInput } from '@/hooks/usePrescriptionReducer';

interface Props {
    complaints: ComplaintInput[];
    masters: ComplaintMaster[];
    durationPresets: string[];
    onAdd: (c: ComplaintInput) => void;
    onRemove: (i: number) => void;
    onUpdate: (i: number, patch: Partial<ComplaintInput>) => void;
}

export default function ComplaintsSection({ complaints, masters, durationPresets, onAdd, onRemove, onUpdate }: Props) {
    const [bankOpen, setBankOpen] = useState(complaints.length === 0);
    const [bankQuery, setBankQuery] = useState('');
    const [openDurFor, setOpenDurFor] = useState<number | null>(null);

    const addedNames = new Set(complaints.map((c) => c.complaint_name));

    const filtered = useMemo(() => {
        if (!bankQuery.trim()) return masters;
        const q = bankQuery.toLowerCase();
        return masters.filter(
            (m) => m.name_en.toLowerCase().includes(q) || (m.name_bn || '').includes(q),
        );
    }, [bankQuery, masters]);

    function addComplaint(name: string) {
        if (addedNames.has(name)) return;
        onAdd({ complaint_name: name, duration_text: '', note: '' });
    }

    function setDuration(i: number, dur: string) {
        onUpdate(i, { duration_text: dur });
        setOpenDurFor(null);
    }

    return (
        <SectionAccordion
            title="Patient Complaints"
            titleBn="রোগীর অভিযোগ"
            itemCount={complaints.length}
            onAdd={() => setBankOpen((o) => !o)}
            addLabel={bankOpen ? 'Done' : '+ Add'}
        >
            {/* Added entries */}
            {complaints.map((c, i) => (
                <div key={i}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '7px 10px', background: '#f6f7f5',
                        border: '1px solid #e3e7e3', borderRadius: 8, marginTop: 8,
                    }}>
                        <span style={{ fontWeight: 600, fontSize: 13.5, color: '#2b3a32', whiteSpace: 'nowrap' }}>
                            {c.complaint_name}
                        </span>
                        <span
                            onClick={() => setOpenDurFor(openDurFor === i ? null : i)}
                            style={{
                                fontSize: 12.5, color: c.duration_text ? '#6a7a72' : '#9aa8a0',
                                padding: '2px 8px', background: '#fff', borderRadius: 5,
                                border: '1px solid #e3e7e3', cursor: 'pointer',
                                fontStyle: c.duration_text ? 'normal' : 'italic',
                            }}
                        >
                            {c.duration_text || 'Set duration…'}
                        </span>
                        <button
                            type="button"
                            onClick={() => onRemove(i)}
                            style={{
                                marginLeft: 'auto', color: '#9aa8a0', width: 22, height: 22,
                                borderRadius: 5, display: 'grid', placeItems: 'center', border: 'none',
                                background: 'transparent', cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#fdecec'; e.currentTarget.style.color = '#b3261e'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9aa8a0'; }}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 6L18 18M6 18L18 6"/></svg>
                        </button>
                    </div>

                    {/* Inline duration picker */}
                    {openDurFor === i && (
                        <div style={{
                            marginTop: 6, padding: 10, background: '#f0f8f3',
                            border: '1px solid rgba(10,135,84,.2)', borderRadius: 8,
                        }}>
                            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#0d6e46', marginBottom: 6 }}>Duration</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {durationPresets.map((d) => (
                                    <button key={d} type="button" onClick={() => setDuration(i, d)} style={chipStyle}>
                                        {d}
                                    </button>
                                ))}
                                <input
                                    placeholder="Custom…"
                                    style={{ flex: 1, padding: '4px 8px', border: '1px solid #e3e7e3', borderRadius: 6, fontSize: 12, minWidth: 100, outline: 'none', fontFamily: 'inherit' }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                            setDuration(i, e.currentTarget.value.trim());
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {/* Chip bank */}
            {bankOpen && (
                <div style={{
                    marginTop: 10, background: '#f6f7f5',
                    border: '1px solid #e3e7e3', borderRadius: 8, padding: 10,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#9aa8a0' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
                            </span>
                            <input
                                value={bankQuery}
                                onChange={(e) => setBankQuery(e.target.value)}
                                placeholder="Search complaints… e.g. fever, cough"
                                style={{
                                    width: '100%', padding: '6px 10px 6px 28px',
                                    border: '1px solid #e3e7e3', background: '#fff',
                                    borderRadius: 6, fontSize: 12.5, outline: 'none', fontFamily: 'inherit',
                                }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = '#0a8754'; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = '#e3e7e3'; }}
                            />
                        </div>
                        <button type="button" onClick={() => setBankOpen(false)} style={{ fontSize: 11, color: '#6a7a72', padding: '4px 8px', borderRadius: 5, border: 'none', background: 'transparent', cursor: 'pointer' }}>
                            Done
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
                        {filtered.map((m) => {
                            const added = addedNames.has(m.name_en);
                            return (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => addComplaint(m.name_en)}
                                    style={{
                                        ...chipStyle,
                                        background: added ? '#e6f4ec' : '#fff',
                                        borderColor: added ? 'rgba(10,135,84,.3)' : '#e3e7e3',
                                        color: added ? '#0d6e46' : '#2b3a32',
                                        fontWeight: added ? 600 : 500,
                                    }}
                                >
                                    {added && <span style={{ fontSize: 10, marginRight: 2 }}>✓</span>}
                                    {m.name_en}
                                    {m.name_bn && <span style={{ opacity: 0.6, marginLeft: 4, fontFamily: "'Noto Sans Bengali', sans-serif" }}>· {m.name_bn}</span>}
                                </button>
                            );
                        })}
                        {bankQuery.trim() && !filtered.some((m) => m.name_en.toLowerCase() === bankQuery.toLowerCase()) && (
                            <button
                                type="button"
                                onClick={() => addComplaint(bankQuery.trim())}
                                style={{ ...chipStyle, borderStyle: 'dashed', color: '#0d6e46' }}
                            >
                                + Add "{bankQuery.trim()}"
                            </button>
                        )}
                    </div>
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
