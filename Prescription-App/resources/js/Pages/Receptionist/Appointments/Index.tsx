import ReceptionistLayout from '@/Layouts/ReceptionistLayout';
import FlashMessage from '@/Components/FlashMessage';
import Pagination from '@/Components/Pagination';
import AppointmentModal from '@/Components/AppointmentModal';
import { Appointment, PaginatedData, User } from '@/types';
import { router } from '@inertiajs/react';
import { ReactNode, useState } from 'react';

interface Props {
    appointments: PaginatedData<Appointment>;
    doctors: Pick<User, 'id' | 'name'>[];
    filters: {
        date_from?: string;
        date_to?: string;
        doctor_id?: string;
        status?: string;
        type?: string;
    };
}

export default function Index({ appointments, doctors, filters }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');
    const [doctorId, setDoctorId] = useState(filters.doctor_id ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [type, setType] = useState(filters.type ?? '');

    function apply() {
        router.get('/receptionist/appointments', {
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            doctor_id: doctorId || undefined,
            status: status || undefined,
            type: type || undefined,
        }, { preserveState: true, replace: true });
    }

    return (
        <>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Appointments</h2>
                <button onClick={() => setShowModal(true)} className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                    + New Appointment
                </button>
            </div>

            <FlashMessage />

            <div className="mb-3 rounded bg-white p-3 shadow-sm">
                <div className="flex flex-wrap items-end gap-2 text-sm">
                    <div><label className="block text-xs text-gray-500">From</label><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded border border-gray-300 px-2 py-1" /></div>
                    <div><label className="block text-xs text-gray-500">To</label><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded border border-gray-300 px-2 py-1" /></div>
                    <div>
                        <label className="block text-xs text-gray-500">Doctor</label>
                        <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="rounded border border-gray-300 px-2 py-1">
                            <option value="">All</option>
                            {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
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
                            <th className="px-4 py-3">Doctor</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Fee</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appointments.data.length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">No appointments.</td></tr>
                        ) : appointments.data.map((a) => (
                            <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="px-4 py-3">{a.appointment_date}</td>
                                <td className="px-4 py-3 font-mono font-bold">{a.serial_number}</td>
                                <td className="px-4 py-3">
                                    <div className="font-medium">{a.patient?.name}</div>
                                    <div className="text-xs text-gray-500">{a.patient?.patient_uid} · {a.patient?.phone}</div>
                                </td>
                                <td className="px-4 py-3">{a.doctor?.name}</td>
                                <td className="px-4 py-3 capitalize">{a.type.replace('_', ' ')}</td>
                                <td className="px-4 py-3 capitalize">{a.status.replace('_', ' ')}</td>
                                <td className="px-4 py-3">৳ {Number(a.fee_amount).toFixed(0)} {a.fee_paid ? '✓' : ''}</td>
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
                    chambers={[]}
                    doctors={doctors}
                    submitUrl="/receptionist/appointments"
                    context="receptionist"
                />
            )}
        </>
    );
}

Index.layout = (page: ReactNode) => <ReceptionistLayout>{page}</ReceptionistLayout>;
