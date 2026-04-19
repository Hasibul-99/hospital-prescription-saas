import DoctorLayout from '@/Layouts/DoctorLayout';
import Pagination from '@/Components/Pagination';
import FlashMessage from '@/Components/FlashMessage';
import { Link, router } from '@inertiajs/react';
import { Patient } from '@/types';
import { ReactNode, useState } from 'react';

interface Props {
    patients: {
        data: Patient[];
        links: any[];
        meta?: any;
    };
    filters: {
        search?: string;
        gender?: string;
        blood_group?: string;
        date_from?: string;
        date_to?: string;
        age_from?: string;
        age_to?: string;
        sort_by?: string;
        sort_dir?: string;
    };
}

function ageDisplay(p: Patient): string {
    const parts = [];
    if (p.age_years) parts.push(`${p.age_years}Y`);
    if (p.age_months) parts.push(`${p.age_months}M`);
    if (p.age_days) parts.push(`${p.age_days}D`);
    return parts.join(' ') || 'N/A';
}

export default function Index({ patients, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [gender, setGender] = useState(filters.gender ?? '');
    const [bloodGroup, setBloodGroup] = useState(filters.blood_group ?? '');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');
    const [ageFrom, setAgeFrom] = useState(filters.age_from ?? '');
    const [ageTo, setAgeTo] = useState(filters.age_to ?? '');
    const [showMore, setShowMore] = useState(false);

    function getFilterParams() {
        return {
            search: search || undefined,
            gender: gender || undefined,
            blood_group: bloodGroup || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            age_from: ageFrom || undefined,
            age_to: ageTo || undefined,
        };
    }

    function applyFilters() {
        router.get('/doctor/patients', getFilterParams(), { preserveState: true, replace: true });
    }

    function handleSort(column: string) {
        const dir = filters.sort_by === column && filters.sort_dir === 'asc' ? 'desc' : 'asc';
        router.get('/doctor/patients', {
            ...getFilterParams(),
            sort_by: column,
            sort_dir: dir,
        }, { preserveState: true, replace: true });
    }

    function sortIcon(column: string) {
        if (filters.sort_by !== column) return '';
        return filters.sort_dir === 'asc' ? ' \u2191' : ' \u2193';
    }

    function exportCsv() {
        const params = new URLSearchParams();
        const fp = getFilterParams();
        Object.entries(fp).forEach(([k, v]) => { if (v) params.set(k, v); });
        window.location.href = `/doctor/patients-export?${params.toString()}`;
    }

    return (
        <>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Patients</h2>
                <div className="flex gap-2">
                    <button
                        onClick={exportCsv}
                        className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                        Export CSV
                    </button>
                    <Link
                        href="/doctor/patients/create"
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        + Register Patient
                    </Link>
                </div>
            </div>

            <FlashMessage />

            {/* Filters */}
            <div className="mb-4 rounded-lg bg-white p-4 shadow">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-1">
                        <label className="block text-xs text-gray-500">Search</label>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            placeholder="Name, phone, or UID..."
                            className="mt-1 w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500">Gender</label>
                        <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="mt-1 rounded border border-gray-300 px-3 py-1.5 text-sm"
                        >
                            <option value="">All</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500">Blood Group</label>
                        <select
                            value={bloodGroup}
                            onChange={(e) => setBloodGroup(e.target.value)}
                            className="mt-1 rounded border border-gray-300 px-3 py-1.5 text-sm"
                        >
                            <option value="">All</option>
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                                <option key={bg} value={bg}>{bg}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={applyFilters}
                        className="rounded bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700"
                    >
                        Filter
                    </button>
                    <button
                        onClick={() => setShowMore(!showMore)}
                        className="rounded bg-gray-100 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200"
                    >
                        {showMore ? 'Less' : 'More Filters'}
                    </button>
                </div>

                {showMore && (
                    <div className="mt-3 flex flex-wrap items-end gap-3 border-t pt-3">
                        <div>
                            <label className="block text-xs text-gray-500">Registered From</label>
                            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-1 rounded border border-gray-300 px-3 py-1.5 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500">Registered To</label>
                            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1 rounded border border-gray-300 px-3 py-1.5 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500">Age From</label>
                            <input type="number" min="0" max="150" value={ageFrom} onChange={(e) => setAgeFrom(e.target.value)} placeholder="0" className="mt-1 w-20 rounded border border-gray-300 px-3 py-1.5 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500">Age To</label>
                            <input type="number" min="0" max="150" value={ageTo} onChange={(e) => setAgeTo(e.target.value)} placeholder="150" className="mt-1 w-20 rounded border border-gray-300 px-3 py-1.5 text-sm" />
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg bg-white shadow">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b bg-gray-50 text-gray-600">
                            <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('patient_uid')}>
                                Patient UID{sortIcon('patient_uid')}
                            </th>
                            <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('name')}>
                                Name{sortIcon('name')}
                            </th>
                            <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('age_years')}>
                                Age/Gender{sortIcon('age_years')}
                            </th>
                            <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('phone')}>
                                Phone{sortIcon('phone')}
                            </th>
                            <th className="px-4 py-3">Last Visit</th>
                            <th className="px-4 py-3">Visits</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {patients.data.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                    No patients found
                                </td>
                            </tr>
                        ) : (
                            patients.data.map((p: any) => (
                                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="px-4 py-3 font-mono text-xs text-blue-600">
                                        <Link href={`/doctor/patients/${p.id}`}>{p.patient_uid}</Link>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {ageDisplay(p)} / {p.gender?.charAt(0).toUpperCase()}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{p.phone}</td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">
                                        {p.last_visit ? new Date(p.last_visit).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{p.appointments_count ?? 0}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <Link href={`/doctor/patients/${p.id}`} className="text-blue-600 hover:underline text-xs">View</Link>
                                            <Link href={`/doctor/patients/${p.id}/edit`} className="text-gray-600 hover:underline text-xs">Edit</Link>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                <div className="border-t px-4 py-3">
                    <Pagination links={patients.links} />
                </div>
            </div>
        </>
    );
}

Index.layout = (page: ReactNode) => <DoctorLayout>{page}</DoctorLayout>;
