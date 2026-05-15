import Modal from '@/Components/Modal';
import { MedicineInput } from '@/hooks/usePrescriptionReducer';
import { Medicine } from '@/types';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Props {
    show: boolean;
    onClose: () => void;
    frequent: Medicine[];
    addedMedicines: MedicineInput[];
    onPickFromFrequent: (m: Medicine) => void;
    onPickFromSearch: (m: Medicine) => void;
    onEditAdded: (index: number) => void;
    onRemoveAdded: (index: number) => void;
}

export default function AddMedicineModal({
    show,
    onClose,
    frequent,
    addedMedicines,
    onPickFromFrequent,
    onPickFromSearch,
    onEditAdded,
    onRemoveAdded,
}: Props) {
    const [missingOpen, setMissingOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(false);
    const [focusIdx, setFocusIdx] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (show) {
            setTimeout(() => inputRef.current?.focus(), 50);
        } else {
            setQuery('');
            setResults([]);
        }
    }, [show]);

    useEffect(() => {
        const term = query.trim();
        if (term.length < 2) { setResults([]); return; }
        const t = setTimeout(() => {
            abortRef.current?.abort();
            const ctrl = new AbortController();
            abortRef.current = ctrl;
            setLoading(true);
            fetch(`/doctor/medicines/search?q=${encodeURIComponent(term)}&limit=8`, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
                signal: ctrl.signal,
            })
                .then((r) => r.json())
                .then((d) => { setResults(d.results ?? []); setFocusIdx(0); })
                .catch(() => {})
                .finally(() => setLoading(false));
        }, 300);
        return () => clearTimeout(t);
    }, [query]);

    function pickDrug(m: Medicine) {
        setQuery('');
        setResults([]);
        onPickFromSearch(m);
    }

    function onKey(e: React.KeyboardEvent) {
        if (results.length === 0) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx((i) => Math.min(i + 1, results.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIdx((i) => Math.max(i - 1, 0)); }
        else if (e.key === 'Enter') { e.preventDefault(); pickDrug(results[focusIdx]); }
    }

    return (
        <>
            <Modal show={show} onClose={onClose} maxWidth="2xl">
                <div style={{ fontFamily: "'Inter', system-ui, sans-serif", display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>

                    {/* Header */}
                    <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #e3e7e3', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: '#0f1a14' }}>Medicines</div>
                            <div style={{ fontSize: 12, color: '#6a7a72', marginTop: 1 }}>
                                {addedMedicines.length} added to this Rx
                            </div>
                        </div>
                    </div>

                    {/* Body: 2-pane grid */}
                    <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '240px 1fr', overflow: 'hidden' }}>

                        {/* Left — commonly used */}
                        <div style={{ borderRight: '1px solid #e3e7e3', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div style={{ padding: '10px 14px 6px', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#6a7a72' }}>
                                Commonly used
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px' }}>
                                {frequent.length === 0 ? (
                                    <div style={{ padding: '12px 8px', fontSize: 12, color: '#9aa8a0', lineHeight: 1.5 }}>
                                        No frequent medicines yet. Pick from search to start building your list.
                                    </div>
                                ) : (
                                    frequent.map((m) => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => onPickFromFrequent(m)}
                                            style={{
                                                display: 'block', width: '100%', textAlign: 'left',
                                                padding: '7px 8px', borderRadius: 7, marginBottom: 1,
                                                border: 'none', background: 'transparent', cursor: 'pointer',
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f8f3'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            <div style={{ fontWeight: 600, fontSize: 13, color: '#0f1a14' }}>{m.brand_name}</div>
                                            <div style={{ fontSize: 11.5, color: '#6a7a72', marginTop: 1 }}>
                                                {m.type}{m.strength ? `, ${m.strength}` : ''}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Right — search + added list */}
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            {/* Search area */}
                            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e3e7e3' }}>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9aa8a0', pointerEvents: 'none' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
                                    </span>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={onKey}
                                        placeholder="Type medicine name… (↑↓ navigate, Enter to pick)"
                                        style={{
                                            width: '100%', padding: '8px 12px 8px 34px',
                                            border: '1px solid #e3e7e3', borderRadius: 8,
                                            fontSize: 13.5, fontFamily: 'inherit', outline: 'none',
                                            background: '#f6f7f5', boxSizing: 'border-box',
                                        }}
                                        onFocus={(e) => { e.currentTarget.style.borderColor = '#0a8754'; e.currentTarget.style.background = '#fff'; }}
                                        onBlur={(e) => { e.currentTarget.style.borderColor = '#e3e7e3'; e.currentTarget.style.background = '#f6f7f5'; }}
                                    />
                                    {loading && (
                                        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#9aa8a0' }}>
                                            Searching…
                                        </span>
                                    )}
                                </div>

                                {/* Suggestions */}
                                {results.length > 0 && (
                                    <div style={{
                                        marginTop: 4, border: '1px solid #e3e7e3', borderRadius: 8,
                                        background: '#fff', overflow: 'hidden',
                                        boxShadow: '0 4px 12px rgba(0,0,0,.08)',
                                    }}>
                                        {results.map((m, i) => (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => pickDrug(m)}
                                                onMouseEnter={() => setFocusIdx(i)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    width: '100%', textAlign: 'left', padding: '9px 12px',
                                                    border: 'none', borderBottom: '1px solid #f0f2f0',
                                                    background: i === focusIdx ? '#f0f8f3' : '#fff',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <div>
                                                    <span style={{ fontWeight: 600, fontSize: 13.5, color: '#0f1a14' }}>{m.brand_name}</span>
                                                    {' '}
                                                    <span style={{ fontSize: 12, color: '#6a7a72' }}>
                                                        {m.type}{m.strength ? `, ${m.strength}` : ''}
                                                    </span>
                                                </div>
                                                {m.generic_name && <span style={{ fontSize: 11.5, color: '#9aa8a0', marginLeft: 8, flexShrink: 0 }}>{m.generic_name}</span>}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setMissingOpen(true)}
                                            style={{
                                                display: 'block', width: '100%', textAlign: 'left',
                                                padding: '8px 12px', border: 'none', background: '#fff',
                                                color: '#0a8754', fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f8f3'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                                        >
                                            + Medicine missing? Add "{query}"
                                        </button>
                                    </div>
                                )}

                                {!query && (
                                    <div style={{ marginTop: 6, fontSize: 11.5, color: '#9aa8a0' }}>
                                        Tip: pick from "Commonly used" on the left, or type to search the full library.
                                    </div>
                                )}
                            </div>

                            {/* Added medicines list */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 12px' }}>
                                {addedMedicines.length === 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', color: '#9aa8a0' }}>
                                        <div style={{ fontSize: 28, marginBottom: 6, opacity: 0.4, fontFamily: 'serif', fontStyle: 'italic' }}>℞</div>
                                        <div style={{ fontSize: 13, textAlign: 'center' }}>No medicines yet — pick one from the left or search above.</div>
                                    </div>
                                ) : (
                                    addedMedicines.map((m, i) => (
                                        <MedRow
                                            key={i}
                                            index={i}
                                            medicine={m}
                                            onEdit={() => onEditAdded(i)}
                                            onRemove={() => onRemoveAdded(i)}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{
                        padding: '10px 16px', borderTop: '1px solid #e3e7e3',
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6a7a72' }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: addedMedicines.length > 0 ? '#0a8754' : '#e3e7e3', display: 'inline-block' }} />
                            {addedMedicines.length > 0 ? `${addedMedicines.length} medicine${addedMedicines.length !== 1 ? 's' : ''} in Rx` : 'No medicines added'}
                        </div>
                        <div style={{ flex: 1 }} />
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 500,
                                border: '1px solid #e3e7e3', background: '#fff', color: '#2b3a32', cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f6f7f5'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                        >Done</button>
                    </div>
                </div>
            </Modal>

            <MissingMedicineModal
                show={missingOpen}
                onClose={() => setMissingOpen(false)}
                onCreated={(m) => { setMissingOpen(false); onPickFromSearch(m); }}
            />
        </>
    );
}

function MedRow({ index, medicine: m, onEdit, onRemove }: {
    index: number; medicine: MedicineInput; onEdit: () => void; onRemove: () => void;
}) {
    const abbr = abbreviate(m.medicine_type ?? '');
    const doseStr = [m.dose_morning, m.dose_noon, m.dose_afternoon, m.dose_night]
        .map((v) => v ?? 0)
        .join('+');
    const hasAnyDose = [m.dose_morning, m.dose_noon, m.dose_afternoon, m.dose_night].some((v) => v != null && v > 0);

    return (
        <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '9px 10px', borderRadius: 8, marginBottom: 2,
            background: '#f6f7f5', border: '1px solid #e3e7e3',
        }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, background: '#e6f4ec', color: '#0d6e46', fontWeight: 700, fontSize: 11, display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
                {index + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: '#0f1a14' }}>
                    {abbr ? `${abbr}. ` : ''}{m.medicine_name}
                    {m.strength && <span style={{ fontWeight: 400, fontSize: 12, color: '#6a7a72', marginLeft: 4 }}>{m.strength}</span>}
                </div>
                <div style={{ fontSize: 11.5, color: '#6a7a72', marginTop: 2, display: 'flex', flexWrap: 'wrap', gap: '2px 8px' }}>
                    {hasAnyDose && <span style={{ fontFamily: 'monospace', color: '#0a8754', fontWeight: 600 }}>{doseStr}</span>}
                    {m.timing && <span>{m.timing}</span>}
                    {m.duration_value && <span>{m.duration_value} {m.duration_unit ?? 'days'}</span>}
                    {m.custom_instruction && <span style={{ fontStyle: 'italic' }}>{m.custom_instruction}</span>}
                </div>
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button
                    type="button"
                    onClick={onEdit}
                    title="Edit dose"
                    style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e3e7e3', background: '#fff', color: '#6a7a72', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0a8754'; e.currentTarget.style.color = '#0a8754'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e3e7e3'; e.currentTarget.style.color = '#6a7a72'; }}
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
                <button
                    type="button"
                    onClick={onRemove}
                    title="Remove"
                    style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e3e7e3', background: '#fff', color: '#6a7a72', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fdecec'; e.currentTarget.style.borderColor = '#f5c6c6'; e.currentTarget.style.color = '#b3261e'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e3e7e3'; e.currentTarget.style.color = '#6a7a72'; }}
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
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

function MissingMedicineModal({ show, onClose, onCreated }: {
    show: boolean; onClose: () => void; onCreated: (m: Medicine) => void;
}) {
    const [form, setForm] = useState({ brand_name: '', generic_name: '', type: 'Tablet', strength: '', manufacturer: '' });
    const [saving, setSaving] = useState(false);

    async function submit() {
        if (!form.brand_name.trim()) { alert('Brand name required'); return; }
        setSaving(true);
        try {
            const res = await fetch('/doctor/medicines', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '',
                },
                credentials: 'same-origin',
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error('Save failed');
            const data = await res.json();
            onCreated(data.medicine);
            setForm({ brand_name: '', generic_name: '', type: 'Tablet', strength: '', manufacturer: '' });
        } catch { alert('Failed to add medicine.'); }
        finally { setSaving(false); }
    }

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '7px 10px', border: '1px solid #e3e7e3',
        borderRadius: 7, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="sm">
            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", padding: '20px' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0f1a14', marginBottom: 4 }}>Add Missing Medicine</div>
                <div style={{ fontSize: 12, color: '#b45309', background: '#fef3c7', borderRadius: 6, padding: '6px 10px', marginBottom: 14 }}>
                    Will be submitted for admin approval. You can still use it immediately.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#2b3a32' }}>
                        Brand name *
                        <input type="text" value={form.brand_name} onChange={(e) => setForm({ ...form, brand_name: e.target.value })} style={{ ...inputStyle, marginTop: 4 }} />
                    </label>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#2b3a32' }}>
                        Generic name
                        <input type="text" value={form.generic_name} onChange={(e) => setForm({ ...form, generic_name: e.target.value })} style={{ ...inputStyle, marginTop: 4 }} />
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#2b3a32' }}>
                            Type
                            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ ...inputStyle, marginTop: 4 }}>
                                {['Tablet', 'Syrup', 'Capsule', 'Injection', 'Suppository', 'Cream', 'Drops', 'Gel', 'Powder', 'Ointment', 'Inhaler'].map((t) => <option key={t}>{t}</option>)}
                            </select>
                        </label>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#2b3a32' }}>
                            Strength
                            <input type="text" value={form.strength} onChange={(e) => setForm({ ...form, strength: e.target.value })} placeholder="e.g., 500 mg" style={{ ...inputStyle, marginTop: 4 }} />
                        </label>
                    </div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#2b3a32' }}>
                        Manufacturer
                        <input type="text" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} style={{ ...inputStyle, marginTop: 4 }} />
                    </label>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                    <button type="button" onClick={onClose} style={{ padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 500, border: '1px solid #e3e7e3', background: '#fff', color: '#2b3a32', cursor: 'pointer' }}>Cancel</button>
                    <button type="button" onClick={submit} disabled={saving} style={{ padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600, border: 'none', background: saving ? '#6a7a72' : '#0a8754', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer' }}>
                        {saving ? 'Saving…' : 'Add Medicine'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
