import { PropsWithChildren, useState } from 'react';

interface Props {
    title: string;
    titleBn?: string;
    onAdd?: () => void;
    itemCount?: number;
    defaultOpen?: boolean;
    addLabel?: string;
}

export default function SectionAccordion({
    title,
    titleBn,
    onAdd,
    itemCount,
    defaultOpen = true,
    addLabel = '+ Add',
    children,
}: PropsWithChildren<Props>) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div style={{
            background: '#fff',
            border: '1px solid #e3e7e3',
            borderRadius: 10,
            marginBottom: 10,
            overflow: 'hidden',
        }}>
            {/* Header */}
            <div
                style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', cursor: 'pointer', userSelect: 'none',
                }}
                onClick={() => setOpen((o) => !o)}
            >
                <div style={{ fontWeight: 600, fontSize: 13.5, color: '#0f1a14', display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                    {title}
                    {titleBn && <span style={{ color: '#6a7a72', fontWeight: 500, fontSize: 12, fontFamily: "'Noto Sans Bengali', 'Inter', sans-serif" }}>{titleBn}</span>}
                </div>

                {typeof itemCount === 'number' && itemCount > 0 && (
                    <span style={{
                        background: '#e6f4ec', color: '#0d6e46',
                        fontSize: 11, padding: '1px 7px', borderRadius: 999, fontWeight: 600,
                    }}>{itemCount}</span>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9aa8a0', marginLeft: 'auto' }}>
                    {onAdd && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onAdd(); }}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                                color: '#0d6e46', background: 'transparent',
                                border: '1px dashed rgba(10,135,84,.35)', cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f8f3'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >{addLabel}</button>
                    )}
                    <svg
                        width="10" height="10" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5"
                        style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}
                    ><polyline points="6 9 12 15 18 9"/></svg>
                </div>
            </div>

            {/* Body */}
            {open && (
                <div style={{ padding: '0 14px 14px', borderTop: '1px solid #e3e7e3' }}>
                    {children}
                </div>
            )}
        </div>
    );
}
