import { PropsWithChildren } from 'react';
import AppShell, { NavItem } from './Partials/AppShell';
import LanguageSwitcher from '@/Components/Common/LanguageSwitcher';

const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
    { label: 'Hospitals', href: '/admin/hospitals', icon: '🏥' },
    { label: 'Plans', href: '/admin/plans', icon: '💳' },
    { label: 'Users', href: '/admin/users', icon: '👥' },
    { label: 'Medicines', href: '/admin/medicines', icon: '💊' },
    { label: 'Medicine Requests', href: '/admin/medicine-requests', icon: '📝' },
    { label: 'Complaints', href: '/admin/complaints', icon: '🩺' },
    { label: 'Reports', href: '/admin/reports', icon: '📈' },
    { label: 'Audit Logs', href: '/admin/audit-logs', icon: '🛡️' },
    { label: 'Settings', href: '/admin/settings', icon: '⚙️' },
];

export default function AdminLayout({ children }: PropsWithChildren) {
    return (
        <AppShell
            title="Prescription Software — Super Admin"
            navItems={navItems}
            settingsHref="/admin/settings"
            headerExtra={
                <div className="ml-auto pr-3">
                    <LanguageSwitcher />
                </div>
            }
        >
            {children}
        </AppShell>
    );
}
