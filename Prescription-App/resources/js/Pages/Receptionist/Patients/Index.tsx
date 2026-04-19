import ReceptionistLayout from '@/Layouts/ReceptionistLayout';
import Pagination from '@/Components/Pagination';
import FlashMessage from '@/Components/FlashMessage';
import { Link, router } from '@inertiajs/react';
import { Patient } from '@/types';
import { ReactNode, useState } from 'react';

interface Props {
    patients: {
        data: Patient[];
        links: any[];
    };
    filters: {
        search?: string;
        gender?: string;
        blood_group?: string;
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

    function applyFilters() {
        router.get('/receptionist/patients', {
            search: search || undefined,
            gender: gender || undefined,
            blood_group: bloodGroup || undefined,
        }, { preserveState: true, replace: true });
    }

    function handleSort(column: string) {
        const dir = filters.sort_by === column && filters.sort_dir === 'asc' ? 'desc' : 'asc';
        router.get('/receptionist/patients', { ...filters, sort_by: column, sort_dir: dir }, { preserveState: true, replace: true });
    }

    function sortIcon(column: string) {
        if (filters.sort_by !== column) return '';
        return filters.sort_dir === 'asc' ? ' \u2191' : ' \u2193';
    }

    return (
        <>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Patients</h2>
                <Link href="/receptionist/patients/create" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                    + Register Patient
                </Link>
            </div>

            <FlashMessage />

            <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow">
                <div className="flex-1">
                    <label className="block text-xs text-gray-500">Search</label>
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyFilters()} placeholder="Name, phone, or UID..." className="mt-1 w-full rounded border border-gray-300 px-3 py-1.5 text-sm" />
                </div>
                <div>
                    <label className="block text-xs text-gray-500">Gender</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className="mt-1 rounded border border-gray-300 px-3 py-1.5 text-sm">
                        <option value="">All</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-gray-500">Blood Group</label>
                    <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="mt-1 rounded border border-gray-300 px-3 py-1.5 text-sm">
                        <option value="">All</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                            <option key={bg} value={bg}>{bg}</option>
                        ))}
                    </select>
                </div>
                <button onClick={applyFilters} className="rounded bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700">Filter</button>
            </div>

            <div className="overflow-x-auto rounded-lg bg-white shadow">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b bg-gray-50 text-gray-600">
                            <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('patient_uid')}>Patient UID{sortIcon('patient_uid')}</th>
                            <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('name')}>Name{sortIcon('name')}</th>
                            <th className="px-4 py-3">Age/Gender</th>
                            <th className="px-4 py-3">Phone</th>
                            <th className="px-4 py-3">Last Visit</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {patients.data.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No patients found</td></tr>
                        ) : (
                            patients.data.map((p: any) => (
                                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="px-4 py-3 font-mono text-xs text-blue-600">
                                        <Link href={`/receptionist/patients/${p.id}`}>{p.patient_uid}</Link>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                                    <td className="px-4 py-3 text-gray-600">{ageDisplay(p)} / {p.gender?.charAt(0).toUpperCase()}</td>
                                    <td className="px-4 py-3 text-gray-600">{p.phone}</td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">{p.last_visit ? new Date(p.last_visit).toLocaleDateString() : '-'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <Link href={`/receptionist/patients/${p.id}`} className="text-blue-600 hover:underline text-xs">View</Link>
                                            <Link href={`/receptionist/patients/${p.id}/edit`} className="text-gray-600 hover:underline text-xs">Edit</Link>
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

Index.layout = (page: ReactNode) => <ReceptionistLayout>{page}</ReceptionistLayout>;
