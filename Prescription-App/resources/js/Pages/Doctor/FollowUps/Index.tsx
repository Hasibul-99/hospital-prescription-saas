import DoctorLayout from '@/Layouts/DoctorLayout';
import FlashMessage from '@/Components/FlashMessage';
import { Link, router } from '@inertiajs/react';
import { Patient } from '@/types';
import { ReactNode, useState } from 'react';

interface FollowUpRow {
    id: number;
    prescription_uid: string;
    original_date: string;
    follow_up_date: string;
    patient: Patient;
    status: 'overdue' | 'due' | 'upcoming';
    has_booking: boolean;
}

interface Props {
    follow_ups: FollowUpRow[];
    filters: { date_from: string; date_to: string };
}

function statusBadge(s: string) {
    if (s === 'overdue') return 'bg-red-100 text-red-700 border-red-300';
    if (s === 'due') return 'bg-amber-100 text-amber-700 border-amber-300';
    return 'bg-gray-100 text-gray-600 border-gray-300';
}

export default function Index({ follow_ups, filters }: Props) {
    const [from, setFrom] = useState(filters.date_from);
    const [to, setTo] = useState(filters.date_to);

    function apply() {
        router.get('/doctor/follow-ups', { date_from: from, date_to: to }, { preserveState: true, replace: true });
    }

    return (
        <>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Follow-ups</h2>
            </div>

            <FlashMessage />

            <div className="mb-3 flex flex-wrap items-end gap-2 rounded bg-white p-3 text-sm shadow-sm">
                <div>
                    <label className="block text-xs text-gray-500">From</label>
                    <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded border border-gray-300 px-2 py-1" />
                </div>
                <div>
                    <label className="block text-xs text-gray-500">To</label>
                    <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded border border-gray-300 px-2 py-1" />
                </div>
                <button onClick={apply} className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700">Apply</button>
            </div>

            <div className="overflow-x-auto rounded-lg bg-white shadow">
                <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">Patient</th>
                            <th className="px-4 py-3">Original Rx</th>
                            <th className="px-4 py-3">Follow-up Due</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {follow_ups.length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No follow-ups in this range.</td></tr>
                        ) : follow_ups.map((f) => (
                            <tr key={f.id} className={`border-b last:border-0 hover:bg-gray-50 ${f.status === 'overdue' ? 'bg-red-50/30' : ''}`}>
                                <td className="px-4 py-3">
                                    <div className="font-medium">{f.patient.name}</div>
                                    <div className="text-xs text-gray-500">{f.patient.patient_uid} · {f.patient.phone}</div>
                                </td>
                                <td className="px-4 py-3 text-xs">
                                    <div className="font-mono text-blue-600">{f.prescription_uid}</div>
                                    <div className="text-gray-500">{f.original_date}</div>
                                </td>
                                <td className="px-4 py-3 text-gray-700">{f.follow_up_date}</td>
                                <td className="px-4 py-3">
                                    <span className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${statusBadge(f.status)}`}>{f.status}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2 text-xs">
                                        <Link href={`/doctor/patients/${f.patient.id}`} className="rounded bg-gray-100 px-2 py-1 text-gray-700 hover:bg-gray-200">View Patient</Link>
                                        <Link
                                            href={`/doctor/prescriptions/create?patient_id=${f.patient.id}`}
                                            className="rounded bg-blue-50 px-2 py-1 text-blue-700 hover:bg-blue-100"
                                        >
                                            New Rx
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

Index.layout = (page: ReactNode) => <DoctorLayout>{page}</DoctorLayout>;
