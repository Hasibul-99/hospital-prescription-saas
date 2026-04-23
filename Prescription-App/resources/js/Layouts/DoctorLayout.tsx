import { Link, router, usePage } from '@inertiajs/react';
import { PropsWithChildren, useState } from 'react';
import { PageProps, Patient } from '@/types';
import PatientSearch from '@/Components/PatientSearch';
import NotificationBell from '@/Components/Notifications/NotificationBell';

const navItems = [
    { label: 'Dashboard', href: '/doctor/dashboard', icon: '📊' },
    { label: 'Queue', href: '/doctor/queue', icon: '📋' },
    { label: 'Patients', href: '/doctor/patients', icon: '🧑' },
    { label: 'Prescriptions', href: '/doctor/prescriptions', icon: '💊' },
    { label: 'Templates', href: '/doctor/templates', icon: '📄' },
    { label: 'Follow-ups', href: '/doctor/follow-ups', icon: '🔔' },
    { label: 'Statements', href: '/doctor/statements', icon: '💰' },
    { label: 'Medicine Settings', href: '/doctor/settings/medicine-defaults', icon: '💉' },
];

export default function DoctorLayout({ children }: PropsWithChildren) {
    const { auth } = usePage<PageProps>().props;
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const currentPath = window.location.pathname;

    return (
        <div className="min-h-screen bg-gray-50">
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
                    {auth.user.hospital?.name ?? 'Hospital'} — Doctor Panel
                </h1>

                <PatientSearch
                    onSelect={(p: Patient) => router.visit(`/doctor/patients/${p.id}`)}
                    placeholder="Search patients..."
                    className="ml-6 hidden w-64 md:block"
                />

                <div className="ml-auto flex items-center gap-4">
                    <NotificationBell />
                    <span className="text-sm text-gray-600">Dr. {auth.user.name}</span>
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

                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    );
}
