import HospitalLayout from '@/Layouts/HospitalLayout';
import FlashMessage from '@/Components/FlashMessage';
import { HospitalHoliday } from '@/types';
import { Link, router } from '@inertiajs/react';
import { ReactNode, useState } from 'react';

interface Props {
    holidays: HospitalHoliday[];
    year: number;
}

export default function Index({ holidays, year }: Props) {
    const [selectedYear, setSelectedYear] = useState<number>(year);

    function apply() {
        router.get('/hospital/holidays', { year: selectedYear }, { preserveState: true, replace: true });
    }

    function destroy(id: number) {
        if (!confirm('Delete this holiday?')) return;
        router.delete(`/hospital/holidays/${id}`, { preserveScroll: true });
    }

    const years = Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 2 + i);

    return (
        <>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Holidays</h2>
                <Link href="/hospital/holidays/create" className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                    + New Holiday
                </Link>
            </div>

            <FlashMessage />

            <div className="mb-3 flex items-end gap-2 rounded bg-white p-3 shadow-sm">
                <div>
                    <label className="block text-xs text-gray-500">Year</label>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="rounded border border-gray-300 px-2 py-1 text-sm">
                        {years.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <button onClick={apply} className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700">Filter</button>
            </div>

            <div className="overflow-x-auto rounded-lg bg-white shadow">
                <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Title</th>
                            <th className="px-4 py-3">Recurring</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {holidays.length === 0 ? (
                            <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">No holidays.</td></tr>
                        ) : holidays.map((h) => (
                            <tr key={h.id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">{h.date}</td>
                                <td className="px-4 py-3">{h.title}</td>
                                <td className="px-4 py-3">{h.is_recurring_yearly ? 'Yearly' : '—'}</td>
                                <td className="px-4 py-3 text-xs">
                                    <Link href={`/hospital/holidays/${h.id}/edit`} className="text-blue-600 hover:underline">Edit</Link>
                                    <button onClick={() => destroy(h.id)} className="ml-2 text-red-600 hover:underline">Delete</button>
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
