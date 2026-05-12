import { Head, Link } from '@inertiajs/react';
import DoctorLayout from '@/Layouts/DoctorLayout';
import { PageProps } from '@/types';

// ─── Types ────────────────────────────────────────────────────────
interface RecentPrescription {
    id: number;
    prescription_uid: string;
    patient_name: string;
    patient_uid: string;
    medicine_summary: string;
    freq_summary: string;
    status: 'draft' | 'signed' | 'printed';
    date: string;
}

interface ScheduleItem {
    time: string;
    patient_name: string;
    reason: string;
    is_now: boolean;
    is_next: boolean;
}

interface Props extends PageProps {
    stats: {
        active_prescriptions: number;
        patients_today: number;
        pending_refills: number;
        total_patients: number;
    };
    recent_prescriptions: RecentPrescription[];
    todays_schedule: ScheduleItem[];
    chart_data: { new_rx: number[]; refills: number[] };
    today_label: string;
}

// ─── Icons ────────────────────────────────────────────────────────
const Icon = ({ size = 18, children }: { size?: number; children: React.ReactNode }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        {children}
    </svg>
);

const I = {
    rx: (s = 18) => <Icon size={s}><path d="M5 4h6a3 3 0 0 1 0 6H5M5 4v16M5 10h4l6 10M13 14l6 6" /></Icon>,
    patients: (s = 18) => <Icon size={s}><circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="6" r="2.5"/><path d="M14 14a5 5 0 0 1 7 4"/></Icon>,
    clock: (s = 18) => <Icon size={s}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>,
    trending: (s = 18) => <Icon size={s}><path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/></Icon>,
    plus: (s = 16) => <Icon size={s}><path d="M12 5v14M5 12h14"/></Icon>,
    user: (s = 18) => <Icon size={s}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></Icon>,
    send: (s = 18) => <Icon size={s}><path d="m22 2-11 11"/><path d="M22 2 15 22l-4-9-9-4Z"/></Icon>,
    warn: (s = 18) => <Icon size={s}><path d="M12 3 2 21h20Z"/><path d="M12 10v5M12 18v.5"/></Icon>,
    arrow: (s = 14) => <Icon size={s}><path d="M5 12h14M13 6l6 6-6 6"/></Icon>,
    more: (s = 16) => <Icon size={s}><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/></Icon>,
};

// ─── Status pill ──────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
    const map: Record<string, { bg: string; c: string; dot: string; label: string }> = {
        signed:  { bg: 'var(--rx-green-soft)', c: 'var(--rx-green-deep)', dot: 'var(--rx-green-deep)', label: 'Signed' },
        printed: { bg: 'var(--rx-green-soft)', c: 'var(--rx-green-deep)', dot: 'var(--rx-green-deep)', label: 'Printed' },
        draft:   { bg: 'var(--rx-amber-soft)', c: 'var(--rx-amber-deep)', dot: 'var(--rx-amber-deep)', label: 'Draft' },
        active:  { bg: 'var(--rx-green-soft)', c: 'var(--rx-green-deep)', dot: 'var(--rx-green-deep)', label: 'Active' },
        pending: { bg: 'var(--rx-amber-soft)', c: 'var(--rx-amber-deep)', dot: 'var(--rx-amber-deep)', label: 'Pending' },
        expired: { bg: 'var(--rx-rose-soft)', c: 'var(--rx-rose-deep)', dot: 'var(--rx-rose-deep)', label: 'Expired' },
    };
    const s = map[status.toLowerCase()] ?? map.draft;
    return (
        <span className="rx-pill" style={{ background: s.bg, color: s.c }}>
            <span className="rx-pill-dot" style={{ background: s.dot }} />
            {s.label}
        </span>
    );
}

// ─── Stat card ────────────────────────────────────────────────────
function StatCard({ label, value, delta, tone, icon, hint }:
    { label: string; value: string | number; delta: string; tone: string; icon: React.ReactNode; hint: string }) {
    const isUp = delta.startsWith('+');
    return (
        <div className="rx-stat-card">
            <div className="rx-stat-head">
                <div className={`rx-stat-icon tone-${tone}`}>{icon}</div>
                <div className="rx-stat-label">{label}</div>
            </div>
            <div className="rx-stat-value">{value}</div>
            <div className="rx-stat-foot">
                <span className={`rx-stat-delta ${isUp ? 'up' : 'down'}`}>{delta}</span>
                <span>{hint}</span>
            </div>
        </div>
    );
}

// ─── Chart (SVG) ─────────────────────────────────────────────────
function PrescribingChart({ data }: { data: { new_rx: number[]; refills: number[] } }) {
    const d1 = data.new_rx.length >= 14 ? data.new_rx : [38,42,48,44,52,58,55,62,68,72,68,75,82,78];
    const d2 = data.refills.length >= 14 ? data.refills : [22,25,28,24,30,34,32,36,40,44,41,46,50,48];
    const W = 640, H = 220, P = 28;
    const maxV = 100, minV = 0;
    const xs = (i: number) => P + (i / (d1.length - 1)) * (W - P * 2);
    const ys = (v: number) => H - P - ((v - minV) / (maxV - minV)) * (H - P * 2);
    const make = (arr: number[]) => arr.map((v, i) => (i === 0 ? 'M' : 'L') + xs(i).toFixed(1) + ' ' + ys(v).toFixed(1)).join(' ');
    const areaOf = (arr: number[]) => make(arr) + ` L ${xs(arr.length - 1)} ${H - P} L ${xs(0)} ${H - P} Z`;
    const days = ['', '', '', 'May 1', '', '3', '', '5', '', '7', '', '9', '', '11'];

    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
                <linearGradient id="rxg1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--rx-primary)" stopOpacity=".2" />
                    <stop offset="100%" stopColor="var(--rx-primary)" stopOpacity="0" />
                </linearGradient>
            </defs>
            {[20, 40, 60, 80, 100].map(v => (
                <g key={v}>
                    <line x1={P} x2={W - P} y1={ys(v)} y2={ys(v)} stroke="var(--rx-border)" strokeDasharray="3 4" />
                    <text x={4} y={ys(v) + 4} fontSize="10" fill="var(--rx-text-3)" fontFamily="ui-monospace, monospace">{v}</text>
                </g>
            ))}
            <path d={areaOf(d1)} fill="url(#rxg1)" />
            <path d={make(d1)} fill="none" stroke="var(--rx-primary)" strokeWidth="2" />
            <path d={make(d2)} fill="none" stroke="var(--rx-accent)" strokeWidth="2" />
            <line x1={P} x2={W - P} y1={ys(56)} y2={ys(56)} stroke="var(--rx-text-3)" strokeDasharray="2 4" opacity=".5" />
            {d1.map((v, i) => (
                <circle key={i} cx={xs(i)} cy={ys(v)} r={i === d1.length - 2 ? 4.5 : 2.5}
                    fill="white" stroke="var(--rx-primary)" strokeWidth="1.8" />
            ))}
            {days.map((d, i) => d && (
                <text key={i} x={xs(i)} y={H - 8} fontSize="10" textAnchor="middle" fill="var(--rx-text-3)">{d}</text>
            ))}
            <g transform={`translate(${xs(d1.length - 2)}, ${ys(d1[d1.length - 2])})`}>
                <rect x="-30" y="-32" width="60" height="22" rx="6" fill="var(--rx-text-1)" />
                <text x="0" y="-17" fontSize="11" fill="white" textAnchor="middle" fontWeight="600">{d1[d1.length - 2]} Rx</text>
            </g>
        </svg>
    );
}

// ─── Avatar initials ──────────────────────────────────────────────
function initials(name: string) {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

// ─── Dashboard ───────────────────────────────────────────────────
export default function Dashboard({ stats, recent_prescriptions, todays_schedule, chart_data, today_label }: Props) {
    return (
        <DoctorLayout>
            <Head title="Dashboard" />
            <div className="rx-screen">

                {/* Stat row */}
                <div className="rx-stat-row">
                    <StatCard
                        label="Active prescriptions"
                        value={stats.active_prescriptions.toLocaleString()}
                        delta="+8.2%"
                        tone="teal"
                        icon={I.rx()}
                        hint="vs last week"
                    />
                    <StatCard
                        label="Patients seen today"
                        value={stats.patients_today}
                        delta={`+${stats.patients_today}`}
                        tone="violet"
                        icon={I.patients()}
                        hint="appointments"
                    />
                    <StatCard
                        label="Pending drafts"
                        value={stats.pending_refills}
                        delta={stats.pending_refills > 0 ? `+${stats.pending_refills}` : '0'}
                        tone="amber"
                        icon={I.clock()}
                        hint="awaiting sign-off"
                    />
                    <StatCard
                        label="Total patients"
                        value={stats.total_patients.toLocaleString()}
                        delta="+5"
                        tone="rose"
                        icon={I.trending()}
                        hint="in your care"
                    />
                </div>

                {/* Main grid */}
                <div className="rx-grid">

                    {/* Chart card */}
                    <div className="rx-card rx-span-8">
                        <div className="rx-card-head">
                            <div>
                                <div className="rx-card-title">Prescribing volume</div>
                                <div className="rx-card-sub">Last 14 days · all prescriptions</div>
                            </div>
                            <div className="rx-tabs">
                                <button className="rx-tab active">14d</button>
                                <button className="rx-tab">30d</button>
                                <button className="rx-tab">90d</button>
                            </div>
                        </div>
                        <PrescribingChart data={chart_data} />
                        <div className="rx-chart-legend">
                            <div className="rx-lg">
                                <span className="rx-lg-sw" style={{ background: 'var(--rx-primary)' }} />
                                New prescriptions
                            </div>
                            <div className="rx-lg">
                                <span className="rx-lg-sw" style={{ background: 'var(--rx-accent)' }} />
                                Refills
                            </div>
                            <div className="rx-lg">
                                <span style={{ width: 14, height: 2, background: 'repeating-linear-gradient(to right, var(--rx-text-3) 0 4px, transparent 4px 7px)', display: 'inline-block', borderRadius: 0 }} />
                                Avg this period
                            </div>
                        </div>
                    </div>

                    {/* Quick actions */}
                    <div className="rx-card rx-span-4">
                        <div className="rx-card-head">
                            <div>
                                <div className="rx-card-title">Quick actions</div>
                                <div className="rx-card-sub">Common tasks</div>
                            </div>
                        </div>
                        <div className="rx-quick-grid">
                            <Link href="/doctor/prescriptions/create" className="rx-quick-btn" style={{ textDecoration: 'none' }}>
                                <span className="rx-qb-icon rx-qb-teal">{I.plus(18)}</span>
                                <div style={{ flex: 1 }}>
                                    <div className="rx-qb-t">Write Rx</div>
                                    <div className="rx-qb-s">New prescription</div>
                                </div>
                                {I.arrow()}
                            </Link>
                            <Link href="/doctor/patients/create" className="rx-quick-btn" style={{ textDecoration: 'none' }}>
                                <span className="rx-qb-icon rx-qb-violet">{I.user()}</span>
                                <div style={{ flex: 1 }}>
                                    <div className="rx-qb-t">Add patient</div>
                                    <div className="rx-qb-s">Create record</div>
                                </div>
                                {I.arrow()}
                            </Link>
                            <Link href="/doctor/queue" className="rx-quick-btn" style={{ textDecoration: 'none' }}>
                                <span className="rx-qb-icon rx-qb-amber">{I.send()}</span>
                                <div style={{ flex: 1 }}>
                                    <div className="rx-qb-t">View queue</div>
                                    <div className="rx-qb-s">Today's patients</div>
                                </div>
                                {I.arrow()}
                            </Link>
                            <Link href="/doctor/follow-ups" className="rx-quick-btn" style={{ textDecoration: 'none' }}>
                                <span className="rx-qb-icon rx-qb-rose">{I.warn()}</span>
                                <div style={{ flex: 1 }}>
                                    <div className="rx-qb-t">Follow-ups</div>
                                    <div className="rx-qb-s">Scheduled reminders</div>
                                </div>
                                {I.arrow()}
                            </Link>
                        </div>
                    </div>

                    {/* Recent prescriptions */}
                    <div className="rx-card rx-span-8">
                        <div className="rx-card-head">
                            <div>
                                <div className="rx-card-title">Recent prescriptions</div>
                                <div className="rx-card-sub">Last issued from your account</div>
                            </div>
                            <Link href="/doctor/prescriptions/create" className="rx-btn-ghost" style={{ textDecoration: 'none', fontSize: 13 }}>
                                View all {I.arrow(13)}
                            </Link>
                        </div>

                        <div className="rx-table">
                            <div className="rx-thead">
                                <div>Rx ID</div>
                                <div>Patient</div>
                                <div>Medication</div>
                                <div>Status</div>
                                <div>Date</div>
                                <div></div>
                            </div>
                            {recent_prescriptions.length === 0 ? (
                                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--rx-text-3)', fontSize: 13 }}>
                                    No prescriptions yet. Write your first one!
                                </div>
                            ) : (
                                recent_prescriptions.map(rx => (
                                    <div className="rx-tr" key={rx.id}>
                                        <div className="rx-mono" style={{ fontSize: 11.5, color: 'var(--rx-text-2)' }}>{rx.prescription_uid}</div>
                                        <div>
                                            <div className="rx-pt-cell">
                                                <div className="rx-avatar">{initials(rx.patient_name)}</div>
                                                <div>
                                                    <div className="rx-pt-name">{rx.patient_name}</div>
                                                    <div className="rx-pt-id">{rx.patient_uid}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="rx-med-name">{rx.medicine_summary || '—'}</div>
                                            <div className="rx-med-sub">{rx.freq_summary}</div>
                                        </div>
                                        <div><StatusPill status={rx.status} /></div>
                                        <div className="rx-mono" style={{ fontSize: 11.5, color: 'var(--rx-text-2)' }}>{rx.date}</div>
                                        <div>
                                            <button className="rx-row-btn">{I.more()}</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Today's schedule */}
                    <div className="rx-card rx-span-4">
                        <div className="rx-card-head">
                            <div>
                                <div className="rx-card-title">Today's schedule</div>
                                <div className="rx-card-sub">{today_label}</div>
                            </div>
                        </div>
                        <div className="rx-agenda">
                            {todays_schedule.length === 0 ? (
                                <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--rx-text-3)', fontSize: 13 }}>
                                    No appointments today
                                </div>
                            ) : (
                                todays_schedule.map((item, i) => (
                                    <div className={'rx-agenda-row' + (item.is_now ? ' now' : '')} key={i}>
                                        <div className="rx-agenda-time">{item.time}</div>
                                        <div className="rx-agenda-bar" />
                                        <div>
                                            <div className="rx-agenda-name">
                                                {item.patient_name}
                                                {item.is_now && <span className="rx-chip rx-chip-green">now</span>}
                                                {item.is_next && !item.is_now && <span className="rx-chip rx-chip-amber">next</span>}
                                            </div>
                                            <div className="rx-agenda-sub">{item.reason}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </DoctorLayout>
    );
}
