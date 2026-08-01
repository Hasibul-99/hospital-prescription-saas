import { Head, Link } from '@inertiajs/react';
import ReceptionistLayout from '@/Layouts/ReceptionistLayout';

interface QueueRow {
    id: number;
    serial_number: number;
    patient_name: string;
    patient_uid: string;
    doctor_name: string;
    status: string;
}

interface Props {
    stats: {
        appointments_today: number;
        waiting: number;
        in_progress: number;
        completed: number;
        patients_today: number;
        active_doctors: number;
    };
    queue: QueueRow[];
    today_label: string;
}

function statusClass(s: string): string {
    switch (s) {
        case 'waiting': return 'bg-gray-100 text-gray-700';
        case 'in_progress': return 'bg-blue-100 text-blue-700';
        case 'completed': return 'bg-green-100 text-green-700';
        case 'absent': return 'bg-red-100 text-red-700 line-through';
        case 'cancelled': return 'bg-red-50 text-red-500 line-through';
        default: return 'bg-gray-100 text-gray-500';
    }
}

const cards: { key: keyof Props['stats']; label: string; accent: string }[] = [
    { key: 'appointments_today', label: "Today's appointments", accent: 'text-teal-600' },
    { key: 'waiting', label: 'Waiting', accent: 'text-amber-600' },
    { key: 'in_progress', label: 'In progress', accent: 'text-blue-600' },
    { key: 'completed', label: 'Completed', accent: 'text-green-600' },
    { key: 'patients_today', label: 'New patients today', accent: 'text-indigo-600' },
    { key: 'active_doctors', label: 'Active doctors', accent: 'text-gray-700' },
];

export default function Dashboard({ stats, queue, today_label }: Props) {
    return (
        <ReceptionistLayout>
            <Head title="Reception Dashboard" />

            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">Reception Dashboard</h2>
                        <p className="text-sm text-gray-500">{today_label}</p>
                    </div>
                    <Link
                        href="/receptionist/queue"
                        className="rounded bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
                    >
                        Open queue
                    </Link>
                </div>

                <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                    {cards.map((c) => (
                        <div key={c.key} className="rounded-lg border bg-white p-4 shadow-sm">
                            <div className={`text-2xl font-bold ${c.accent}`}>{stats[c.key]}</div>
                            <div className="mt-1 text-xs text-gray-500">{c.label}</div>
                        </div>
                    ))}
                </div>

                <div className="rounded-lg border bg-white shadow-sm">
                    <div className="border-b px-4 py-3">
                        <h3 className="text-sm font-semibold text-gray-700">Today's queue</h3>
                    </div>
                    {queue.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-gray-400">No appointments today.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-xs uppercase text-gray-400">
                                    <th className="px-4 py-2">#</th>
                                    <th className="px-4 py-2">Patient</th>
                                    <th className="px-4 py-2">Doctor</th>
                                    <th className="px-4 py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {queue.map((row) => (
                                    <tr key={row.id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="px-4 py-2 font-medium text-gray-700">{row.serial_number}</td>
                                        <td className="px-4 py-2">
                                            <div className="text-gray-800">{row.patient_name}</div>
                                            <div className="text-xs text-gray-400">{row.patient_uid}</div>
                                        </td>
                                        <td className="px-4 py-2 text-gray-600">{row.doctor_name}</td>
                                        <td className="px-4 py-2">
                                            <span className={`rounded px-2 py-0.5 text-xs ${statusClass(row.status)}`}>
                                                {row.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </ReceptionistLayout>
    );
}
