import AdminLayout from '@/Layouts/AdminLayout';
import { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface Props extends PageProps { hospitals: { id: number; name: string }[] }

const inputCls = 'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

export default function Create({ hospitals }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'doctor' as string,
        hospital_id: '' as string | number,
        is_active: true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('admin.users.store'));
    };

    return (
        <AdminLayout>
            <Head title="Add User" />

            <div className="mb-6 flex items-center gap-3">
                <Link href={route('admin.users.index')} className="text-gray-400 hover:text-gray-600">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
                    </svg>
                </Link>
                <h2 className="text-xl font-bold text-gray-900">Add User</h2>
            </div>

            <div className="max-w-lg rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className={labelCls}>Full Name *</label>
                        <input type="text" value={data.name} onChange={e => setData('name', e.target.value)}
                            placeholder="John Doe" required className={inputCls} />
                        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                    </div>

                    <div>
                        <label className={labelCls}>Email *</label>
                        <input type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                            placeholder="user@example.com" required className={inputCls} />
                        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Password *</label>
                            <input type="password" value={data.password} onChange={e => setData('password', e.target.value)}
                                required className={inputCls} />
                            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                        </div>
                        <div>
                            <label className={labelCls}>Confirm Password *</label>
                            <input type="password" value={data.password_confirmation}
                                onChange={e => setData('password_confirmation', e.target.value)}
                                required className={inputCls} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Role *</label>
                            <select value={data.role} onChange={e => setData('role', e.target.value)} className={inputCls}>
                                <option value="super_admin">Super Admin</option>
                                <option value="hospital_admin">Hospital Admin</option>
                                <option value="doctor">Doctor</option>
                                <option value="receptionist">Receptionist</option>
                            </select>
                            {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role}</p>}
                        </div>
                        <div>
                            <label className={labelCls}>Hospital</label>
                            <select value={data.hospital_id}
                                onChange={e => setData('hospital_id', e.target.value)} className={inputCls}>
                                <option value="">None (Super Admin)</option>
                                {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                            </select>
                            {errors.hospital_id && <p className="mt-1 text-xs text-red-600">{errors.hospital_id}</p>}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="is_active" checked={data.is_active}
                            onChange={e => setData('is_active', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-teal-600" />
                        <label htmlFor="is_active" className="text-sm text-gray-700">Account active</label>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                        <Link href={route('admin.users.index')}
                            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                            Cancel
                        </Link>
                        <button type="submit" disabled={processing}
                            className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                            style={{ background: '#0f766e' }}>
                            {processing ? 'Creating…' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
