import { router, usePage } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import { PageProps, Patient } from '@/types';
import AppShell, { NavItem } from './Partials/AppShell';
import PatientSearch from '@/Components/Patient/PatientSearch';
import LanguageSwitcher from '@/Components/Common/LanguageSwitcher';

const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/receptionist/dashboard', icon: '📊' },
    { label: 'Queue', href: '/receptionist/queue', icon: '📋' },
    { label: 'Patients', href: '/receptionist/patients', icon: '🧑' },
    { label: 'Appointments', href: '/receptionist/appointments', icon: '📅' },
];

export default function ReceptionistLayout({ children }: PropsWithChildren) {
    const { auth } = usePage<PageProps>().props;

    return (
        <AppShell
            title={`${auth.user.hospital?.name ?? 'Hospital'} — Reception`}
            navItems={navItems}
            headerExtra={
                <>
                    <PatientSearch
                        onSelect={(p: Patient) => router.visit(`/receptionist/patients/${p.id}`)}
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
