import AdminLayout from '@/Layouts/AdminLayout';
import { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
    hospital?: { id: number; name: string } | null;
}

interface PaginatedUsers {
    data: User[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Props extends PageProps {
    users: PaginatedUsers;
    hospitals: { id: number; name: string }[];
    filters: { search?: string; role?: string; hospital_id?: string };
}

const ROLE_COLORS: Record<string, string> = {
    super_admin:   'bg-purple-50 text-purple-700',
    hospital_admin:'bg-blue-50 text-blue-700',
    doctor:        'bg-teal-50 text-teal-700',
    receptionist:  'bg-amber-50 text-amber-700',
};

const ROLE_LABELS: Record<string, string> = {
    super_admin:   'Super Admin',
    hospital_admin:'Hospital Admin',
    doctor:        'Doctor',
    receptionist:  'Receptionist',
};

export default function Index({ users, hospitals, filters }: Props) {
    const [search, setSearch]         = useState(filters.search ?? '');
    const [role, setRole]             = useState(filters.role ?? '');
    const [hospitalId, setHospitalId] = useState(filters.hospital_id ?? '');

    function apply(overrides: Partial<typeof filters> = {}) {
        router.get(route('admin.users.index'), {
            search:      overrides.search      ?? search,
            role:        overrides.role        ?? role,
            hospital_id: overrides.hospital_id ?? hospitalId,
        }, { preserveState: true, replace: true });
    }

    function handleDelete(id: number, name: string) {
        if (confirm(`Delete user "${name}"? This cannot be undone.`)) {
            router.delete(route('admin.users.destroy', id), { preserveScroll: true });
        }
    }

    return (
        <AdminLayout>
            <Head title="Users" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Users</h2>
                    <p className="mt-0.5 text-sm text-gray-500">{users.total} users total</p>
                </div>
                <Link
                    href={route('admin.users.create')}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm"
                    style={{ background: '#0f766e' }}
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12h14"/>
                    </svg>
                    Add User
                </Link>
            </div>

            {/* Filters */}
            <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <form onSubmit={e => { e.preventDefault(); apply(); }} className="flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-48">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Name or email…"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                        <select value={role} onChange={e => { setRole(e.target.value); apply({ role: e.target.value }); }}
                            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500">
                            <option value="">All roles</option>
                            <option value="super_admin">Super Admin</option>
                            <option value="hospital_admin">Hospital Admin</option>
                            <option value="doctor">Doctor</option>
                            <option value="receptionist">Receptionist</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Hospital</label>
                        <select value={hospitalId} onChange={e => { setHospitalId(e.target.value); apply({ hospital_id: e.target.value }); }}
                            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500">
                            <option value="">All hospitals</option>
                            {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="rounded-md px-4 py-2 text-sm font-medium text-white" style={{ background: '#0f766e' }}>
                        Search
                    </button>
                    {(search || role || hospitalId) && (
                        <button type="button" onClick={() => {
                            setSearch(''); setRole(''); setHospitalId('');
                            router.get(route('admin.users.index'), {}, { replace: true });
                        }} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
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
                            <th className="px-4 py-3 font-medium text-gray-600">Name</th>
                            <th className="px-4 py-3 font-medium text-gray-600">Email</th>
                            <th className="px-4 py-3 font-medium text-gray-600">Role</th>
                            <th className="px-4 py-3 font-medium text-gray-600">Hospital</th>
                            <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                            <th className="px-4 py-3 font-medium text-gray-600">Joined</th>
                            <th className="px-4 py-3 font-medium text-gray-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.data.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">No users found.</td>
                            </tr>
                        ) : users.data.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                                <td className="px-4 py-3 text-gray-500">{user.email}</td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                                        {ROLE_LABELS[user.role] ?? user.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-500 text-sm">{user.hospital?.name ?? '—'}</td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${user.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {user.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-xs">
                                    {new Date(user.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link href={route('admin.users.edit', user.id)}
                                            className="rounded px-2 py-1 text-xs text-teal-700 hover:bg-teal-50">
                                            Edit
                                        </Link>
                                        <button onClick={() => handleDelete(user.id, user.name)}
                                            className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {users.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                        <p className="text-xs text-gray-500">Page {users.current_page} of {users.last_page} · {users.total} total</p>
                        <div className="flex gap-1">
                            {users.links.map((link, i) => (
                                link.url ? (
                                    <Link key={i} href={link.url}
                                        className={`rounded px-2.5 py-1 text-xs ${link.active ? 'font-semibold text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                        style={link.active ? { background: '#0f766e' } : {}}
                                        dangerouslySetInnerHTML={{ __html: link.label }} />
                                ) : (
                                    <span key={i} className="rounded px-2.5 py-1 text-xs text-gray-300"
                                        dangerouslySetInnerHTML={{ __html: link.label }} />
                                )
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
