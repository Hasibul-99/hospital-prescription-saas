import { Link } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState } from 'react';
import { Tooltip } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import UserMenu from './UserMenu';

export type NavItem = {
    label: string;
    href: string;
    /** Emoji or node rendered before the label. */
    icon: ReactNode;
};

/** The Rx mark, matching the one on the landing page and auth screens. */
function BrandMark() {
    return (
        <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-gradient-to-br from-teal-600 to-teal-900 shadow-sm">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                    d="M5 4h6.5a3.5 3.5 0 0 1 0 7H5M5 4v16M5 11h4l7 9"
                    stroke="white"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </span>
    );
}

/**
 * The sticky-header + collapsible-sidebar shell shared by the super admin,
 * hospital admin and receptionist areas.
 *
 * Those three were three near-identical copies of this markup that drifted —
 * only one had a language switcher, none had a link to the profile page. The
 * role layouts are now just configuration over this component.
 *
 * DoctorLayout deliberately does NOT use this: it has its own denser, bespoke
 * chrome (custom icon set, page-title bar, collapsed rail) that is a different
 * design rather than a variation of this one.
 */
export default function AppShell({
    title,
    /** Small line under the title — the area or role, e.g. "Reception". */
    subtitle,
    navItems,
    /** Centre slot, e.g. a patient search box. Hidden below `md`. */
    search,
    /** Right slot rendered before the account menu — language, notifications. */
    actions,
    settingsHref,
    children,
}: PropsWithChildren<{
    title: ReactNode;
    subtitle?: ReactNode;
    navItems: NavItem[];
    search?: ReactNode;
    actions?: ReactNode;
    settingsHref?: string;
}>) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const currentPath = typeof window === 'undefined' ? '' : window.location.pathname;

    /**
     * Longest-prefix match, so `/hospital/templates/analytics` highlights the
     * analytics entry rather than both it and `/hospital/templates`.
     */
    const activeHref = navItems
        .filter((item) => currentPath === item.href || currentPath.startsWith(item.href + '/'))
        .sort((a, b) => b.href.length - a.href.length)[0]?.href;

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-white/70">
                <Tooltip title={sidebarOpen ? 'Collapse menu' : 'Expand menu'} placement="bottomLeft">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                        aria-expanded={sidebarOpen}
                        className="grid h-9 w-9 flex-none place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    >
                        {sidebarOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
                    </button>
                </Tooltip>

                <BrandMark />

                <div className="min-w-0 flex-none">
                    <h1 className="truncate text-[15px] font-semibold leading-tight text-slate-900">{title}</h1>
                    {subtitle && (
                        <p className="truncate text-[11px] leading-tight text-slate-500">{subtitle}</p>
                    )}
                </div>

                {/* Centre slot. flex-1 keeps it out of the way of both ends, so
                    layouts no longer need their own ml-auto spacers. */}
                <div className="hidden min-w-0 flex-1 justify-center px-4 md:flex">
                    <div className="w-full max-w-sm">{search}</div>
                </div>

                <div className="ml-auto flex flex-none items-center gap-1 md:ml-0">
                    {actions}
                    <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />
                    <UserMenu settingsHref={settingsHref} />
                </div>
            </header>

            <div className="flex">
                <aside
                    className={`${
                        sidebarOpen ? 'w-60' : 'w-0 overflow-hidden'
                    } sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-r border-slate-200/80 bg-white transition-all duration-200`}
                >
                    <nav className="space-y-0.5 p-3">
                        {navItems.map((item) => {
                            const isActive = item.href === activeHref;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                                        isActive
                                            ? 'bg-teal-50 font-medium text-teal-800'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                >
                                    {/* Active rail — a clearer signal than colour alone. */}
                                    <span
                                        className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-teal-600 transition-opacity ${
                                            isActive ? 'opacity-100' : 'opacity-0'
                                        }`}
                                    />
                                    <span className="flex-none text-base leading-none">{item.icon}</span>
                                    <span className="truncate">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                <main className="min-w-0 flex-1 p-6">{children}</main>
            </div>
        </div>
    );
}
