import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, useState } from 'react';
import { PageProps } from '@/types';

const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
    { label: 'Hospitals', href: '/admin/hospitals', icon: '🏥' },
    { label: 'Users', href: '/admin/users', icon: '👥' },
    { label: 'Medicines', href: '/admin/medicines', icon: '💊' },
    { label: 'Medicine Requests', href: '/admin/medicine-requests', icon: '📝' },
    { label: 'Complaints', href: '/admin/complaints', icon: '🩺' },
];

export default function AdminLayout({ children }: PropsWithChildren) {
    const { auth } = usePage<PageProps>().props;
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const currentPath = window.location.pathname;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Header */}
            <header className="sticky top-0 z-30 flex h-14 items-center border-b bg-white px-4 shadow-sm">
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="mr-4 rounded p-1 hover:bg-gray-100"
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                <h1 className="text-lg font-semibold text-gray-800">
                    Prescription Software — Super Admin
                </h1>

                <div className="ml-auto flex items-center gap-4">
                    <span className="text-sm text-gray-600">{auth.user.name}</span>
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="rounded bg-red-50 px-3 py-1 text-sm text-red-600 hover:bg-red-100"
                    >
                        Logout
                    </Link>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside
                    className={`${
                        sidebarOpen ? 'w-60' : 'w-0 overflow-hidden'
                    } sticky top-14 h-[calc(100vh-3.5rem)] border-r bg-white transition-all duration-200`}
                >
                    <nav className="space-y-1 p-3">
                        {navItems.map((item) => {
                            const isActive = currentPath.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                                        isActive
                                            ? 'bg-blue-50 font-medium text-blue-700'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <span>{item.icon}</span>
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    );
}
