import DoctorLayout from '@/Layouts/DoctorLayout';
import FlashMessage from '@/Components/Common/FlashMessage';
import { Link, router } from '@inertiajs/react';
import { Patient } from '@/types';
import { ReactNode, useState } from 'react';

type RecallStatus = 'pending' | 'contacted' | 'unreachable' | 'completed';

interface FollowUpRow {
    id: number;
    prescription_uid: string;
    original_date: string;
    follow_up_date: string;
    patient: Patient;
    status: 'overdue' | 'due' | 'upcoming';
    has_booking: boolean;
    contact_attempts: number;
    last_contact_at: string | null;
    recall_status: RecallStatus;
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

function recallBadge(s: RecallStatus) {
    if (s === 'contacted') return 'bg-emerald-50 text-emerald-700 border-emerald-300';
    if (s === 'unreachable') return 'bg-orange-50 text-orange-700 border-orange-300';
    if (s === 'completed') return 'bg-blue-50 text-blue-700 border-blue-300';
    return 'bg-gray-50 text-gray-500 border-gray-200';
}

export default function Index({ follow_ups, filters }: Props) {
    const [from, setFrom] = useState(filters.date_from);
    const [to, setTo] = useState(filters.date_to);
    const [selected, setSelected] = useState<Set<number>>(new Set());

    function apply() {
        router.get('/doctor/follow-ups', { date_from: from, date_to: to }, { preserveState: true, replace: true });
    }

    function toggleRow(id: number) {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    function toggleAll() {
        if (selected.size === follow_ups.length) setSelected(new Set());
        else setSelected(new Set(follow_ups.map((f) => f.id)));
    }

    function bulkMark(status: 'contacted' | 'unreachable' | 'completed') {
        if (selected.size === 0) return;
        router.post(
            '/doctor/follow-ups/bulk-mark',
            { ids: Array.from(selected), status },
            {
                preserveScroll: true,
                onSuccess: () => setSelected(new Set()),
            },
        );
    }

    const allSelected = follow_ups.length > 0 && selected.size === follow_ups.length;
    const someSelected = selected.size > 0;

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

            {someSelected && (
                <div className="mb-3 flex flex-wrap items-center gap-2 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm">
                    <span className="font-medium text-blue-800">{selected.size} selected</span>
                    <div className="ml-auto flex flex-wrap gap-2">
                        <button
                            onClick={() => bulkMark('contacted')}
                            className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                        >
                            Mark as contacted
                        </button>
                        <button
                            onClick={() => bulkMark('unreachable')}
                            className="rounded bg-orange-600 px-3 py-1 text-xs font-medium text-white hover:bg-orange-700"
                        >
                            Mark unreachable
                        </button>
                        <button
                            onClick={() => bulkMark('completed')}
                            className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                        >
                            Mark completed
                        </button>
                        <button
                            disabled
                            title="Requires SMS gateway configuration"
                            className="rounded bg-gray-200 px-3 py-1 text-xs font-medium text-gray-500 cursor-not-allowed"
                        >
                            Send SMS reminder
                        </button>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto rounded-lg bg-white shadow">
                <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-3 py-3 w-8">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={toggleAll}
                                    aria-label="Select all"
                                />
                            </th>
                            <th className="px-4 py-3">Patient</th>
                            <th className="px-4 py-3">Original Rx</th>
                            <th className="px-4 py-3">Follow-up Due</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Recall</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {follow_ups.length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">No follow-ups in this range.</td></tr>
                        ) : follow_ups.map((f) => (
                            <tr key={f.id} className={`border-b last:border-0 hover:bg-gray-50 ${f.status === 'overdue' ? 'bg-red-50/30' : ''}`}>
                                <td className="px-3 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selected.has(f.id)}
                                        onChange={() => toggleRow(f.id)}
                                        aria-label={`Select ${f.patient.name}`}
                                    />
                                </td>
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
                                    <span className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${recallBadge(f.recall_status)}`}>{f.recall_status}</span>
                                    {f.contact_attempts > 0 && (
                                        <div className="mt-1 text-[10px] text-gray-500">{f.contact_attempts} attempt{f.contact_attempts === 1 ? '' : 's'}</div>
                                    )}
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
