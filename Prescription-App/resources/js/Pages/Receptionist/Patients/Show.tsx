import ReceptionistLayout from '@/Layouts/ReceptionistLayout';
import { Link } from '@inertiajs/react';
import { Patient, Appointment } from '@/types';
import { ReactNode } from 'react';

interface Props {
    patient: Patient & {
        appointments: Appointment[];
    };
}

function ageDisplay(p: Patient): string {
    const parts = [];
    if (p.age_years) parts.push(`${p.age_years}Y`);
    if (p.age_months) parts.push(`${p.age_months}M`);
    if (p.age_days) parts.push(`${p.age_days}D`);
    return parts.join(' ') || 'N/A';
}

export default function Show({ patient }: Props) {
    return (
        <>
            <div className="mb-6 flex items-start justify-between">
                <div className="flex items-center gap-4">
                    {patient.profile_image ? (
                        <img src={`/storage/${patient.profile_image}`} alt={patient.name} className="h-16 w-16 rounded-full object-cover" />
                    ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">{patient.name.charAt(0)}</div>
                    )}
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">{patient.name}</h2>
                        <p className="text-sm text-gray-500">
                            {patient.patient_uid} &middot; {ageDisplay(patient)} / {patient.gender?.charAt(0).toUpperCase()}
                            {patient.blood_group && <> &middot; {patient.blood_group}</>}
                        </p>
                        <p className="text-sm text-gray-500">{patient.phone}</p>
                    </div>
                </div>
                <Link href={`/receptionist/patients/${patient.id}/edit`} className="rounded bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200">Edit Info</Link>
            </div>

            {/* Info cards */}
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-white p-4 shadow">
                    <p className="text-xs text-gray-500">Registered</p>
                    <p className="mt-1 font-medium text-gray-800">{new Date(patient.created_at).toLocaleDateString()}</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow">
                    <p className="text-xs text-gray-500">Total Visits</p>
                    <p className="mt-1 text-lg font-bold text-gray-800">{patient.appointments?.length ?? 0}</p>
                </div>
                {patient.address && (
                    <div className="rounded-lg bg-white p-4 shadow">
                        <p className="text-xs text-gray-500">Address</p>
                        <p className="mt-1 text-sm text-gray-800">{patient.address}</p>
                    </div>
                )}
            </div>

            {/* Appointments only — no prescriptions for receptionist */}
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Appointment History</h3>
            <div className="rounded-lg bg-white shadow">
                {(!patient.appointments || patient.appointments.length === 0) ? (
                    <p className="p-6 text-center text-sm text-gray-500">No appointments yet</p>
                ) : (
                    <div className="divide-y">
                        {patient.appointments.map((a) => (
                            <div key={a.id} className="flex items-center justify-between px-4 py-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-800">
                                        #{a.serial_number} &middot; {new Date(a.appointment_date).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {a.doctor && `Dr. ${a.doctor.name}`} &middot; {a.type.replace('_', ' ')}
                                    </p>
                                </div>
                                <span className={`rounded px-2 py-0.5 text-xs ${
                                    a.status === 'completed' ? 'bg-green-100 text-green-700'
                                    : a.status === 'waiting' ? 'bg-gray-100 text-gray-700'
                                    : a.status === 'in_progress' ? 'bg-blue-100 text-blue-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                    {a.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

Show.layout = (page: ReactNode) => <ReceptionistLayout>{page}</ReceptionistLayout>;
