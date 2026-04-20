import HospitalLayout from '@/Layouts/HospitalLayout';
import FlashMessage from '@/Components/FlashMessage';
import { Chamber, User } from '@/types';
import { Link, router } from '@inertiajs/react';
import { ReactNode, useState } from 'react';

interface Props {
    chambers: (Chamber & { doctor?: Pick<User, 'id' | 'name'> })[];
    doctors: Pick<User, 'id' | 'name'>[];
    filters: { doctor_id?: string };
}

export default function Index({ chambers, doctors, filters }: Props) {
    const [doctorId, setDoctorId] = useState(filters.doctor_id ?? '');

    function apply() {
        router.get('/hospital/chambers', { doctor_id: doctorId || undefined }, { preserveState: true, replace: true });
    }

    function destroy(id: number) {
        if (!confirm('Delete this chamber?')) return;
        router.delete(`/hospital/chambers/${id}`, { preserveScroll: true });
    }

    return (
        <>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Chambers</h2>
                <Link href="/hospital/chambers/create" className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                    + New Chamber
                </Link>
            </div>

            <FlashMessage />

            <div className="mb-3 flex items-end gap-2 rounded bg-white p-3 shadow-sm">
                <div>
                    <label className="block text-xs text-gray-500">Doctor</label>
                    <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="rounded border border-gray-300 px-2 py-1 text-sm">
                        <option value="">All</option>
                        {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                <button onClick={apply} className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700">Filter</button>
            </div>

            <div className="overflow-x-auto rounded-lg bg-white shadow">
                <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Doctor</th>
                            <th className="px-4 py-3">Room</th>
                            <th className="px-4 py-3">Floor</th>
                            <th className="px-4 py-3">Building</th>
                            <th className="px-4 py-3">Active</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {chambers.length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">No chambers.</td></tr>
                        ) : chambers.map((c) => (
                            <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">{c.name}</td>
                                <td className="px-4 py-3">{c.doctor?.name ?? '-'}</td>
                                <td className="px-4 py-3">{c.room_number ?? '-'}</td>
                                <td className="px-4 py-3">{c.floor ?? '-'}</td>
                                <td className="px-4 py-3">{c.building ?? '-'}</td>
                                <td className="px-4 py-3">{c.is_active ? '✓' : '—'}</td>
                                <td className="px-4 py-3 text-xs">
                                    <Link href={`/hospital/chambers/${c.id}/edit`} className="text-blue-600 hover:underline">Edit</Link>
                                    <button onClick={() => destroy(c.id)} className="ml-2 text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

Index.layout = (page: ReactNode) => <HospitalLayout>{page}</HospitalLayout>;
