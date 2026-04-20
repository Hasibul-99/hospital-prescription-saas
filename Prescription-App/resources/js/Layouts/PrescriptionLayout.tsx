import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import { PageProps } from '@/types';

export default function PrescriptionLayout({ children }: PropsWithChildren) {
    const { auth } = usePage<PageProps>().props;

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="sticky top-0 z-30 flex h-12 items-center border-b bg-white px-4 shadow-sm">
                <Link href="/doctor/queue" className="text-sm text-gray-600 hover:text-gray-900">
                    ← Back to Queue
                </Link>
                <h1 className="ml-6 text-base font-semibold text-gray-800">Prescription Builder</h1>
                <span className="ml-auto text-sm text-gray-600">Dr. {auth.user.name}</span>
            </header>
            <main>{children}</main>
        </div>
    );
}
