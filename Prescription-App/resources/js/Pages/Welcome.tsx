import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState } from 'react';

// ─── Tiny icon helper ─────────────────────────────────────────────
const Ico = ({ size = 18, children }: { size?: number; children: React.ReactNode }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        {children}
    </svg>
);

const Icons = {
    check:    () => <Ico><path d="m5 12 4 4L19 6" /></Ico>,
    checkSm:  (s=14) => <Ico size={s}><path d="m5 12 4 4L19 6" /></Ico>,
    arrow:    (s=16) => <Ico size={s}><path d="M5 12h14M13 6l6 6-6 6" /></Ico>,
    zap:      () => <Ico><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" /></Ico>,
    brain:    () => <Ico><path d="M12 5a3 3 0 1 0-5.997.142 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.142 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/></Ico>,
    pill:     () => <Ico><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7" /></Ico>,
    send:     () => <Ico><path d="m22 2-11 11"/><path d="M22 2 15 22l-4-9-9-4Z" /></Ico>,
    refresh:  () => <Ico><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5" /></Ico>,
    plug:     () => <Ico><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8H6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2Z" /></Ico>,
    warn:     (s=16) => <Ico size={s}><path d="M12 3 2 21h20Z"/><path d="M12 10v5M12 18v.5" /></Ico>,
    shield:   (s=14) => <Ico size={s}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z" /></Ico>,
    quote:    (s=48) => <Ico size={s}><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" /></Ico>,
    star:     () => <Ico><path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8l-5.8 3.1 1.1-6.5L2.6 9.8l6.5-.9Z" fill="currentColor" stroke="none" /></Ico>,
    twitter:  () => <Ico><path d="M4 4l16 16M20 4 4 20" /><path d="M4 4h6l10 16H14L4 4Z" /></Ico>,
    linkedin: () => <Ico><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2" /></Ico>,
    rx:       (s=18) => <Ico size={s}><path d="M5 4h6a3 3 0 0 1 0 6H5M5 4v16M5 10h4l6 10M13 14l6 6" /></Ico>,
    activity: () => <Ico><path d="M3 12h4l3-9 4 18 3-9h4" /></Ico>,
};

// ─── Shared styles ────────────────────────────────────────────────
const S = {
    container: { maxWidth: 1240, margin: '0 auto', padding: '0 32px' },
    btnPrimary: {
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '13px 24px', borderRadius: 11, fontSize: 14.5, fontWeight: 600,
        background: '#0f766e', color: 'white', border: 'none', cursor: 'pointer',
        boxShadow: '0 1px 0 rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.14), 0 8px 24px -10px rgba(15,118,110,.5)',
        textDecoration: 'none',
    },
    btnSecondary: {
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '12px 22px', borderRadius: 11, fontSize: 14.5, fontWeight: 600,
        background: 'white', color: '#0f172a', border: '1px solid #e3e7ee', cursor: 'pointer',
        textDecoration: 'none',
    },
    btnGhost: {
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '7px 13px', borderRadius: 8, fontSize: 13.5, fontWeight: 600,
        color: '#475569', background: 'none', border: 'none', cursor: 'pointer',
        textDecoration: 'none',
    },
    card: {
        background: '#fff', border: '1px solid #eef0f4', borderRadius: 14,
        boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 6px 16px -8px rgba(15,23,42,.10)',
        padding: 24,
    },
    pill: (bg: string, c: string) => ({
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
        background: bg, color: c,
    }) as React.CSSProperties,
};

// ─── Mini product preview ─────────────────────────────────────────
function ProductPreview() {
    return (
        <div style={{
            background: 'white', border: '1px solid #eef0f4', borderRadius: 16,
            boxShadow: '0 30px 60px -20px rgba(15,23,42,.25)',
            overflow: 'hidden',
            transform: 'perspective(1800px) rotateY(-6deg) rotateX(3deg) rotateZ(0.2deg)',
            transformOrigin: 'center',
        }}>
            {/* Chrome bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: '#f7f8fa', borderBottom: '1px solid #eef0f4' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
                <span style={{ marginLeft: 10, padding: '3px 10px', background: 'white', border: '1px solid #eef0f4', borderRadius: 6, fontSize: 11, color: '#94a3b8', fontFamily: 'ui-monospace, monospace' }}>
                    app.pulserx.io/doctor/dashboard
                </span>
            </div>

            {/* App body */}
            <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr', minHeight: 420 }}>
                {/* Mini sidebar */}
                <div style={{ background: 'white', borderRight: '1px solid #eef0f4', padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #0f766e, #115e59)', display: 'grid', placeItems: 'center', marginBottom: 8 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 4h6.5a3.5 3.5 0 0 1 0 7H5M5 4v16M5 11h4l7 9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    {[
                        <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
                        <><circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0"/></>,
                        <><path d="M5 4h6a3 3 0 0 1 0 6H5M5 4v16M5 10h4l6 10"/></>,
                    ].map((d, i) => (
                        <div key={i} style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', background: i === 0 ? '#f0fdfa' : 'transparent', color: i === 0 ? '#0f766e' : '#94a3b8' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
                        </div>
                    ))}
                </div>

                {/* Dashboard content */}
                <div style={{ padding: 14, background: '#f7f8fa', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>Dashboard</div>
                            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>Daily overview</div>
                        </div>
                        <div style={{ padding: '5px 10px', background: '#0f766e', color: 'white', borderRadius: 7, fontSize: 11, fontWeight: 600, display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                            New Rx
                        </div>
                    </div>

                    {/* Stat cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
                        {[
                            { l: 'Active Rx', v: '1,284', tone: '#f0fdfa', c: '#0f766e' },
                            { l: 'Today', v: '47', tone: '#f5f3ff', c: '#6d28d9' },
                            { l: 'Drafts', v: '23', tone: '#fef3c7', c: '#b45309' },
                            { l: 'Patients', v: '892', tone: '#ffe4e6', c: '#be123c' },
                        ].map(({ l, v, tone, c }) => (
                            <div key={l} style={{ padding: '8px 10px', background: 'white', border: '1px solid #eef0f4', borderRadius: 10 }}>
                                <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>{l}</div>
                                <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.015em', marginTop: 3 }}>{v}</div>
                                <div style={{ marginTop: 4, display: 'inline-block', padding: '1px 6px', borderRadius: 999, background: tone, color: c, fontSize: 9, fontWeight: 600 }}>+8.2%</div>
                            </div>
                        ))}
                    </div>

                    {/* Mini chart */}
                    <div style={{ background: 'white', border: '1px solid #eef0f4', borderRadius: 10, padding: '10px 12px' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Prescribing volume · last 14 days</div>
                        <MiniChart />
                    </div>

                    {/* Mini Rx table */}
                    <div style={{ background: 'white', border: '1px solid #eef0f4', borderRadius: 10, overflow: 'hidden' }}>
                        <div style={{ padding: '8px 12px', borderBottom: '1px solid #eef0f4', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                            Recent prescriptions
                        </div>
                        {[
                            { p: 'Amelia H.', m: 'Metformin 500mg', s: 'Signed', sc: '#ecfdf5', cc: '#047857' },
                            { p: 'Marcus O.', m: 'Atorvastatin 20mg', s: 'Active', sc: '#ecfdf5', cc: '#047857' },
                            { p: 'Priya R.', m: 'Albuterol HFA', s: 'Draft', sc: '#fef3c7', cc: '#b45309' },
                        ].map(({ p, m, s, sc, cc }) => (
                            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderBottom: '1px solid #eef0f4', fontSize: 11 }}>
                                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #0f766e)', color: 'white', display: 'grid', placeItems: 'center', fontSize: 8, fontWeight: 700, flex: '0 0 auto' }}>
                                    {p.split(' ').map(w => w[0]).join('')}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: 11 }}>{p}</div>
                                    <div style={{ fontSize: 10, color: '#94a3b8' }}>{m}</div>
                                </div>
                                <span style={{ padding: '2px 7px', borderRadius: 999, background: sc, color: cc, fontSize: 9, fontWeight: 700 }}>{s}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MiniChart() {
    const d = [38, 42, 48, 44, 52, 58, 55, 62, 68, 72, 68, 75, 82, 78];
    const W = 320, H = 60, P = 4;
    const max = Math.max(...d), min = Math.min(...d);
    const xs = (i: number) => P + (i / (d.length - 1)) * (W - P * 2);
    const ys = (v: number) => H - P - ((v - min) / (max - min)) * (H - P * 2);
    const pts = d.map((v, i) => `${i === 0 ? 'M' : 'L'}${xs(i).toFixed(1)} ${ys(v).toFixed(1)}`).join(' ');
    const area = pts + ` L ${xs(d.length - 1)} ${H} L ${xs(0)} ${H} Z`;
    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
                <linearGradient id="mg" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#0f766e" stopOpacity=".18" />
                    <stop offset="100%" stopColor="#0f766e" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={area} fill="url(#mg)" />
            <path d={pts} fill="none" stroke="#0f766e" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
            {d.map((v, i) => <circle key={i} cx={xs(i)} cy={ys(v)} r={i === d.length - 1 ? 3.5 : 1.5} fill="white" stroke="#0f766e" strokeWidth="1.4" />)}
        </svg>
    );
}

// ─── Floating clinical-check cards ────────────────────────────────
function FloatingCards() {
    return (
        <>
            <div style={{
                position: 'absolute', top: -24, right: -32, zIndex: 10,
                background: 'white', border: '1px solid #eef0f4', borderRadius: 12,
                padding: '10px 14px', boxShadow: '0 8px 32px -8px rgba(15,23,42,.18)',
                display: 'flex', alignItems: 'center', gap: 10, minWidth: 200,
                animation: 'float1 4s ease-in-out infinite',
            }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ecfdf5', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6"/></svg>
                </div>
                <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Formulary covered</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Tier 1 · est. copay $4.50</div>
                </div>
            </div>
            <div style={{
                position: 'absolute', bottom: 60, left: -48, zIndex: 10,
                background: 'white', border: '1px solid rgba(217,119,6,.2)', borderRadius: 12,
                padding: '10px 14px', boxShadow: '0 8px 32px -8px rgba(15,23,42,.18)',
                display: 'flex', alignItems: 'center', gap: 10, minWidth: 220,
                animation: 'float2 5s ease-in-out infinite',
            }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#fef3c7', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2 21h20Z"/><path d="M12 10v5M12 18v.5"/></svg>
                </div>
                <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Drug interaction (moderate)</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Metformin + Lisinopril: monitor K⁺</div>
                </div>
            </div>
            <div style={{
                position: 'absolute', bottom: -20, right: 24, zIndex: 10,
                background: 'white', border: '1px solid #eef0f4', borderRadius: 12,
                padding: '10px 14px', boxShadow: '0 8px 32px -8px rgba(15,23,42,.18)',
                display: 'flex', alignItems: 'center', gap: 10,
                animation: 'float3 6s ease-in-out infinite',
            }}>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 22, fontWeight: 700, color: '#0f766e', lineHeight: 1 }}>52s</div>
                <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>Median Rx time</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>vs 4.2 min industry avg</div>
                </div>
            </div>
        </>
    );
}

// ─── Feature card ─────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, tone }: { icon: React.ReactNode; title: string; desc: string; tone: string }) {
    const tones: Record<string, { bg: string; c: string }> = {
        teal:   { bg: '#f0fdfa', c: '#0f766e' },
        violet: { bg: '#f5f3ff', c: '#6d28d9' },
        amber:  { bg: '#fef3c7', c: '#b45309' },
        rose:   { bg: '#ffe4e6', c: '#be123c' },
        green:  { bg: '#ecfdf5', c: '#047857' },
        blue:   { bg: '#eff6ff', c: '#1d4ed8' },
    };
    const { bg, c } = tones[tone] ?? tones.teal;
    return (
        <div style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, color: c, display: 'grid', placeItems: 'center' }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-.01em', color: '#0f172a' }}>{title}</div>
                <div style={{ fontSize: 13.5, color: '#475569', marginTop: 6, lineHeight: 1.55 }}>{desc}</div>
            </div>
        </div>
    );
}

// ─── Pricing card ─────────────────────────────────────────────────
function PricingCard({ name, price, desc, features, featured, cta }: {
    name: string; price: string; desc: string; features: string[]; featured?: boolean; cta: string;
}) {
    return (
        <div style={{
            background: featured ? '#0f766e' : 'white',
            border: featured ? 'none' : '1px solid #eef0f4',
            borderRadius: 16, padding: '28px 24px',
            boxShadow: featured ? '0 24px 48px -12px rgba(15,118,110,.35)' : '0 1px 2px rgba(15,23,42,.04)',
            display: 'flex', flexDirection: 'column', gap: 0,
            position: 'relative',
        }}>
            {featured && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#10b981', color: 'white', padding: '3px 14px', borderRadius: 999, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    Most popular
                </div>
            )}
            <div style={{ fontSize: 13, fontWeight: 700, color: featured ? 'rgba(255,255,255,.7)' : '#0f766e', textTransform: 'uppercase', letterSpacing: '.06em' }}>{name}</div>
            <div style={{ fontSize: 42, fontWeight: 700, letterSpacing: '-.03em', color: featured ? 'white' : '#0f172a', margin: '12px 0 4px' }}>
                {price}<span style={{ fontSize: 16, fontWeight: 500, color: featured ? 'rgba(255,255,255,.6)' : '#94a3b8' }}>/mo</span>
            </div>
            <div style={{ fontSize: 13.5, color: featured ? 'rgba(255,255,255,.7)' : '#475569', marginBottom: 24, lineHeight: 1.4 }}>{desc}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5, color: featured ? 'rgba(255,255,255,.9)' : '#475569' }}>
                        <span style={{ color: featured ? '#10b981' : '#0f766e', flex: '0 0 auto', marginTop: 1 }}>{Icons.checkSm(14)}</span>
                        {f}
                    </div>
                ))}
            </div>
            <a href="/login" style={{
                display: 'block', textAlign: 'center', padding: '12px',
                borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                background: featured ? 'white' : '#0f766e',
                color: featured ? '#0f766e' : 'white',
                border: featured ? 'none' : 'none',
                textDecoration: 'none', marginTop: 'auto',
                boxShadow: featured ? '0 4px 12px rgba(0,0,0,.08)' : 'none',
            }}>
                {cta}
            </a>
        </div>
    );
}

// ─── Section heading ──────────────────────────────────────────────
function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: React.ReactNode; sub?: string }) {
    return (
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 48px' }}>
            <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 999, background: '#f0fdfa', color: '#0f766e', fontSize: 12, fontWeight: 700, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                {eyebrow}
            </div>
            <h2 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-.03em', color: '#0b1220', margin: 0, lineHeight: 1.1, textWrap: 'balance' as any }}>
                {title}
            </h2>
            {sub && <p style={{ fontSize: 17, color: '#475569', margin: '14px 0 0', lineHeight: 1.55 }}>{sub}</p>}
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────
export default function Welcome({ auth }: PageProps) {
    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formClinic, setFormClinic] = useState('');
    const [submitted, setSubmitted] = useState(false);

    return (
        <>
            <Head title="Pulse Rx — Prescribing software for modern clinics" />

            <style>{`
                @keyframes float1 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
                @keyframes float2 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
                @keyframes float3 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                .lp { font-family: "Inter", system-ui, sans-serif; background: #fff; color: #0b1220; -webkit-font-smoothing: antialiased; line-height: 1.5; }
                .lp * { box-sizing: border-box; }
                .lp a { color: inherit; text-decoration: none; }
                .lp input, .lp textarea { font-family: "Inter", system-ui, sans-serif; }
                .nav-link:hover { color: #0f172a !important; background: #f7f8fa; }
                .quick-hover:hover { border-color: #0f766e !important; }
                .pricing-btn:hover { opacity: .9; transform: translateY(-1px); }
            `}</style>

            <div className="lp">

                {/* ── NAV ──────────────────────────────────────────────── */}
                <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,.85)', backdropFilter: 'saturate(180%) blur(16px)', borderBottom: '1px solid #eef0f4' }}>
                    <div style={{ ...S.container, display: 'flex', alignItems: 'center', gap: 32, padding: '14px 32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 15.5, letterSpacing: '-.01em', flex: '0 0 auto' }}>
                            <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg, #0f766e, #134e4a)', display: 'grid', placeItems: 'center', boxShadow: 'inset 0 -2px 0 rgba(0,0,0,.14)' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 4h6.5a3.5 3.5 0 0 1 0 7H5M5 4v16M5 11h4l7 9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                            Pulse Rx <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: 12, marginLeft: 4 }}>for clinics</span>
                        </div>

                        <div style={{ display: 'flex', gap: 2, marginLeft: 16 }}>
                            {[['Features', '#features'], ['Workflow', '#workflow'], ['Pricing', '#pricing']].map(([l, h]) => (
                                <a key={l} href={h} className="nav-link" style={{ padding: '7px 12px', fontSize: 13.5, color: '#475569', fontWeight: 500, borderRadius: 7, transition: 'color .12s, background .12s' }}>{l}</a>
                            ))}
                        </div>

                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                            {auth.user ? (
                                <Link href={route('dashboard')} style={{ ...S.btnPrimary, padding: '9px 18px', fontSize: 13.5, borderRadius: 9 }}>
                                    Go to app {Icons.arrow(14)}
                                </Link>
                            ) : (
                                <>
                                    <Link href="/login" style={{ ...S.btnGhost, fontSize: 13.5 }}>Sign in</Link>
                                    <Link href="/login" style={{ ...S.btnPrimary, padding: '9px 18px', fontSize: 13.5, borderRadius: 9 }}>
                                        Start free trial
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                {/* ── HERO ─────────────────────────────────────────────── */}
                <section style={{ position: 'relative', padding: '64px 0 96px', overflow: 'hidden' }}>
                    {/* Background radial glows */}
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
                        background: 'radial-gradient(ellipse 90% 50% at 50% -10%, rgba(15,118,110,.10), transparent 60%), radial-gradient(ellipse 50% 40% at 80% 30%, rgba(16,185,129,.10), transparent 70%)' }} />
                    {/* Dot grid */}
                    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: .4, zIndex: 0, maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black 30%, transparent 80%)', WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black 30%, transparent 80%)' }}>
                        <defs><pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.5" fill="#0f766e" opacity=".18"/></pattern></defs>
                        <rect width="100%" height="100%" fill="url(#dots)" />
                    </svg>

                    <div style={{ ...S.container, position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 56, alignItems: 'center' }}>
                            {/* Left copy */}
                            <div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 5px 5px 5px', background: 'white', border: '1px solid #e3e7ee', borderRadius: 999, fontSize: 12.5, color: '#475569', fontWeight: 500, boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 8px 24px -10px rgba(15,23,42,.12)', marginBottom: 22 }}>
                                    <span style={{ background: '#0f766e', color: 'white', fontWeight: 600, fontSize: 11, padding: '3px 9px', borderRadius: 999 }}>New</span>
                                    <span style={{ paddingRight: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                        EPCS-certified · sign controlled Rx digitally {Icons.arrow(14)}
                                    </span>
                                </div>

                                <h1 style={{ fontSize: 62, lineHeight: 1.02, letterSpacing: '-.035em', fontWeight: 700, margin: '0 0 18px', color: '#0b1220' }}>
                                    Prescriptions in{' '}
                                    <span style={{ color: '#0f766e', position: 'relative', display: 'inline-block' }}>
                                        52 seconds
                                        <span style={{ position: 'absolute', left: 0, right: 0, bottom: 6, height: 10, background: '#ccfbf1', zIndex: -1, borderRadius: 4, display: 'block' }} />
                                    </span>
                                    , not 5 minutes.
                                </h1>

                                <p style={{ fontSize: 18, color: '#475569', maxWidth: 520, lineHeight: 1.55, margin: 0 }}>
                                    Pulse Rx is the prescription-management platform built for clinic speed — drug search, decision support, patient history, and e-Rx in one tab.
                                </p>

                                <div style={{ display: 'flex', gap: 12, marginTop: 32, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <a href="/login" style={S.btnPrimary}>
                                        Start free trial — no card required
                                    </a>
                                    <a href="/doctor/dashboard" style={S.btnSecondary}>
                                        {Icons.arrow(15)} Live demo
                                    </a>
                                </div>

                                <div style={{ display: 'flex', gap: 22, marginTop: 22, fontSize: 12.5, color: '#94a3b8' }}>
                                    {['SOC2 Type II certified', 'HIPAA compliant', 'No setup fee'].map(m => (
                                        <span key={m} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ color: '#10b981' }}>{Icons.checkSm(13)}</span> {m}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Right preview */}
                            <div style={{ position: 'relative' }}>
                                <ProductPreview />
                                <FloatingCards />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── TRUST BAR ────────────────────────────────────────── */}
                <div style={{ background: '#f7f8fa', borderTop: '1px solid #eef0f4', borderBottom: '1px solid #eef0f4', padding: '20px 0' }}>
                    <div style={{ ...S.container, display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', flex: '0 0 auto' }}>
                            Trusted by clinics at
                        </span>
                        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'center' }}>
                            {['MediCore Health', 'Apollo Clinics', 'BrightPath Medical', 'Summit Hospital', 'Greenview Clinic'].map(name => (
                                <span key={name} style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', letterSpacing: '-.01em' }}>{name}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── FEATURES ─────────────────────────────────────────── */}
                <section id="features" style={{ padding: '96px 0' }}>
                    <div style={S.container}>
                        <SectionHead
                            eyebrow="Features"
                            title={<>Everything a modern clinic needs,<br />nothing it doesn't.</>}
                            sub="Purpose-built for doctors and clinic staff — not general-purpose EHR bloat."
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                            <FeatureCard tone="teal" icon={<Icons.zap />} title="52-second prescription"
                                desc="Drug autocomplete, dose presets, and one-click sign. Fastest Rx workflow in the industry — backed by 8.2M prescriptions processed." />
                            <FeatureCard tone="violet" icon={<Icons.brain />} title="Real-time decision support"
                                desc="Allergy cross-check, drug–drug interaction alerts, and formulary tier — surfaced automatically, not buried in a sidebar." />
                            <FeatureCard tone="amber" icon={<Icons.pill />} title="Global drug library"
                                desc="12,000+ medicines with brand/generic aliases, route, form, and standard dosing. Doctor-specific favourites and custom defaults." />
                            <FeatureCard tone="green" icon={<Icons.send />} title="Electronic prescribing"
                                desc="EPCS-certified signing, DEA-bound keys, and direct pharmacy transmission. Paper is optional, not the default." />
                            <FeatureCard tone="rose" icon={<Icons.refresh />} title="One-tap refills"
                                desc="Refill requests surfaced in the queue. Review, approve, and transmit in seconds without opening a full Rx form." />
                            <FeatureCard tone="blue" icon={<Icons.plug />} title="EHR & lab integrations"
                                desc="HL7 FHIR connectors for major EHRs. Lab results auto-populate patient records so every Rx is informed." />
                        </div>
                    </div>
                </section>

                {/* ── SHOWCASE ROW 1 — Prescription form ───────────────── */}
                <section style={{ background: '#f7f8fa', padding: '96px 0', borderTop: '1px solid #eef0f4' }}>
                    <div style={{ ...S.container, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
                        {/* Form mock */}
                        <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '14px 18px', borderBottom: '1px solid #eef0f4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700 }}>Write a prescription</div>
                                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Compose, validate, and sign</div>
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    {['1', '2', '3'].map((s, i) => (
                                        <span key={s} style={{ width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, background: i === 1 ? '#0f766e' : i === 0 ? '#10b981' : '#eef0f4', color: i < 2 ? 'white' : '#94a3b8', border: i > 1 ? '1px solid #e3e7ee' : 'none' }}>{i === 0 ? '✓' : s}</span>
                                    ))}
                                </div>
                            </div>
                            {/* Allergy banner */}
                            <div style={{ margin: '12px 18px 0', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#ffe4e6', color: '#be123c', borderRadius: 10, fontSize: 12.5, fontWeight: 500 }}>
                                {Icons.warn(15)} <b>Allergies on file:</b>&nbsp;Penicillin, Sulfa drugs
                            </div>
                            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {/* Drug search */}
                                <div style={{ border: '1px solid #e3e7ee', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center', color: '#475569', fontSize: 13 }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
                                    <span style={{ flex: 1, fontWeight: 500 }}>Metformin 500mg</span>
                                    <span style={{ padding: '2px 8px', borderRadius: 999, background: '#f0fdfa', color: '#0f766e', fontSize: 11, fontWeight: 600 }}>Biguanide</span>
                                </div>
                                {/* Clinical checks */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8' }}>Clinical checks</div>
                                    {[
                                        { t: 'Dose appropriate', s: 'Within range for adult, normal renal function', ok: true },
                                        { t: 'No allergy conflict', s: 'Cleared against Penicillin, Sulfa drugs', ok: true },
                                        { t: 'Interaction (moderate)', s: 'Metformin + Lisinopril: monitor hyperkalemia', ok: false },
                                        { t: 'Formulary covered', s: 'Tier 1 · est. copay $4.50', ok: true },
                                    ].map(({ t, s, ok }) => (
                                        <div key={t} style={{ display: 'flex', gap: 10, padding: '9px 12px', borderRadius: 10, border: `1px solid ${ok ? 'rgba(16,185,129,.18)' : 'rgba(217,119,6,.18)'}`, background: ok ? '#ecfdf5' : '#fef3c7' }}>
                                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: ok ? '#10b981' : '#d97706', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                                    {ok ? <path d="m5 12 4 4L19 6"/> : <path d="M12 3 2 21h20Z M12 10v5M12 18v.5"/>}
                                                </svg>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: ok ? '#047857' : '#b45309' }}>{t}</div>
                                                <div style={{ fontSize: 11, color: ok ? '#065f46' : '#92400e', marginTop: 1 }}>{s}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                                    <button style={{ ...S.btnGhost, fontSize: 12.5 }}>Save draft</button>
                                    <div style={{ flex: 1 }} />
                                    <button style={{ ...S.btnSecondary, fontSize: 12.5, padding: '7px 14px' }}>Preview</button>
                                    <button style={{ ...S.btnPrimary, fontSize: 12.5, padding: '7px 14px', borderRadius: 8, boxShadow: 'none' }}>Sign &amp; transmit</button>
                                </div>
                            </div>
                        </div>

                        {/* Copy */}
                        <div>
                            <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 999, background: '#f0fdfa', color: '#0f766e', fontSize: 12, fontWeight: 700, marginBottom: 18, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                                Prescription builder
                            </div>
                            <h2 style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-.03em', color: '#0b1220', margin: '0 0 16px', lineHeight: 1.1 }}>
                                Safety checks happen automatically — not as an afterthought.
                            </h2>
                            <p style={{ fontSize: 16.5, color: '#475569', lineHeight: 1.6, margin: '0 0 28px' }}>
                                Every prescription is cross-checked in real time: allergies, drug interactions, formulary tier, and renal dosing. Alerts surface inline, not in a pop-up you'll click through.
                            </p>
                            {[
                                'Drug autocomplete with 12,000+ medicines',
                                'Per-doctor default doses remembered',
                                'Print-ready ℞ slip with e-signature block',
                                "Direct transmission to patient's pharmacy",
                            ].map(f => (
                                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, fontSize: 14.5, color: '#0f172a' }}>
                                    <span style={{ color: '#0f766e', flex: '0 0 auto' }}>{Icons.checkSm(15)}</span> {f}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── SHOWCASE ROW 2 — Patient record ──────────────────── */}
                <section style={{ padding: '96px 0', background: 'white' }}>
                    <div style={{ ...S.container, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
                        {/* Copy */}
                        <div>
                            <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 999, background: '#f5f3ff', color: '#6d28d9', fontSize: 12, fontWeight: 700, marginBottom: 18, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                                Patient records
                            </div>
                            <h2 style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-.03em', color: '#0b1220', margin: '0 0 16px', lineHeight: 1.1 }}>
                                Full patient context — one screen, zero clicks.
                            </h2>
                            <p style={{ fontSize: 16.5, color: '#475569', lineHeight: 1.6, margin: '0 0 28px' }}>
                                Allergies, active medications, vitals, conditions, and prescription history all in a single patient record that pre-fills every new Rx automatically.
                            </p>
                            {['Allergy warnings always visible', 'Active med grid with refill shortcuts', 'Condition list + ICD-10 codes', 'Timeline of all prescriptions'].map(f => (
                                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, fontSize: 14.5, color: '#0f172a' }}>
                                    <span style={{ color: '#0f766e', flex: '0 0 auto' }}>{Icons.checkSm(15)}</span> {f}
                                </div>
                            ))}
                        </div>

                        {/* Patient record mock */}
                        <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
                            {/* Header */}
                            <div style={{ padding: '14px 18px', borderBottom: '1px solid #eef0f4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #0f766e)', color: 'white', display: 'grid', placeItems: 'center', fontSize: 15, fontWeight: 700 }}>AH</div>
                                    <div>
                                        <div style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                                            Amelia Hartwood
                                            <span style={{ padding: '2px 8px', borderRadius: 999, background: '#ecfdf5', color: '#047857', fontSize: 10, fontWeight: 700 }}>Active</span>
                                        </div>
                                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>34 y · Female · O+ · Blue Shield #BS-29481</div>
                                    </div>
                                </div>
                                <button style={{ ...S.btnPrimary, padding: '7px 14px', fontSize: 12.5, borderRadius: 8, boxShadow: 'none' }}>Write Rx</button>
                            </div>
                            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {/* Allergies */}
                                <div style={{ border: '1px solid rgba(225,29,72,.16)', borderRadius: 10, padding: '12px 14px' }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#e11d48', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {Icons.warn(14)} Allergies &amp; alerts
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        {['Penicillin', 'Sulfa drugs'].map(a => (
                                            <div key={a} style={{ display: 'flex', gap: 8, padding: 10, background: '#ffe4e6', borderRadius: 8, alignItems: 'center' }}>
                                                <div style={{ width: 4, alignSelf: 'stretch', background: '#e11d48', borderRadius: 4 }} />
                                                <div>
                                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#be123c' }}>{a}</div>
                                                    <div style={{ fontSize: 10.5, color: '#be123c', opacity: .8 }}>Severe · anaphylaxis risk</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Active meds */}
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8', marginBottom: 10 }}>Active medications</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        {[
                                            { n: 'Metformin 500mg', s: 'BID with meals · 30d', r: 2 },
                                            { n: 'Lisinopril 10mg', s: 'QD morning · 90d', r: 2 },
                                        ].map(({ n, s, r }) => (
                                            <div key={n} style={{ padding: 12, background: '#f7f8fa', border: '1px solid #eef0f4', borderRadius: 10 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ width: 24, height: 24, borderRadius: 7, background: '#f0fdfa', color: '#0f766e', display: 'grid', placeItems: 'center' }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
                                                    </div>
                                                    <span style={{ padding: '2px 7px', borderRadius: 999, background: '#ecfdf5', color: '#047857', fontSize: 10, fontWeight: 600 }}>Active</span>
                                                </div>
                                                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 8 }}>{n}</div>
                                                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{s}</div>
                                                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{r} refills left</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── WORKFLOW ─────────────────────────────────────────── */}
                <section id="workflow" style={{ background: '#f7f8fa', padding: '96px 0', borderTop: '1px solid #eef0f4' }}>
                    <div style={S.container}>
                        <SectionHead
                            eyebrow="How it works"
                            title="From patient to pharmacy in four steps."
                            sub="A workflow your entire clinic can learn in under 10 minutes."
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, position: 'relative' }}>
                            {/* Dashed connector */}
                            <div style={{ position: 'absolute', top: 28, left: '12.5%', right: '12.5%', height: 2, backgroundImage: 'repeating-linear-gradient(to right, #0f766e 0 8px, transparent 8px 16px)', zIndex: 0, opacity: .5 }} />
                            {[
                                { n: 1, t: 'Search patient', d: 'Pull up the patient by name or UID — record pre-fills allergies and active meds.', c: '#0f766e' },
                                { n: 2, t: 'Search drug', d: 'Type 3 letters to autocomplete. Default dose pre-fills; adjust if needed.', c: '#7c3aed' },
                                { n: 3, t: 'Review & sign', d: 'Clinical checks run automatically. One click to sign electronically.', c: '#10b981' },
                                { n: 4, t: 'Pharmacy receives', d: 'Prescription transmits instantly. Patient gets SMS confirmation.', c: '#d97706' },
                            ].map(({ n, t, d, c }) => (
                                <div key={n} style={{ padding: '0 24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: c, color: 'white', display: 'grid', placeItems: 'center', fontSize: 20, fontWeight: 700, margin: '0 auto 20px', boxShadow: `0 8px 24px -8px ${c}88` }}>
                                        {n}
                                    </div>
                                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: '#0f172a' }}>{t}</div>
                                    <div style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.55 }}>{d}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── STATS BANNER ─────────────────────────────────────── */}
                <section style={{ background: 'linear-gradient(135deg, #0f766e 0%, #115e59 50%, #134e4a 100%)', padding: '72px 0' }}>
                    <div style={{ ...S.container, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, textAlign: 'center' }}>
                        {[
                            { v: '52s', l: 'Median Rx time', s: 'vs 4.2 min industry avg' },
                            { v: '99.99%', l: 'Uptime SLA', s: 'zero planned downtime' },
                            { v: '8.2M', l: 'Prescriptions signed', s: 'and counting' },
                            { v: '31%', l: 'Faster refills', s: 'vs manual workflow' },
                        ].map(({ v, l, s }) => (
                            <div key={v}>
                                <div style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-.04em', color: 'white', fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}>{v}</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,.9)', marginTop: 6 }}>{l}</div>
                                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.55)', marginTop: 4 }}>{s}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── TESTIMONIAL ──────────────────────────────────────── */}
                <section style={{ padding: '96px 0', background: 'white' }}>
                    <div style={{ ...S.container, maxWidth: 860, margin: '0 auto', padding: '0 32px' }}>
                        <div style={{ ...S.card, padding: '48px 56px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: -12, left: 32, color: '#ccfbf1', opacity: .8 }}>
                                {Icons.quote(96)}
                            </div>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ display: 'flex', gap: 4, marginBottom: 20, color: '#0f766e' }}>
                                    {[1,2,3,4,5].map(i => <span key={i}>{Icons.star()}</span>)}
                                </div>
                                <p style={{ fontSize: 22, lineHeight: 1.5, color: '#0f172a', fontWeight: 500, letterSpacing: '-.01em', margin: '0 0 32px' }}>
                                    "We switched from our old EHR's prescription module to Pulse Rx two months ago. My team writes prescriptions in under a minute now, and the interaction alerts have already caught two serious conflicts."
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #0f766e, #10b981)', color: 'white', display: 'grid', placeItems: 'center', fontSize: 17, fontWeight: 700 }}>SR</div>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Dr. Shalini Reddy</div>
                                        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Head of Internal Medicine · Apollo Clinics Mumbai</div>
                                    </div>
                                    <div style={{ marginLeft: 'auto', padding: '6px 16px', borderRadius: 999, background: '#f0fdfa', color: '#0f766e', fontSize: 12, fontWeight: 700 }}>
                                        Apollo Clinics
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── PRICING ──────────────────────────────────────────── */}
                <section id="pricing" style={{ background: '#f7f8fa', padding: '96px 0', borderTop: '1px solid #eef0f4' }}>
                    <div style={S.container}>
                        <SectionHead
                            eyebrow="Pricing"
                            title="Simple pricing, no surprises."
                            sub="Start free. Scale when you grow. No per-prescription fees."
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, alignItems: 'center', maxWidth: 960, margin: '0 auto' }}>
                            <PricingCard
                                name="Solo"
                                price="$29"
                                desc="For individual practitioners just getting started."
                                cta="Start free trial"
                                features={[
                                    '1 doctor',
                                    'Up to 200 prescriptions/mo',
                                    'Drug library access',
                                    'Basic decision support',
                                    'PDF export',
                                ]}
                            />
                            <PricingCard
                                name="Clinic"
                                price="$89"
                                desc="For multi-doctor clinics that need full workflows."
                                cta="Start free trial"
                                featured
                                features={[
                                    'Up to 10 doctors',
                                    'Unlimited prescriptions',
                                    'e-Rx & pharmacy transmission',
                                    'Full decision support',
                                    'Patient portal',
                                    'Priority support',
                                ]}
                            />
                            <PricingCard
                                name="Hospital"
                                price="$249"
                                desc="Multi-department hospitals with custom needs."
                                cta="Talk to sales"
                                features={[
                                    'Unlimited doctors',
                                    'Unlimited prescriptions',
                                    'EHR / lab integrations',
                                    'EPCS controlled substances',
                                    'Audit logs & compliance reports',
                                    'Dedicated CSM',
                                ]}
                            />
                        </div>
                        <p style={{ textAlign: 'center', fontSize: 13, color: '#94a3b8', marginTop: 28 }}>
                            All plans include a 14-day free trial. No credit card required.
                        </p>
                    </div>
                </section>

                {/* ── FINAL CTA ────────────────────────────────────────── */}
                <section style={{ background: '#0b1220', padding: '96px 0' }}>
                    <div style={{ ...S.container, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
                        {/* Copy */}
                        <div>
                            <h2 style={{ fontSize: 42, fontWeight: 700, letterSpacing: '-.03em', color: 'white', margin: '0 0 16px', lineHeight: 1.1 }}>
                                Ready to cut your<br />
                                <span style={{ color: '#10b981' }}>Rx time by 80%?</span>
                            </h2>
                            <p style={{ fontSize: 16.5, color: 'rgba(255,255,255,.6)', lineHeight: 1.6, margin: '0 0 32px' }}>
                                Join 2,400+ clinicians already using Pulse Rx. Book a 20-minute demo and we'll configure a workspace for your clinic on the call.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {['14-day free trial, no card', 'HIPAA-compliant from day one', 'Onboarding call included', 'Cancel any time'].map(f => (
                                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14.5, color: 'rgba(255,255,255,.75)' }}>
                                        <span style={{ color: '#10b981', flex: '0 0 auto' }}>{Icons.checkSm(15)}</span> {f}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Demo form */}
                        <div style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, padding: 32 }}>
                            {submitted ? (
                                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#10b981', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6"/></svg>
                                    </div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 8 }}>We'll be in touch!</div>
                                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,.55)' }}>Expect a calendar invite within 24 hours.</div>
                                </div>
                            ) : (
                                <>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 6 }}>Request a demo</div>
                                    <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,.5)', marginBottom: 24 }}>We'll reach out within one business day.</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                        {[
                                            { label: 'Full name', value: formName, set: setFormName, placeholder: 'Dr. Jane Smith' },
                                            { label: 'Work email', value: formEmail, set: setFormEmail, placeholder: 'jane@yourclinic.com' },
                                            { label: 'Clinic name', value: formClinic, set: setFormClinic, placeholder: 'General Hospital' },
                                        ].map(({ label, value, set, placeholder }) => (
                                            <div key={label}>
                                                <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.6)', display: 'block', marginBottom: 6 }}>{label}</label>
                                                <input
                                                    value={value}
                                                    onChange={e => set(e.target.value)}
                                                    placeholder={placeholder}
                                                    style={{ width: '100%', padding: '11px 14px', borderRadius: 9, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.07)', color: 'white', fontSize: 14, outline: 'none' }}
                                                />
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => formName && formEmail && setSubmitted(true)}
                                            style={{ ...S.btnPrimary, width: '100%', justifyContent: 'center', marginTop: 4, padding: '13px', fontSize: 14.5, borderRadius: 10 }}
                                        >
                                            Book my demo {Icons.arrow(15)}
                                        </button>
                                        <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,.3)', textAlign: 'center', margin: 0 }}>
                                            No spam. Unsubscribe any time.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </section>

                {/* ── FOOTER ───────────────────────────────────────────── */}
                <footer style={{ background: '#060d19', borderTop: '1px solid rgba(255,255,255,.05)', padding: '56px 0 32px' }}>
                    <div style={S.container}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
                            {/* Brand */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                    <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg, #0f766e, #134e4a)', display: 'grid', placeItems: 'center' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 4h6.5a3.5 3.5 0 0 1 0 7H5M5 4v16M5 11h4l7 9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    </div>
                                    <span style={{ fontWeight: 700, fontSize: 15, color: 'white' }}>Pulse Rx</span>
                                </div>
                                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,.4)', lineHeight: 1.65, maxWidth: 280, margin: '0 0 20px' }}>
                                    Prescribing software for modern clinics. Fast, safe, and built around how doctors actually work.
                                </p>
                                {/* Compliance badges */}
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {['SOC2', 'HIPAA', 'EPCS'].map(b => (
                                        <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', border: '1px solid rgba(255,255,255,.12)', borderRadius: 7, fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.5)', letterSpacing: '.04em' }}>
                                            {Icons.shield(12)} {b}
                                        </div>
                                    ))}
                                </div>
                                {/* Social */}
                                <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                                    {[Icons.twitter(), Icons.linkedin()].map((ico, i) => (
                                        <a key={i} href="#" style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid rgba(255,255,255,.1)', display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,.4)', transition: 'color .12s' }}>
                                            {ico}
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {/* Link columns */}
                            {[
                                { h: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap', 'Status'] },
                                { h: 'Resources', links: ['Documentation', 'API Reference', 'Help Center', 'Blog', 'Webinars'] },
                                { h: 'Company', links: ['About', 'Careers', 'Privacy', 'Terms', 'Security'] },
                            ].map(({ h, links }) => (
                                <div key={h}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.6)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 16 }}>{h}</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {links.map(l => (
                                            <a key={l} href="#" style={{ fontSize: 13.5, color: 'rgba(255,255,255,.4)', transition: 'color .12s' }}>{l}</a>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5, color: 'rgba(255,255,255,.3)' }}>
                            <span>© 2026 Pulse Rx Inc. All rights reserved.</span>
                            <span>Built for clinicians, by clinicians.</span>
                        </div>
                    </div>
                </footer>

            </div>
        </>
    );
}
