import HospitalLayout from '@/Layouts/HospitalLayout';
import { Link } from '@inertiajs/react';
import { Patient, Appointment, Prescription } from '@/types';
import { ReactNode, useState } from 'react';

interface Props {
    patient: Patient & {
        appointments: Appointment[];
        prescriptions: Prescription[];
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
    const [tab, setTab] = useState<'visits' | 'prescriptions'>('visits');

    const timeline = [
        ...(patient.appointments || []).map((a) => ({ type: 'appointment' as const, date: a.appointment_date, data: a })),
        ...(patient.prescriptions || []).map((rx) => ({ type: 'prescription' as const, date: rx.date, data: rx })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
                <Link href={`/hospital/patients/${patient.id}/edit`} className="rounded bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200">Edit Info</Link>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-lg bg-white p-4 shadow">
                    <p className="text-xs text-gray-500">Registered</p>
                    <p className="mt-1 font-medium text-gray-800">{new Date(patient.created_at).toLocaleDateString()}</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow">
                    <p className="text-xs text-gray-500">Total Visits</p>
                    <p className="mt-1 text-lg font-bold text-gray-800">{patient.appointments?.length ?? 0}</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow">
                    <p className="text-xs text-gray-500">Prescriptions</p>
                    <p className="mt-1 text-lg font-bold text-gray-800">{patient.prescriptions?.length ?? 0}</p>
                </div>
                {patient.address && (
                    <div className="rounded-lg bg-white p-4 shadow">
                        <p className="text-xs text-gray-500">Address</p>
                        <p className="mt-1 text-sm text-gray-800">{patient.address}</p>
                    </div>
                )}
            </div>

            <div className="mb-4 flex gap-4 border-b">
                <button onClick={() => setTab('visits')} className={`border-b-2 pb-2 text-sm font-medium ${tab === 'visits' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Visit History</button>
                <button onClick={() => setTab('prescriptions')} className={`border-b-2 pb-2 text-sm font-medium ${tab === 'prescriptions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Prescriptions</button>
            </div>

            {tab === 'visits' && (
                <div className="rounded-lg bg-white shadow">
                    {timeline.length === 0 ? (
                        <p className="p-6 text-center text-sm text-gray-500">No visit history yet</p>
                    ) : (
                        <div className="divide-y">
                            {timeline.map((entry, i) => (
                                <div key={i} className="flex items-center gap-4 px-4 py-3">
                                    <div className={`h-2 w-2 rounded-full ${entry.type === 'prescription' ? 'bg-blue-500' : 'bg-green-500'}`} />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-800">
                                            {entry.type === 'prescription' ? `Prescription: ${(entry.data as Prescription).prescription_uid}` : `Appointment #${(entry.data as Appointment).serial_number}`}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(entry.date).toLocaleDateString()}
                                            {(entry.data as any).doctor && ` - Dr. ${(entry.data as any).doctor.name}`}
                                        </p>
                                    </div>
                                    {entry.type === 'appointment' && (
                                        <span className={`rounded px-2 py-0.5 text-xs ${(entry.data as Appointment).status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {(entry.data as Appointment).status}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {tab === 'prescriptions' && (
                <div className="rounded-lg bg-white shadow">
                    {(!patient.prescriptions || patient.prescriptions.length === 0) ? (
                        <p className="p-6 text-center text-sm text-gray-500">No prescriptions yet</p>
                    ) : (
                        <div className="divide-y">
                            {patient.prescriptions.map((rx) => (
                                <div key={rx.id} className="flex items-center justify-between px-4 py-3">
                                    <div>
                                        <p className="text-sm font-medium text-blue-600">{rx.prescription_uid}</p>
                                        <p className="text-xs text-gray-500">{new Date(rx.date).toLocaleDateString()}{rx.doctor && ` - Dr. ${rx.doctor.name}`}</p>
                                    </div>
                                    <span className={`rounded px-2 py-0.5 text-xs ${rx.status === 'finalized' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{rx.status}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

Show.layout = (page: ReactNode) => <HospitalLayout>{page}</HospitalLayout>;
