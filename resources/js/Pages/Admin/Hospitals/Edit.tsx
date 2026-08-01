import AdminLayout from '@/Layouts/AdminLayout';
import { Hospital, PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface Props extends PageProps { hospital: Hospital }

const inputCls = 'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

export default function Edit({ hospital }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: hospital.name,
        slug: hospital.slug,
        address: hospital.address ?? '',
        phone: hospital.phone ?? '',
        email: hospital.email ?? '',
        website: hospital.website ?? '',
        subscription_plan: hospital.subscription_plan,
        subscription_status: hospital.subscription_status,
        max_doctors: hospital.max_doctors,
        max_patients_per_month: hospital.max_patients_per_month,
        is_active: hospital.is_active,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('admin.hospitals.update', hospital.id));
    };

    return (
        <AdminLayout>
            <Head title={`Edit — ${hospital.name}`} />

            <div className="mb-6 flex items-center gap-3">
                <Link href={route('admin.hospitals.index')} className="text-gray-400 hover:text-gray-600">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
                    </svg>
                </Link>
                <h2 className="text-xl font-bold text-gray-900">Edit Hospital</h2>
            </div>

            <div className="max-w-2xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <form onSubmit={submit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className={labelCls}>Hospital Name *</label>
                            <input type="text" value={data.name} onChange={e => setData('name', e.target.value)}
                                required className={inputCls} />
                            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                        </div>

                        <div>
                            <label className={labelCls}>Slug *</label>
                            <input type="text" value={data.slug} onChange={e => setData('slug', e.target.value)}
                                required className={inputCls} />
                            {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug}</p>}
                        </div>

                        <div>
                            <label className={labelCls}>Phone</label>
                            <input type="text" value={data.phone} onChange={e => setData('phone', e.target.value)} className={inputCls} />
                        </div>

                        <div>
                            <label className={labelCls}>Email</label>
                            <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} className={inputCls} />
                        </div>

                        <div>
                            <label className={labelCls}>Website</label>
                            <input type="text" value={data.website} onChange={e => setData('website', e.target.value)} className={inputCls} />
                        </div>

                        <div className="col-span-2">
                            <label className={labelCls}>Address</label>
                            <textarea value={data.address} onChange={e => setData('address', e.target.value)}
                                rows={2} className={inputCls} />
                        </div>

                        <div>
                            <label className={labelCls}>Subscription Plan *</label>
                            <select value={data.subscription_plan}
                                onChange={e => setData('subscription_plan', e.target.value as typeof data.subscription_plan)}
                                className={inputCls}>
                                <option value="free">Free</option>
                                <option value="basic">Basic</option>
                                <option value="premium">Premium</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelCls}>Subscription Status *</label>
                            <select value={data.subscription_status}
                                onChange={e => setData('subscription_status', e.target.value as typeof data.subscription_status)}
                                className={inputCls}>
                                <option value="active">Active</option>
                                <option value="trial">Trial</option>
                                <option value="expired">Expired</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelCls}>Max Doctors *</label>
                            <input type="number" min={1} value={data.max_doctors}
                                onChange={e => setData('max_doctors', parseInt(e.target.value))} className={inputCls} />
                        </div>

                        <div>
                            <label className={labelCls}>Max Patients / Month *</label>
                            <input type="number" min={1} value={data.max_patients_per_month}
                                onChange={e => setData('max_patients_per_month', parseInt(e.target.value))} className={inputCls} />
                        </div>

                        <div className="col-span-2 flex items-center gap-3">
                            <input type="checkbox" id="is_active" checked={data.is_active}
                                onChange={e => setData('is_active', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-teal-600" />
                            <label htmlFor="is_active" className="text-sm text-gray-700">Hospital is active</label>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                        <Link href={route('admin.hospitals.index')}
                            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                            Cancel
                        </Link>
                        <button type="submit" disabled={processing}
                            className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                            style={{ background: '#0f766e' }}>
                            {processing ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
