import DoctorLayout from '@/Layouts/DoctorLayout';
import FlashMessage from '@/Components/FlashMessage';
import Pagination from '@/Components/Pagination';
import AppointmentModal from '@/Components/AppointmentModal';
import { Appointment, Chamber, PaginatedData } from '@/types';
import { router } from '@inertiajs/react';
import { ReactNode, useState } from 'react';

interface Props {
    appointments: PaginatedData<Appointment>;
    filters: {
        date_from?: string;
        date_to?: string;
        status?: string;
        type?: string;
        chamber_id?: string;
    };
    chambers: Chamber[];
}

export default function Index({ appointments, filters, chambers }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [type, setType] = useState(filters.type ?? '');
    const [chamberId, setChamberId] = useState(filters.chamber_id ?? '');

    function apply() {
        router.get('/doctor/appointments', {
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            status: status || undefined,
            type: type || undefined,
            chamber_id: chamberId || undefined,
        }, { preserveState: true, replace: true });
    }

    return (
        <>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Appointments</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                    + New Appointment
                </button>
            </div>

            <FlashMessage />

            <div className="mb-3 rounded bg-white p-3 shadow-sm">
                <div className="flex flex-wrap items-end gap-2 text-sm">
                    <div>
                        <label className="block text-xs text-gray-500">From</label>
                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded border border-gray-300 px-2 py-1" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500">To</label>
                        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded border border-gray-300 px-2 py-1" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500">Status</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded border border-gray-300 px-2 py-1">
                            <option value="">All</option>
                            <option value="waiting">Waiting</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="absent">Absent</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500">Type</label>
                        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded border border-gray-300 px-2 py-1">
                            <option value="">All</option>
                            <option value="new_visit">New Visit</option>
                            <option value="follow_up">Follow-up</option>
                            <option value="emergency">Emergency</option>
                        </select>
                    </div>
                    {chambers.length > 0 && (
                        <div>
                            <label className="block text-xs text-gray-500">Chamber</label>
                            <select value={chamberId} onChange={(e) => setChamberId(e.target.value)} className="rounded border border-gray-300 px-2 py-1">
                                <option value="">All</option>
                                {chambers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    )}
                    <button onClick={apply} className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700">Apply</button>
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg bg-white shadow">
                <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">#</th>
                            <th className="px-4 py-3">Patient</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Fee</th>
                            <th className="px-4 py-3">Chamber</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appointments.data.length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">No appointments.</td></tr>
                        ) : appointments.data.map((a) => (
                            <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-700">{a.appointment_date}</td>
                                <td className="px-4 py-3 font-mono font-bold">{a.serial_number}</td>
                                <td className="px-4 py-3">
                                    <div className="font-medium">{a.patient?.name}</div>
                                    <div className="text-xs text-gray-500">{a.patient?.patient_uid} · {a.patient?.phone}</div>
                                </td>
                                <td className="px-4 py-3 text-gray-600 capitalize">{a.type.replace('_', ' ')}</td>
                                <td className="px-4 py-3 capitalize">{a.status.replace('_', ' ')}</td>
                                <td className="px-4 py-3">৳ {Number(a.fee_amount).toFixed(0)} {a.fee_paid ? '✓' : ''}</td>
                                <td className="px-4 py-3 text-gray-500">{a.chamber?.name ?? '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="border-t px-4 py-3"><Pagination links={appointments.links as any} /></div>
            </div>

            {showModal && (
                <AppointmentModal
                    onClose={() => setShowModal(false)}
                    defaultDate={new Date().toISOString().split('T')[0]}
                    chambers={chambers}
                    submitUrl="/doctor/appointments"
                    context="doctor"
                />
            )}
        </>
    );
}

Index.layout = (page: ReactNode) => <DoctorLayout>{page}</DoctorLayout>;
