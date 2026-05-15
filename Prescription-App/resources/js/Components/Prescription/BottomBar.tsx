import { useState } from 'react';

interface Props {
    saving: boolean;
    dirty: boolean;
    lastSavedAt: string | null;
    onSave: () => void;
    onSavePrint: () => void;
    onSaveTemplate?: (name: string) => void;
    onNewRx?: () => void;
    onPreview?: () => void;
}

export default function BottomBar({ saving, dirty, lastSavedAt, onSave, onSavePrint, onSaveTemplate, onNewRx, onPreview }: Props) {
    const [tplName, setTplName] = useState('');
    const [moreOpen, setMoreOpen] = useState(false);

    function handleSaveTemplate() {
        if (!tplName.trim()) { return; }
        onSaveTemplate?.(tplName.trim());
        setTplName('');
    }

    const dotColor = saving ? '#f59e0b' : dirty ? '#f59e0b' : '#0a8754';
    const statusText = saving ? 'Saving…' : dirty ? 'Unsaved changes' : lastSavedAt ? `Saved ${lastSavedAt}` : 'All changes saved';

    return (
        <div style={{
            height: 56, background: '#fff', borderTop: '1px solid #e3e7e3',
            display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10,
            fontFamily: "'Inter', system-ui, sans-serif",
        }}>
            {/* Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: dirty ? '#92400e' : '#6a7a72', flexShrink: 0 }}>
                <span style={{
                    width: 8, height: 8, borderRadius: '50%', background: dotColor,
                    display: 'inline-block', flexShrink: 0,
                    boxShadow: dirty ? '0 0 0 2px rgba(245,158,11,.25)' : 'none',
                }} />
                {statusText}
            </div>

            <div style={{ flex: 1 }} />

            {/* Template save */}
            {onSaveTemplate && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                        value={tplName}
                        onChange={(e) => setTplName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTemplate(); }}
                        placeholder="Save as template…"
                        style={{
                            padding: '5px 10px', border: '1px solid #e3e7e3', borderRadius: 7,
                            fontSize: 12.5, fontFamily: 'inherit', outline: 'none',
                            background: '#f6f7f5', color: '#0f1a14', width: 180,
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#0a8754'; e.currentTarget.style.background = '#fff'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = '#e3e7e3'; e.currentTarget.style.background = '#f6f7f5'; }}
                    />
                    <GhostBtn onClick={handleSaveTemplate} disabled={!tplName.trim()}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                        Save template
                    </GhostBtn>
                </div>
            )}

            {onNewRx && <GhostBtn onClick={onNewRx}>New Rx</GhostBtn>}

            {onPreview && (
                <GhostBtn onClick={onPreview}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                    Preview
                </GhostBtn>
            )}

            {/* Split button: Sign & print + dropdown */}
            <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid #0a8754', position: 'relative' }}>
                <button
                    type="button"
                    onClick={onSavePrint}
                    disabled={saving}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', background: '#0a8754', color: '#fff',
                        border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                        fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                        opacity: saving ? 0.65 : 1,
                    }}
                    onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = '#0d6e46'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#0a8754'; }}
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="20 6 9 17 4 12"/></svg>
                    Sign &amp; print
                </button>
                <button
                    type="button"
                    onClick={() => setMoreOpen((o) => !o)}
                    style={{
                        padding: '7px 8px', background: '#0a8754', color: '#fff',
                        border: 'none', borderLeft: '1px solid rgba(255,255,255,.25)',
                        cursor: 'pointer', display: 'grid', placeItems: 'center',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#0d6e46'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#0a8754'; }}
                >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {moreOpen && (
                    <div style={{
                        position: 'absolute', bottom: '110%', right: 0,
                        background: '#fff', border: '1px solid #e3e7e3', borderRadius: 8,
                        boxShadow: '0 4px 12px rgba(0,0,0,.12)', minWidth: 160, overflow: 'hidden', zIndex: 50,
                    }}>
                        <button
                            type="button"
                            onClick={() => { onSave(); setMoreOpen(false); }}
                            style={dropdownItem}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f8f3'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                        >Save as draft</button>
                        <button
                            type="button"
                            onClick={() => { window.print(); setMoreOpen(false); }}
                            style={dropdownItem}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f8f3'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                        >Print only</button>
                    </div>
                )}
            </div>
        </div>
    );
}

function GhostBtn({ onClick, children, disabled }: {
    onClick: () => void; children: React.ReactNode; disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 7, fontSize: 12.5, fontWeight: 500,
                border: '1px solid #e3e7e3', background: '#fff', color: '#2b3a32',
                cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                opacity: disabled ? 0.5 : 1,
            }}
            onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = '#f6f7f5'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
        >
            {children}
        </button>
    );
}

const dropdownItem: React.CSSProperties = {
    display: 'block', width: '100%', textAlign: 'left',
    padding: '9px 14px', border: 'none', background: '#fff',
    fontSize: 13, color: '#2b3a32', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif",
};
