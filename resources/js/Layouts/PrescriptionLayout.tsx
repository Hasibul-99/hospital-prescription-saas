import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import { PageProps } from '@/types';

export default function PrescriptionLayout({ children }: PropsWithChildren) {
    const { auth } = usePage<PageProps>().props;
    const initials = auth.user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <div style={{ height: '100vh', overflow: 'hidden', display: 'grid', gridTemplateRows: '56px 1fr', background: '#f6f7f5' }}>
            {/* ── Top bar ── */}
            <header style={{
                display: 'flex', alignItems: 'center', padding: '0 18px',
                background: '#fff', borderBottom: '1px solid #e3e7e3', gap: 24,
            }}>
                {/* Brand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>
                    <div style={{
                        width: 28, height: 28, borderRadius: 7,
                        background: 'linear-gradient(135deg,#0a8754,#0d6e46)',
                        color: 'white', display: 'grid', placeItems: 'center',
                        fontWeight: 700, fontSize: 16, fontFamily: 'serif', fontStyle: 'italic',
                        boxShadow: '0 2px 6px rgba(10,135,84,.3)',
                    }}>℞</div>
                    <span style={{ color: '#0f1a14' }}>Pulse Rx</span>
                    <span style={{ fontSize: 11, color: '#6a7a72', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', marginLeft: 2 }}>Composer</span>
                </div>

                {/* Back */}
                <Link
                    href="/doctor/queue"
                    style={{ padding: '6px 12px', borderRadius: 7, color: '#2b3a32', textDecoration: 'none', fontWeight: 500, fontSize: 13 }}
                >
                    ← Queue
                </Link>

                {/* Right */}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6a7a72' }}>
                        <KbdHint k="⌘K" label="Add medicine" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6a7a72' }}>
                        <KbdHint k="⌘P" label="Print" />
                    </div>
                    <div style={{ width: 1, height: 20, background: '#e3e7e3' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                            width: 30, height: 30, borderRadius: '50%',
                            background: 'linear-gradient(135deg,#2b3a32,#4a5b51)',
                            color: 'white', display: 'grid', placeItems: 'center',
                            fontWeight: 600, fontSize: 12, flexShrink: 0,
                        }}>{initials}</div>
                        <div style={{ fontSize: 12.5, lineHeight: 1.2 }}>
                            <div style={{ fontWeight: 600, color: '#0f1a14' }}>Dr. {auth.user.name}</div>
                            <div style={{ color: '#6a7a72', fontSize: 11 }}>Doctor</div>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Page content (fills remaining height) ── */}
            <div style={{ overflow: 'hidden', minHeight: 0 }}>
                {children}
            </div>
        </div>
    );
}

function KbdHint({ k, label }: { k: string; label: string }) {
    return (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
                background: '#eef0ec', border: '1px solid #e3e7e3', borderBottomWidth: 2,
                padding: '1px 6px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace',
                color: '#2b3a32', lineHeight: 1.6,
            }}>{k}</span>
            <span style={{ color: '#6a7a72', fontSize: 12 }}>{label}</span>
        </span>
    );
}
