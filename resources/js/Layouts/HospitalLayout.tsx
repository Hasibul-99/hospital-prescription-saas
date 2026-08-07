import { router, usePage } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import { PageProps, Patient } from '@/types';
import AppShell, { NavItem } from './Partials/AppShell';
import PatientSearch from '@/Components/Patient/PatientSearch';
import LanguageSwitcher from '@/Components/Common/LanguageSwitcher';

const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/hospital/dashboard', icon: '📊' },
    { label: 'Doctors', href: '/hospital/doctors', icon: '👨‍⚕️' },
    { label: 'Receptionists', href: '/hospital/receptionists', icon: '🧑‍💼' },
    { label: 'Patients', href: '/hospital/patients', icon: '🧑' },
    { label: 'Chambers', href: '/hospital/chambers', icon: '🚪' },
    { label: 'Holidays', href: '/hospital/holidays', icon: '📅' },
    { label: 'Global Templates', href: '/hospital/templates', icon: '📑' },
    { label: 'Template Analytics', href: '/hospital/templates/analytics', icon: '📈' },
    { label: 'Reports', href: '/hospital/reports', icon: '📊' },
    { label: 'Audit Logs', href: '/hospital/audit-logs', icon: '🛡️' },
    { label: 'Settings', href: '/hospital/settings', icon: '⚙️' },
];

export default function HospitalLayout({ children }: PropsWithChildren) {
    const { auth } = usePage<PageProps>().props;

    return (
        <AppShell
            title={`${auth.user.hospital?.name ?? 'Hospital'} — Admin`}
            navItems={navItems}
            settingsHref="/hospital/settings"
            headerExtra={
                <>
                    <PatientSearch
                        onSelect={(p: Patient) => router.visit(`/hospital/patients/${p.id}`)}
                        placeholder="Search patients..."
                        className="ml-6 hidden w-64 md:block"
                    />
                    <div className="ml-auto pr-3">
                        <LanguageSwitcher />
                    </div>
                </>
            }
        >
            {children}
        </AppShell>
    );
}
