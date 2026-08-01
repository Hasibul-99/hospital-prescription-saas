import DoctorLayout from '@/Layouts/DoctorLayout';
import FlashMessage from '@/Components/FlashMessage';
import { Appointment } from '@/types';
import { router } from '@inertiajs/react';
import { ReactNode, useState } from 'react';

interface Summary {
    total_patients: number;
    new_patients: number;
    follow_ups: number;
    emergency: number;
    total_earned: number;
    total_paid: number;
    total_unpaid: number;
}

interface Props {
    rows: Appointment[];
    summary: Summary;
    filters: { date_from: string; date_to: string };
}

export default function Index({ rows, summary, filters }: Props) {
    const [from, setFrom] = useState(filters.date_from);
    const [to, setTo] = useState(filters.date_to);

    function apply() {
        router.get('/doctor/statements', { date_from: from, date_to: to }, { preserveState: true, replace: true });
    }

    function printPage() {
        window.print();
    }

    return (
        <>
            <style>{`@media print { aside, header, .no-print { display: none !important; } main { padding: 0 !important; } }`}</style>

            <div className="mb-4 flex items-center justify-between no-print">
                <h2 className="text-xl font-bold text-gray-800">Daily Statement</h2>
                <button onClick={printPage} className="rounded bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-900">🖨 Print</button>
            </div>

            <FlashMessage />

            <div className="mb-3 flex flex-wrap items-end gap-2 rounded bg-white p-3 text-sm shadow-sm no-print">
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

            <div className="mb-4 rounded bg-white p-4 shadow-sm">
                <h3 className="mb-3 font-semibold text-gray-700">Summary — {from} to {to}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <Stat label="Total Patients" value={summary.total_patients} />
                    <Stat label="New" value={summary.new_patients} />
                    <Stat label="Follow-ups" value={summary.follow_ups} />
                    <Stat label="Emergency" value={summary.emergency} />
                    <Stat label="Total Earned" value={`৳ ${summary.total_earned.toFixed(2)}`} />
                    <Stat label="Paid" value={`৳ ${summary.total_paid.toFixed(2)}`} tone="green" />
                    <Stat label="Unpaid" value={`৳ ${summary.total_unpaid.toFixed(2)}`} tone="red" />
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg bg-white shadow">
                <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-2">Date</th>
                            <th className="px-4 py-2">#</th>
                            <th className="px-4 py-2">Patient</th>
                            <th className="px-4 py-2">Type</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2 text-right">Fee</th>
                            <th className="px-4 py-2">Paid</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">No records.</td></tr>
                        ) : rows.map((a) => (
                            <tr key={a.id} className="border-b last:border-0">
                                <td className="px-4 py-2">{a.appointment_date}</td>
                                <td className="px-4 py-2 font-mono">{a.serial_number}</td>
                                <td className="px-4 py-2">
                                    <div>{a.patient?.name}</div>
                                    <div className="text-xs text-gray-500">{a.patient?.patient_uid}</div>
                                </td>
                                <td className="px-4 py-2 capitalize">{a.type.replace('_', ' ')}</td>
                                <td className="px-4 py-2 capitalize">{a.status.replace('_', ' ')}</td>
                                <td className="px-4 py-2 text-right">৳ {Number(a.fee_amount).toFixed(2)}</td>
                                <td className="px-4 py-2">{a.fee_paid ? '✓' : '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

function Stat({ label, value, tone = 'default' }: { label: string; value: number | string; tone?: 'default' | 'green' | 'red' }) {
    const t: Record<string, string> = {
        default: 'text-gray-800',
        green: 'text-green-700',
        red: 'text-red-700',
    };
    return (
        <div className="rounded border border-gray-100 bg-gray-50 px-3 py-2">
            <div className="text-xs text-gray-500">{label}</div>
            <div className={`mt-1 text-lg font-bold ${t[tone]}`}>{value}</div>
        </div>
    );
}

Index.layout = (page: ReactNode) => <DoctorLayout>{page}</DoctorLayout>;
