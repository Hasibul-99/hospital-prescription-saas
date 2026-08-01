import AdminLayout from '@/Layouts/AdminLayout';
import { Hospital, PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';

interface Doctor {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    doctor_profile?: { specialty?: string; bmdc_number?: string };
}

interface Props extends PageProps {
    hospital: Hospital & { doctors_count: number; patients_count: number; prescriptions_count: number };
    doctors: Doctor[];
}

const PLAN_COLORS: Record<string, string> = {
    free: 'bg-gray-100 text-gray-700',
    basic: 'bg-blue-50 text-blue-700',
    premium: 'bg-purple-50 text-purple-700',
    enterprise: 'bg-amber-50 text-amber-700',
};

const STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-50 text-green-700',
    trial: 'bg-sky-50 text-sky-700',
    expired: 'bg-red-50 text-red-700',
    suspended: 'bg-orange-50 text-orange-700',
};

function Badge({ value, map }: { value: string; map: Record<string, string> }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${map[value] ?? 'bg-gray-100 text-gray-600'}`}>
            {value}
        </span>
    );
}

function Stat({ label, value }: { label: string; value: number | string }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
        </div>
    );
}

export default function Show({ hospital, doctors }: Props) {
    return (
        <AdminLayout>
            <Head title={hospital.name} />

            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href={route('admin.hospitals.index')} className="text-gray-400 hover:text-gray-600">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
                        </svg>
                    </Link>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{hospital.name}</h2>
                        <div className="mt-1 flex items-center gap-2">
                            <Badge value={hospital.subscription_plan} map={PLAN_COLORS} />
                            <Badge value={hospital.subscription_status} map={STATUS_COLORS} />
                            {!hospital.is_active && (
                                <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">Inactive</span>
                            )}
                        </div>
                    </div>
                </div>
                <Link
                    href={route('admin.hospitals.edit', hospital.id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Edit
                </Link>
            </div>

            {/* Stats */}
            <div className="mb-6 grid grid-cols-3 gap-4">
                <Stat label="Doctors" value={`${hospital.doctors_count} / ${hospital.max_doctors}`} />
                <Stat label="Patients" value={hospital.patients_count} />
                <Stat label="Prescriptions" value={hospital.prescriptions_count} />
            </div>

            {/* Details card */}
            <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold text-gray-700">Hospital Details</h3>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    {[
                        ['Phone', hospital.phone],
                        ['Email', hospital.email],
                        ['Website', hospital.website],
                        ['Address', hospital.address],
                        ['Max Patients/Month', hospital.max_patients_per_month],
                        ['Trial ends', hospital.trial_ends_at ? new Date(hospital.trial_ends_at).toLocaleDateString() : '—'],
                        ['Created', new Date(hospital.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })],
                    ].map(([label, value]) => value ? (
                        <div key={label as string} className="flex gap-2">
                            <dt className="w-40 flex-shrink-0 text-gray-500">{label}</dt>
                            <dd className="text-gray-900 truncate">{value as string}</dd>
                        </div>
                    ) : null)}
                </dl>
            </div>

            {/* Doctors table */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700">Doctors ({doctors.length})</h3>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2.5 font-medium text-gray-600">Name</th>
                            <th className="px-4 py-2.5 font-medium text-gray-600">Email</th>
                            <th className="px-4 py-2.5 font-medium text-gray-600">Specialty</th>
                            <th className="px-4 py-2.5 font-medium text-gray-600">BMDC</th>
                            <th className="px-4 py-2.5 font-medium text-gray-600">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {doctors.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No doctors yet.</td>
                            </tr>
                        ) : doctors.map(doc => (
                            <tr key={doc.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2.5 font-medium text-gray-900">Dr. {doc.name}</td>
                                <td className="px-4 py-2.5 text-gray-500">{doc.email}</td>
                                <td className="px-4 py-2.5 text-gray-600">{doc.doctor_profile?.specialty ?? '—'}</td>
                                <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{doc.doctor_profile?.bmdc_number ?? '—'}</td>
                                <td className="px-4 py-2.5">
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${doc.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {doc.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
