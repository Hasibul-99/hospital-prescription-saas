import DoctorLayout from '@/Layouts/DoctorLayout';
import FlashMessage from '@/Components/FlashMessage';
import AppointmentModal from '@/Components/AppointmentModal';
import { Link, router } from '@inertiajs/react';
import { Appointment, Chamber, HospitalHoliday, QueueStats } from '@/types';
import { ReactNode, useEffect, useState } from 'react';

interface Props {
    date: string;
    chamber_id: number | null;
    chambers: Chamber[];
    queue: Appointment[];
    stats: QueueStats;
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

function statusBadge(status: string): string {
    switch (status) {
        case 'waiting': return 'bg-gray-100 text-gray-700 border-gray-300';
        case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-300 animate-pulse';
        case 'completed': return 'bg-green-100 text-green-700 border-green-300';
        case 'absent': return 'bg-red-100 text-red-700 border-red-300 line-through';
        case 'cancelled': return 'bg-gray-50 text-gray-400 border-gray-200 line-through';
        default: return 'bg-gray-100 text-gray-600';
    }
}

function typeBadge(type: string): string {
    switch (type) {
        case 'new_visit': return 'bg-sky-50 text-sky-700';
        case 'follow_up': return 'bg-amber-50 text-amber-700';
        case 'emergency': return 'bg-rose-50 text-rose-700';
        default: return 'bg-gray-50 text-gray-600';
    }
}

export default function Index({ date, chamber_id, chambers, queue, stats, on_break, holiday }: Props) {
    const [showModal, setShowModal] = useState(false);

    // Auto-refresh every 10s (polling)
    useEffect(() => {
        const t = setInterval(() => {
            router.reload({ only: ['queue', 'stats', 'on_break'] });
        }, 10000);
        return () => clearInterval(t);
    }, []);

    function changeDate(newDate: string) {
        router.get('/doctor/queue', { date: newDate, chamber_id: chamber_id ?? undefined }, { preserveState: false });
    }

    function changeChamber(newChamber: string) {
        router.get('/doctor/queue', { date, chamber_id: newChamber || undefined }, { preserveState: false });
    }

    function updateStatus(appt: Appointment, status: string) {
        router.patch(`/doctor/queue/appointments/${appt.id}/status`, { status }, { preserveScroll: true });
    }

    function nextPatient() {
        router.post('/doctor/queue/next', { date, chamber_id: chamber_id ?? undefined }, { preserveScroll: true });
    }

    function toggleBreak() {
        router.post('/doctor/queue/break', { date, chamber_id: chamber_id ?? undefined, on: !on_break }, { preserveScroll: true });
    }

    function refresh() {
        router.reload({ only: ['queue', 'stats', 'on_break'] });
    }

    return (
        <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-gray-800">Serial Queue</h2>
                <div className="flex flex-wrap items-center gap-2">
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => changeDate(e.target.value)}
                        className="rounded border border-gray-300 px-3 py-1.5 text-sm"
                    />
                    {chambers.length > 0 && (
                        <select
                            value={chamber_id ?? ''}
                            onChange={(e) => changeChamber(e.target.value)}
                            className="rounded border border-gray-300 px-3 py-1.5 text-sm"
                        >
                            <option value="">All Chambers</option>
                            {chambers.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            <FlashMessage />

            {holiday && (
                <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <strong>Holiday:</strong> {holiday.title} — bookings blocked for this date.
                </div>
            )}

            {on_break && (
                <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    Doctor is on break.
                </div>
            )}

            {/* Quick Stats */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
                <StatCard label="Total" value={stats.total} />
                <StatCard label="Completed" value={stats.completed} tone="green" />
                <StatCard label="Waiting" value={stats.waiting} tone="gray" />
                <StatCard label="Follow-ups" value={stats.follow_ups} tone="amber" />
                <StatCard label="Absent" value={stats.absent} tone="red" />
                <StatCard label="Earned" value={`৳ ${stats.total_earned.toFixed(0)}`} tone="blue" />
            </div>

            {/* Action bar */}
            <div className="mb-3 flex flex-wrap gap-2">
                <button
                    onClick={() => setShowModal(true)}
                    disabled={!!holiday}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                    + New Appointment
                </button>
                <button
                    onClick={nextPatient}
                    className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                    → Next
                </button>
                <button
                    onClick={toggleBreak}
                    className={`rounded-md px-4 py-2 text-sm font-medium text-white ${on_break ? 'bg-amber-600 hover:bg-amber-700' : 'bg-gray-500 hover:bg-gray-600'}`}
                >
                    {on_break ? 'End Break' : 'Break'}
                </button>
                <button
                    onClick={refresh}
                    className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                    Refresh
                </button>
            </div>

            {/* Queue Table */}
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
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No appointments for this day.</td>
                            </tr>
                        ) : (
                            queue.map((a) => (
                                <tr key={a.id} className={`border-b last:border-0 hover:bg-gray-50 ${a.status === 'in_progress' ? 'bg-blue-50/40' : ''}`}>
                                    <td className="px-4 py-3 font-mono text-lg font-bold text-gray-800">{a.serial_number}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-800">{a.patient?.name}</div>
                                        <div className="text-xs text-gray-500">
                                            {ageStr(a.patient)} / {a.patient?.gender?.charAt(0).toUpperCase()} · {a.patient?.patient_uid} · {a.patient?.phone}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${typeBadge(a.type)}`}>
                                            {a.type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`rounded-md border px-2 py-1 text-xs font-medium ${statusBadge(a.status)}`}>
                                            {a.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                        ৳ {Number(a.fee_amount).toFixed(0)}
                                        {a.fee_paid ? <span className="ml-1 text-green-600 text-xs">✓</span> : <span className="ml-1 text-red-500 text-xs">Unpaid</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-2 text-xs">
                                            <Link
                                                href={`/doctor/prescriptions/create?patient_id=${a.patient_id}&appointment_id=${a.id}`}
                                                className="rounded bg-blue-50 px-2 py-1 text-blue-700 hover:bg-blue-100"
                                                title="Create prescription"
                                            >
                                                ➕ Rx
                                            </Link>
                                            {a.prescription && (
                                                <a
                                                    href={`/doctor/prescriptions/${a.prescription.id}/print`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="rounded bg-gray-100 px-2 py-1 text-gray-700 hover:bg-gray-200"
                                                >
                                                    🖨️ Print
                                                </a>
                                            )}
                                            {a.status !== 'completed' && (
                                                <button
                                                    onClick={() => updateStatus(a, 'completed')}
                                                    className="rounded bg-green-50 px-2 py-1 text-green-700 hover:bg-green-100"
                                                >
                                                    ☑️ Complete
                                                </button>
                                            )}
                                            {a.status === 'waiting' && (
                                                <button
                                                    onClick={() => updateStatus(a, 'in_progress')}
                                                    className="rounded bg-sky-50 px-2 py-1 text-sky-700 hover:bg-sky-100"
                                                >
                                                    ▶ Start
                                                </button>
                                            )}
                                            {a.status !== 'absent' && a.status !== 'completed' && (
                                                <button
                                                    onClick={() => updateStatus(a, 'absent')}
                                                    className="rounded bg-red-50 px-2 py-1 text-red-700 hover:bg-red-100"
                                                >
                                                    ❌ Absent
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <AppointmentModal
                    onClose={() => setShowModal(false)}
                    defaultDate={date}
                    chambers={chambers}
                    defaultChamberId={chamber_id ?? undefined}
                    submitUrl="/doctor/appointments"
                    context="doctor"
                />
            )}
        </>
    );
}

function StatCard({ label, value, tone = 'default' }: { label: string; value: number | string; tone?: 'default' | 'green' | 'gray' | 'red' | 'amber' | 'blue' }) {
    const toneMap: Record<string, string> = {
        default: 'bg-white text-gray-800',
        green: 'bg-green-50 text-green-700',
        gray: 'bg-gray-50 text-gray-700',
        red: 'bg-red-50 text-red-700',
        amber: 'bg-amber-50 text-amber-700',
        blue: 'bg-blue-50 text-blue-700',
    };
    return (
        <div className={`rounded-lg p-3 shadow-sm ${toneMap[tone]}`}>
            <div className="text-xs uppercase">{label}</div>
            <div className="mt-1 text-xl font-bold">{value}</div>
        </div>
    );
}

Index.layout = (page: ReactNode) => <DoctorLayout>{page}</DoctorLayout>;
