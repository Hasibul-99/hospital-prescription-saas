import { DoctorTemplate } from '@/types';
import { useMemo, useState } from 'react';

interface Props {
    templates: DoctorTemplate[];
    activeId?: number | null;
    onSelect: (tpl: DoctorTemplate) => void;
    onNewRx?: () => void;
}

export default function TemplateSidebar({ templates, activeId, onSelect, onNewRx }: Props) {
    const [q, setQ] = useState('');
    const [loading, setLoading] = useState<number | null>(null);

    const filtered = useMemo(() => {
        const query = q.toLowerCase().trim();
        return query ? templates.filter((t) => t.disease_name.toLowerCase().includes(query)) : templates;
    }, [templates, q]);

    const mine = filtered.filter((t) => !t.is_global);
    const global = filtered.filter((t) => t.is_global);

    async function load(tpl: DoctorTemplate) {
        setLoading(tpl.id);
        try {
            const res = await fetch(`/doctor/templates/${tpl.id}`, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error('Failed');
            const full = await res.json();
            onSelect(full);
        } finally {
            setLoading(null);
        }
    }

    return (
        <aside style={{
            background: '#fff',
            borderRight: '1px solid #e3e7e3',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 0,
        }}>
            {/* Head */}
            <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #e3e7e3' }}>
                <div style={{
                    fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: '#6a7a72',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 8,
                }}>
                    <span>Saved templates</span>
                    <span style={{ color: '#9aa8a0', fontWeight: 500 }}>{filtered.length}</span>
                </div>
                {/* Search */}
                <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9aa8a0', pointerEvents: 'none' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
                    </span>
                    <input
                        type="text"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search templates…"
                        style={{
                            width: '100%', padding: '7px 10px 7px 30px',
                            border: '1px solid #e3e7e3', background: '#f6f7f5',
                            borderRadius: 7, fontSize: 13, outline: 'none',
                            fontFamily: 'inherit',
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#0a8754'; e.currentTarget.style.background = '#fff'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = '#e3e7e3'; e.currentTarget.style.background = '#f6f7f5'; }}
                    />
                </div>
            </div>

            {/* Template list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px 12px' }}>
                {mine.length > 0 && (
                    <>
                        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6a7a72', padding: '8px 6px 4px' }}>My Templates</div>
                        {mine.map((t) => <TplItem key={t.id} tpl={t} active={activeId === t.id} loading={loading === t.id} onSelect={load} />)}
                    </>
                )}
                {global.length > 0 && (
                    <>
                        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6a7a72', padding: '8px 6px 4px' }}>Global Templates</div>
                        {global.map((t) => <TplItem key={t.id} tpl={t} active={activeId === t.id} loading={loading === t.id} onSelect={load} />)}
                    </>
                )}
                {filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px 12px', color: '#6a7a72', fontSize: 13 }}>
                        <div style={{ fontSize: 22, marginBottom: 4, opacity: 0.5 }}>⌕</div>
                        No templates match "{q}"
                    </div>
                )}
            </div>

            {/* Footer: New blank Rx */}
            <div style={{ borderTop: '1px solid #e3e7e3', padding: '10px 12px' }}>
                <button
                    type="button"
                    onClick={onNewRx}
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 6, padding: '8px 10px', borderRadius: 8,
                        background: '#f0f8f3', color: '#0d6e46', fontWeight: 600, fontSize: 13,
                        border: '1px dashed rgba(10,135,84,.35)', cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#e6f4ec'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f0f8f3'; }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    New blank Rx
                </button>
            </div>
        </aside>
    );
}

function TplItem({ tpl, active, loading, onSelect }: {
    tpl: DoctorTemplate; active: boolean; loading: boolean; onSelect: (t: DoctorTemplate) => void;
}) {
    const [hover, setHover] = useState(false);
    return (
        <button
            type="button"
            onClick={() => onSelect(tpl)}
            disabled={loading}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 10px', borderRadius: 8, marginBottom: 1,
                position: 'relative', cursor: loading ? 'wait' : 'pointer',
                background: active ? '#e6f4ec' : hover ? '#f6f7f5' : 'transparent',
                opacity: loading ? 0.5 : 1, border: 'none',
                transition: 'background .12s',
            }}
        >
            <div style={{ fontWeight: 600, fontSize: 13.5, color: '#0f1a14', display: 'flex', alignItems: 'center', gap: 6 }}>
                {tpl.is_global && <span style={{ color: '#0a8754' }}>★</span>}
                {tpl.disease_name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#6a7a72', marginTop: 2 }}>
                <span>Updated {new Date(tpl.updated_at).toLocaleDateString('en-GB')}</span>
                {loading && <span style={{ color: '#0a8754' }}>Loading…</span>}
            </div>
        </button>
    );
}
