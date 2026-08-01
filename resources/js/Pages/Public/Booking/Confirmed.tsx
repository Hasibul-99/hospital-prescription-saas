import PublicLayout from '@/Layouts/PublicLayout';
import { Head, Link } from '@inertiajs/react';
import { ReactNode } from 'react';

interface Appointment {
    id: number;
    date: string;
    serial_number: number | null;
    fee_amount: number;
    patient: { patient_uid: string; name: string; phone: string } | null;
    doctor: { name: string } | null;
    chamber: { name: string; room_number: string | null } | null;
    hospital: { name: string; address: string | null } | null;
}

interface Props {
    appointment: Appointment;
}

export default function Confirmed({ appointment }: Props) {
    return (
        <>
            <Head title="Booking confirmed" />

            <div className="mx-auto max-w-lg rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white">✓</div>
                <h1 className="mt-3 text-lg font-semibold text-gray-900">Appointment confirmed</h1>
                <p className="mt-1 text-sm text-gray-600">Save this page or take a screenshot for reference.</p>
            </div>

            <div className="mx-auto mt-6 max-w-lg overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-100">
                        <tr>
                            <td className="w-1/3 bg-gray-50 px-4 py-3 text-xs uppercase text-gray-500">Patient</td>
                            <td className="px-4 py-3 font-medium text-gray-900">
                                {appointment.patient?.name}
                                <div className="text-xs text-gray-500">{appointment.patient?.patient_uid} · {appointment.patient?.phone}</div>
                            </td>
                        </tr>
                        <tr>
                            <td className="bg-gray-50 px-4 py-3 text-xs uppercase text-gray-500">Doctor</td>
                            <td className="px-4 py-3 text-gray-900">{appointment.doctor?.name}</td>
                        </tr>
                        <tr>
                            <td className="bg-gray-50 px-4 py-3 text-xs uppercase text-gray-500">Chamber</td>
                            <td className="px-4 py-3 text-gray-900">
                                {appointment.chamber?.name}
                                {appointment.chamber?.room_number && ` — Room ${appointment.chamber.room_number}`}
                            </td>
                        </tr>
                        <tr>
                            <td className="bg-gray-50 px-4 py-3 text-xs uppercase text-gray-500">Date</td>
                            <td className="px-4 py-3 text-gray-900">{appointment.date}</td>
                        </tr>
                        <tr>
                            <td className="bg-gray-50 px-4 py-3 text-xs uppercase text-gray-500">Serial</td>
                            <td className="px-4 py-3 text-lg font-bold text-teal-700">#{appointment.serial_number ?? '—'}</td>
                        </tr>
                        <tr>
                            <td className="bg-gray-50 px-4 py-3 text-xs uppercase text-gray-500">Fee</td>
                            <td className="px-4 py-3 text-gray-900">৳ {appointment.fee_amount.toFixed(0)} (pay at chamber)</td>
                        </tr>
                        {appointment.hospital?.address && (
                            <tr>
                                <td className="bg-gray-50 px-4 py-3 text-xs uppercase text-gray-500">Address</td>
                                <td className="px-4 py-3 text-gray-700">{appointment.hospital.address}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 flex justify-center gap-3 text-sm">
                <button
                    onClick={() => window.print()}
                    className="rounded border border-gray-300 bg-white px-4 py-2 hover:border-teal-500"
                >
                    Print slip
                </button>
                <Link href="/book" className="rounded bg-teal-600 px-4 py-2 text-white hover:bg-teal-700">
                    Book another
                </Link>
            </div>
        </>
    );
}

Confirmed.layout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>;
