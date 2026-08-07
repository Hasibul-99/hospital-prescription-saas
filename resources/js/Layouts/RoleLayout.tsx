import { usePage } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import { PageProps } from '@/types';
import AdminLayout from './AdminLayout';
import DoctorLayout from './DoctorLayout';
import HospitalLayout from './HospitalLayout';
import ReceptionistLayout from './ReceptionistLayout';

/**
 * Wraps a page in whichever role layout the signed-in user belongs to.
 *
 * For pages every role can reach — /profile being the only one today — so the
 * user keeps their own navigation instead of being dropped into a foreign
 * chrome. This replaced the Breeze AuthenticatedLayout, which showed the same
 * generic shell to everyone and was the only place linking to the profile page
 * at all.
 */
export default function RoleLayout({ children }: PropsWithChildren) {
    const { auth } = usePage<PageProps>().props;

    switch (auth?.user?.role) {
        case 'super_admin':
            return <AdminLayout>{children}</AdminLayout>;
        case 'hospital_admin':
            return <HospitalLayout>{children}</HospitalLayout>;
        case 'doctor':
            return <DoctorLayout>{children}</DoctorLayout>;
        case 'receptionist':
            return <ReceptionistLayout>{children}</ReceptionistLayout>;
        default:
            // Unreachable behind `auth` middleware, but a bare frame beats a
            // blank screen if a role is ever added without a layout.
            return <div className="min-h-screen bg-gray-50 p-6">{children}</div>;
    }
}
