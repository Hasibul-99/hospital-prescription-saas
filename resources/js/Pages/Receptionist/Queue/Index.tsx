import ReceptionistLayout from '@/Layouts/ReceptionistLayout';
import FlashMessage from '@/Components/FlashMessage';
import AppointmentModal from '@/Components/AppointmentModal';
import { Link, router } from '@inertiajs/react';
import { Appointment, Chamber, HospitalHoliday, QueueStats, User } from '@/types';
import { ReactNode, useEffect, useState } from 'react';

interface Props {
    date: string;
    doctor_id: number | null;
    chamber_id: number | null;
    doctors: Pick<User, 'id' | 'name'>[];
    chambers: Chamber[];
    queue: Appointment[];
    stats: QueueStats | null;
    on_break: boolean;
    holiday: HospitalHoliday | null;
}

function ageStr(p: any): string {
    const parts = [];
    if (p?.age_years) parts.push(`${p.age_years}Y`);
    if (p?.age_months) parts.push(`${p.age_months}M`);
    if (p?.age_days) parts.push(`${p.age_days}D`);
    return parts.join(' ') || 'N/A';
}

function statusClass(s: string) {
    switch (s) {
        case 'waiting': return 'bg-gray-100 text-gray-700';
        case 'in_progress': return 'bg-blue-100 text-blue-700 animate-pulse';
        case 'completed': return 'bg-green-100 text-green-700';
        case 'absent': return 'bg-red-100 text-red-700 line-through';
        default: return 'bg-gray-100 text-gray-500';
    }
}

export default function Index({ date, doctor_id, chamber_id, doctors, chambers, queue, stats, on_break, holiday }: Props) {
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const t = setInterval(() => {
            router.reload({ only: ['queue', 'stats'] });
        }, 10000);
        return () => clearInterval(t);
    }, []);

    function setFilter(k: string, v: string | number | null) {
        router.get('/receptionist/queue', {
            date,
            doctor_id: doctor_id ?? undefined,
            chamber_id: chamber_id ?? undefined,
            [k]: v || undefined,
        }, { preserveState: false });
    }

    function updateStatus(a: Appointment, status: string) {
        router.patch(`/receptionist/queue/appointments/${a.id}/status`, { status }, { preserveScroll: true });
    }

    return (
        <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-gray-800">Queue</h2>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    <input type="date" value={date} onChange={(e) => setFilter('date', e.target.value)} className="rounded border border-gray-300 px-2 py-1" />
                    <select value={doctor_id ?? ''} onChange={(e) => setFilter('doctor_id', e.target.value)} className="rounded border border-gray-300 px-2 py-1">
                        <option value="">Select doctor…</option>
                        {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    {chambers.length > 0 && (
                        <select value={chamber_id ?? ''} onChange={(e) => setFilter('chamber_id', e.target.value)} className="rounded border border-gray-300 px-2 py-1">
                            <option value="">All Chambers</option>
                            {chambers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    )}
                </div>
            </div>

            <FlashMessage />

            {holiday && (
                <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <strong>Holiday:</strong> {holiday.title}
                </div>
            )}

            {on_break && (
                <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    Doctor is on break.
                </div>
            )}

            {stats && (
                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
                    <Stat label="Total" v={stats.total} />
                    <Stat label="Waiting" v={stats.waiting} />
                    <Stat label="Completed" v={stats.completed} />
                    <Stat label="Follow-ups" v={stats.follow_ups} />
                    <Stat label="Absent" v={stats.absent} />
                    <Stat label="Earned" v={`৳ ${stats.total_earned.toFixed(0)}`} />
                </div>
            )}

            <div className="mb-3 flex gap-2">
                <button
                    onClick={() => setShowModal(true)}
                    disabled={!!holiday}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                    + New Appointment
                </button>
                <button
                    onClick={() => router.reload({ only: ['queue', 'stats'] })}
                    className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
                >
                    Refresh
                </button>
            </div>

            <div className="overflow-x-auto rounded-lg bg-white shadow">
                <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">#</th>
                            <th className="px-4 py-3">Patient</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Fee</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {queue.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No appointments.</td></tr>
                        ) : queue.map((a) => (
                            <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="px-4 py-3 font-mono font-bold">{a.serial_number}</td>
                                <td className="px-4 py-3">
                                    <div className="font-medium">{a.patient?.name}</div>
                                    <div className="text-xs text-gray-500">
                                        {ageStr(a.patient)} / {a.patient?.gender?.charAt(0).toUpperCase()} · {a.patient?.patient_uid} · {a.patient?.phone}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-xs capitalize">{a.type.replace('_', ' ')}</td>
                                <td className="px-4 py-3">
                                    <span className={`rounded px-2 py-1 text-xs font-medium ${statusClass(a.status)}`}>{a.status.replace('_', ' ')}</span>
                                </td>
                                <td className="px-4 py-3">৳ {Number(a.fee_amount).toFixed(0)} {a.fee_paid ? '✓' : ''}</td>
                                <td className="px-4 py-3 text-xs">
                                    <div className="flex gap-2">
                                        <Link href={`/receptionist/patients/${a.patient_id}`} className="rounded bg-gray-100 px-2 py-1 text-gray-700 hover:bg-gray-200">View</Link>
                                        {a.status === 'waiting' && (
                                            <button onClick={() => updateStatus(a, 'absent')} className="rounded bg-red-50 px-2 py-1 text-red-700 hover:bg-red-100">Mark Absent</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <AppointmentModal
                    onClose={() => setShowModal(false)}
                    defaultDate={date}
                    chambers={chambers}
                    defaultChamberId={chamber_id ?? undefined}
                    doctors={doctors}
                    defaultDoctorId={doctor_id ?? undefined}
                    submitUrl="/receptionist/appointments"
                    context="receptionist"
                />
            )}
        </>
    );
}

function Stat({ label, v }: { label: string; v: number | string }) {
    return (
        <div className="rounded-lg bg-white p-3 shadow-sm">
            <div className="text-xs uppercase text-gray-500">{label}</div>
            <div className="mt-1 text-xl font-bold text-gray-800">{v}</div>
        </div>
    );
}

Index.layout = (page: ReactNode) => <ReceptionistLayout>{page}</ReceptionistLayout>;
