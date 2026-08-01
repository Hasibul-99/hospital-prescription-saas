import { Link, router, usePage } from '@inertiajs/react';
import { PropsWithChildren, useState } from 'react';
import { PageProps } from '@/types';
import PatientSearch from '@/Components/PatientSearch';
import NotificationBell from '@/Components/Notifications/NotificationBell';
import LanguageSwitcher from '@/Components/Common/LanguageSwitcher';
import { Patient } from '@/types';

// ─── Icons ────────────────────────────────────────────────────────
type IconProps = { size?: number; className?: string };

const Icon = ({ d, size = 18, children }: { d?: string; size?: number; children?: React.ReactNode }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        {d ? <path d={d} /> : children}
    </svg>
);

const Icons = {
    rx: (p: IconProps) => <Icon size={p.size}><path d="M5 4h6a3 3 0 0 1 0 6H5M5 4v16M5 10h4l6 10M13 14l6 6" /></Icon>,
    dashboard: (p: IconProps) => <Icon size={p.size}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></Icon>,
    queue: (p: IconProps) => <Icon size={p.size}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></Icon>,
    patients: (p: IconProps) => <Icon size={p.size}><circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="6" r="2.5"/><path d="M14 14a5 5 0 0 1 7 4"/></Icon>,
    plus: (p: IconProps) => <Icon size={p.size}><path d="M12 5v14M5 12h14"/></Icon>,
    template: (p: IconProps) => <Icon size={p.size}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></Icon>,
    followup: (p: IconProps) => <Icon size={p.size}><path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 7H4c0-1 2-2 2-7Z"/><path d="M10 19a2 2 0 0 0 4 0"/></Icon>,
    money: (p: IconProps) => <Icon size={p.size}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></Icon>,
    reports: (p: IconProps) => <Icon size={p.size}><path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/></Icon>,
    pill: (p: IconProps) => <Icon size={p.size}><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></Icon>,
    settings: (p: IconProps) => <Icon size={p.size}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .4 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.4 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.4l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .4-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.4-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.4H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.4l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.4 1.9V9c.3.4.8.7 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></Icon>,
    shield: (p: IconProps) => <Icon size={p.size}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"/></Icon>,
    menu: (p: IconProps) => <Icon size={p.size}><path d="M4 6h16M4 12h16M4 18h16"/></Icon>,
    chevronRight: (p: IconProps) => <Icon size={p.size}><path d="m9 6 6 6-6 6"/></Icon>,
    chevronDown: (p: IconProps) => <Icon size={p.size}><path d="m6 9 6 6 6-6"/></Icon>,
    bell: (p: IconProps) => <Icon size={p.size}><path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 7H4c0-1 2-2 2-7Z"/><path d="M10 19a2 2 0 0 0 4 0"/></Icon>,
    search: (p: IconProps) => <Icon size={p.size}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></Icon>,
    logout: (p: IconProps) => <Icon size={p.size}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></Icon>,
};

// ─── Nav config ───────────────────────────────────────────────────
const NAV_ITEMS = [
    { key: 'dashboard', label: 'Dashboard', href: '/doctor/dashboard', icon: Icons.dashboard },
    { key: 'queue', label: 'Queue', href: '/doctor/queue', icon: Icons.queue },
    { key: 'patients', label: 'Patients', href: '/doctor/patients', icon: Icons.patients },
    { key: 'prescriptions', label: 'Prescriptions', href: '/doctor/prescriptions/create', icon: Icons.rx },
    { key: 'templates', label: 'Templates', href: '/doctor/templates', icon: Icons.template },
    { key: 'followups', label: 'Follow-ups', href: '/doctor/follow-ups', icon: Icons.followup },
    { key: 'statements', label: 'Statements', href: '/doctor/statements', icon: Icons.money },
    { key: 'reports', label: 'Reports', href: '/doctor/reports', icon: Icons.reports },
];

const NAV_SUPPORT = [
    { key: 'medicine-defaults', label: 'Medicine Settings', href: '/doctor/settings/medicine-defaults', icon: Icons.pill },
    { key: 'settings', label: 'Settings', href: '/doctor/settings', icon: Icons.settings },
];

// ─── Page title map ────────────────────────────────────────────────
const PAGE_TITLES: Record<string, { t: string; s: string }> = {
    '/doctor/dashboard': { t: 'Dashboard', s: 'Daily overview across your practice' },
    '/doctor/queue': { t: 'Patient queue', s: 'Manage today\'s serial queue' },
    '/doctor/patients': { t: 'Patients', s: 'Manage patient records' },
    '/doctor/prescriptions/create': { t: 'Write a prescription', s: 'Compose, validate, and sign in under 60 seconds' },
    '/doctor/templates': { t: 'Templates', s: 'Reusable prescription templates' },
    '/doctor/follow-ups': { t: 'Follow-ups', s: 'Scheduled follow-up reminders' },
    '/doctor/statements': { t: 'Statements', s: 'Daily earning statements' },
    '/doctor/reports': { t: 'Reports', s: 'Analytics and export' },
    '/doctor/settings': { t: 'Settings', s: 'Profile, preferences and password' },
    '/doctor/settings/medicine-defaults': { t: 'Medicine defaults', s: 'Per-medicine dose preferences' },
};

// ─── Sidebar ──────────────────────────────────────────────────────
function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) {
    const path = window.location.pathname;

    const isActive = (href: string) => {
        if (href === '/doctor/dashboard') return path === '/doctor/dashboard';
        return path.startsWith(href);
    };

    return (
        <aside className={'rx-sidebar' + (collapsed ? ' rx-collapsed' : '')}>
            <div className="rx-brand">
                <div className="rx-brand-mark">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M5 4h6.5a3.5 3.5 0 0 1 0 7H5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M5 4v16" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                        <path d="M5 11h4l7 9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
                {!collapsed && (
                    <div>
                        <div className="rx-brand-title">Pulse Rx</div>
                        <div className="rx-brand-sub">Clinic Edition</div>
                    </div>
                )}
            </div>

            <div className="rx-nav-section-label">Workspace</div>
            <nav className="rx-nav">
                {NAV_ITEMS.map(item => (
                    <Link
                        key={item.key}
                        href={item.href}
                        className={'rx-nav-item' + (isActive(item.href) ? ' rx-active' : '')}
                        title={collapsed ? item.label : undefined}
                    >
                        <item.icon size={18} />
                        {!collapsed && <span className="rx-nav-label-text">{item.label}</span>}
                        {!collapsed && isActive(item.href) && <span className="rx-nav-dot" />}
                    </Link>
                ))}
            </nav>

            <div className="rx-nav-section-label">Support</div>
            <nav className="rx-nav">
                {NAV_SUPPORT.map(item => (
                    <Link
                        key={item.key}
                        href={item.href}
                        className={'rx-nav-item' + (isActive(item.href) ? ' rx-active' : '')}
                        title={collapsed ? item.label : undefined}
                    >
                        <item.icon size={18} />
                        {!collapsed && <span className="rx-nav-label-text">{item.label}</span>}
                        {!collapsed && isActive(item.href) && <span className="rx-nav-dot" />}
                    </Link>
                ))}
            </nav>

            <div className="rx-sidebar-foot">
                {!collapsed && (
                    <div className="rx-upgrade-card">
                        <div className="rx-upgrade-title">e-Prescribing</div>
                        <div className="rx-upgrade-body">Digital prescription · sign & transmit</div>
                        <div className="rx-upgrade-status">
                            <span className="rx-dot-green" /> Connected
                        </div>
                    </div>
                )}
                <button className="rx-collapse-btn" onClick={() => setCollapsed(!collapsed)}>
                    <Icons.menu size={16} />
                    {!collapsed && <span>Collapse</span>}
                </button>
            </div>
        </aside>
    );
}

// ─── Topbar ───────────────────────────────────────────────────────
function Topbar({ doctorName, specialty }: { doctorName: string; specialty?: string }) {
    const path = window.location.pathname;
    const pageInfo = PAGE_TITLES[path] ?? { t: 'Doctor Panel', s: '' };
    const initials = doctorName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

    return (
        <header className="rx-topbar">
            <div className="rx-topbar-l">
                <div className="rx-page-title-t1">{pageInfo.t}</div>
                {pageInfo.s && <div className="rx-page-title-t2">{pageInfo.s}</div>}
            </div>
            <div className="rx-topbar-r">
                <div className="rx-search-wrap">
                    <Icons.search size={15} />
                    <input placeholder="Search patients, Rx, drugs…" />
                    <span className="rx-search-kbd">⌘K</span>
                </div>
                <div className="rx-icon-btn" style={{ position: 'relative' }}>
                    <Icons.bell size={18} />
                    <span className="rx-badge-dot" />
                </div>
                <Link href="/doctor/prescriptions/create" className="rx-btn-primary" style={{ textDecoration: 'none' }}>
                    <Icons.plus size={15} />
                    <span>New Rx</span>
                </Link>
                <div className="rx-doc-chip">
                    <div className="rx-doc-avatar">{initials}</div>
                    <div>
                        <div className="rx-doc-name">Dr. {doctorName}</div>
                        <div className="rx-doc-role">{specialty ?? 'Doctor'}</div>
                    </div>
                    <Icons.chevronDown size={13} />
                </div>
                <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className="rx-btn-ghost"
                    style={{ marginLeft: 4 }}
                >
                    <Icons.logout size={15} />
                </Link>
            </div>
        </header>
    );
}

// ─── Layout ───────────────────────────────────────────────────────
export default function DoctorLayout({ children }: PropsWithChildren) {
    const { auth } = usePage<PageProps>().props;
    const [collapsed, setCollapsed] = useState(false);
    const doctorName = auth.user.name;

    return (
        <div className={'rx-app' + (collapsed ? ' rx-collapsed' : '')}>
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
            <main className="rx-main">
                <Topbar doctorName={doctorName} />
                {children}
            </main>
        </div>
    );
}
