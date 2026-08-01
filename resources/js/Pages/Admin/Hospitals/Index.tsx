import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/Pagination';
import { Hospital, PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface PaginatedHospitals {
    data: (Hospital & { doctors_count: number; patients_count: number })[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
}

interface Props extends PageProps {
    hospitals: PaginatedHospitals;
    filters: { search?: string; plan?: string; status?: string };
}

const PLAN_COLORS: Record<string, string> = {
    free: 'bg-gray-100 text-gray-700',
    basic: 'bg-blue-50 text-blue-700',
    premium: 'bg-purple-50 text-purple-700',
    enterprise: 'bg-amber-50 text-amber-700',
};

const STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-50 text-green-700',
    trial: 'bg-sky-50 text-sky-700',
    expired: 'bg-red-50 text-red-700',
    suspended: 'bg-orange-50 text-orange-700',
};

function Badge({ value, map }: { value: string; map: Record<string, string> }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${map[value] ?? 'bg-gray-100 text-gray-600'}`}>
            {value}
        </span>
    );
}

export default function Index({ hospitals, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [plan, setPlan] = useState(filters.plan ?? '');
    const [status, setStatus] = useState(filters.status ?? '');

    function applyFilters(overrides: Partial<typeof filters> = {}) {
        router.get(route('admin.hospitals.index'), {
            search: overrides.search ?? search,
            plan: overrides.plan ?? plan,
            status: overrides.status ?? status,
        }, { preserveState: true, replace: true });
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        applyFilters();
    }

    function handleToggleStatus(id: number) {
        router.post(route('admin.hospitals.toggle-status', id), {}, { preserveScroll: true });
    }

    function handleDelete(id: number, name: string) {
        if (confirm(`Delete "${name}"? This cannot be undone.`)) {
            router.delete(route('admin.hospitals.destroy', id), { preserveScroll: true });
        }
    }

    return (
        <AdminLayout>
            <Head title="Hospitals" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Hospitals</h2>
                    <p className="mt-0.5 text-sm text-gray-500">{hospitals.meta.total} registered hospitals</p>
                </div>
                <Link
                    href={route('admin.hospitals.create')}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm"
                    style={{ background: '#0f766e' }}
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12h14"/>
                    </svg>
                    Add Hospital
                </Link>
            </div>

            {/* Filters */}
            <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-48">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Hospital name…"
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Plan</label>
                        <select
                            value={plan}
                            onChange={e => { setPlan(e.target.value); applyFilters({ plan: e.target.value }); }}
                            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        >
                            <option value="">All plans</option>
                            <option value="free">Free</option>
                            <option value="basic">Basic</option>
                            <option value="premium">Premium</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                        <select
                            value={status}
                            onChange={e => { setStatus(e.target.value); applyFilters({ status: e.target.value }); }}
                            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        >
                            <option value="">All statuses</option>
                            <option value="active">Active</option>
                            <option value="trial">Trial</option>
                            <option value="expired">Expired</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="rounded-md px-4 py-2 text-sm font-medium text-white"
                        style={{ background: '#0f766e' }}
                    >
                        Search
                    </button>
                    {(search || plan || status) && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearch(''); setPlan(''); setStatus('');
                                router.get(route('admin.hospitals.index'), {}, { replace: true });
                            }}
                            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                        >
                            Clear
                        </button>
                    )}
                </form>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-gray-200 bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 font-medium text-gray-600">Hospital</th>
                            <th className="px-4 py-3 font-medium text-gray-600">Plan</th>
                            <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                            <th className="px-4 py-3 font-medium text-gray-600 text-right">Doctors</th>
                            <th className="px-4 py-3 font-medium text-gray-600 text-right">Patients</th>
                            <th className="px-4 py-3 font-medium text-gray-600">Active</th>
                            <th className="px-4 py-3 font-medium text-gray-600">Created</th>
                            <th className="px-4 py-3 font-medium text-gray-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {hospitals.data.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                                    No hospitals found.
                                </td>
                            </tr>
                        ) : hospitals.data.map(hospital => (
                            <tr key={hospital.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="font-medium text-gray-900">{hospital.name}</div>
                                    {hospital.phone && <div className="text-xs text-gray-400 mt-0.5">{hospital.phone}</div>}
                                </td>
                                <td className="px-4 py-3">
                                    <Badge value={hospital.subscription_plan} map={PLAN_COLORS} />
                                </td>
                                <td className="px-4 py-3">
                                    <Badge value={hospital.subscription_status} map={STATUS_COLORS} />
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                                    {hospital.doctors_count ?? 0}
                                    <span className="text-gray-400">/{hospital.max_doctors}</span>
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                                    {hospital.patients_count ?? 0}
                                </td>
                                <td className="px-4 py-3">
                                    <button
                                        onClick={() => handleToggleStatus(hospital.id)}
                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${hospital.is_active ? 'bg-teal-600' : 'bg-gray-300'}`}
                                    >
                                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${hospital.is_active ? 'translate-x-4' : 'translate-x-1'}`} />
                                    </button>
                                </td>
                                <td className="px-4 py-3 text-gray-500 text-xs">
                                    {new Date(hospital.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link
                                            href={route('admin.hospitals.show', hospital.id)}
                                            className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                                        >
                                            View
                                        </Link>
                                        <Link
                                            href={route('admin.hospitals.edit', hospital.id)}
                                            className="rounded px-2 py-1 text-xs text-teal-700 hover:bg-teal-50"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(hospital.id, hospital.name)}
                                            className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                    <p className="text-xs text-gray-500">
                        Page {hospitals.meta.current_page} of {hospitals.meta.last_page} · {hospitals.meta.total} total
                    </p>
                    <Pagination
                        meta={hospitals.meta}
                        onChange={(page) => router.get('/admin/hospitals', { ...filters, page }, { preserveState: true, preserveScroll: true })}
                    />
                </div>
            </div>
        </AdminLayout>
    );
}
