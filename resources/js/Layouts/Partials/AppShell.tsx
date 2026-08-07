import { Link } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState } from 'react';
import UserMenu from './UserMenu';

export type NavItem = {
    label: string;
    href: string;
    /** Emoji or node rendered before the label. */
    icon: ReactNode;
};

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
    navItems,
    /** Rendered in the header between the title and the account menu. */
    headerExtra,
    settingsHref,
    children,
}: PropsWithChildren<{
    title: ReactNode;
    navItems: NavItem[];
    headerExtra?: ReactNode;
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
        <div className="min-h-screen bg-gray-50">
            <header className="sticky top-0 z-30 flex h-14 items-center border-b bg-white px-4 shadow-sm">
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                    className="mr-4 rounded p-1 hover:bg-gray-100"
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                <h1 className="truncate text-lg font-semibold text-gray-800">{title}</h1>

                {headerExtra}

                <div className="ml-auto flex items-center gap-3">
                    <UserMenu settingsHref={settingsHref} />
                </div>
            </header>

            <div className="flex">
                <aside
                    className={`${
                        sidebarOpen ? 'w-60' : 'w-0 overflow-hidden'
                    } sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto border-r bg-white transition-all duration-200`}
                >
                    <nav className="space-y-1 p-3">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                                    item.href === activeHref
                                        ? 'bg-blue-50 font-medium text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <span className="flex-none">{item.icon}</span>
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </aside>

                <main className="min-w-0 flex-1 p-6">{children}</main>
            </div>
        </div>
    );
}
