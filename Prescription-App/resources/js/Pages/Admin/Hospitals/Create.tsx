import AdminLayout from '@/Layouts/AdminLayout';
import { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

const inputCls = 'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

export default function Create(_: PageProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        subscription_plan: 'basic' as 'free' | 'basic' | 'premium' | 'enterprise',
        max_doctors: 5,
        max_patients_per_month: 500,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('admin.hospitals.store'));
    };

    return (
        <AdminLayout>
            <Head title="Add Hospital" />

            <div className="mb-6 flex items-center gap-3">
                <Link href={route('admin.hospitals.index')} className="text-gray-400 hover:text-gray-600">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
                    </svg>
                </Link>
                <h2 className="text-xl font-bold text-gray-900">Add Hospital</h2>
            </div>

            <div className="max-w-2xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <form onSubmit={submit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className={labelCls}>Hospital Name *</label>
                            <input type="text" value={data.name} onChange={e => setData('name', e.target.value)}
                                placeholder="City Medical Center" required className={inputCls} />
                            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                        </div>

                        <div>
                            <label className={labelCls}>Slug</label>
                            <input type="text" value={data.slug} onChange={e => setData('slug', e.target.value)}
                                placeholder="auto-generated" className={inputCls} />
                            {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug}</p>}
                        </div>

                        <div>
                            <label className={labelCls}>Phone</label>
                            <input type="text" value={data.phone} onChange={e => setData('phone', e.target.value)}
                                placeholder="+880 1700 000000" className={inputCls} />
                        </div>

                        <div>
                            <label className={labelCls}>Email</label>
                            <input type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                                placeholder="admin@hospital.com" className={inputCls} />
                        </div>

                        <div>
                            <label className={labelCls}>Website</label>
                            <input type="text" value={data.website} onChange={e => setData('website', e.target.value)}
                                placeholder="https://hospital.com" className={inputCls} />
                        </div>

                        <div className="col-span-2">
                            <label className={labelCls}>Address</label>
                            <textarea value={data.address} onChange={e => setData('address', e.target.value)}
                                rows={2} placeholder="Full address…" className={inputCls} />
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
                            {errors.subscription_plan && <p className="mt-1 text-xs text-red-600">{errors.subscription_plan}</p>}
                        </div>

                        <div>
                            <label className={labelCls}>Max Doctors *</label>
                            <input type="number" min={1} value={data.max_doctors}
                                onChange={e => setData('max_doctors', parseInt(e.target.value))}
                                className={inputCls} />
                            {errors.max_doctors && <p className="mt-1 text-xs text-red-600">{errors.max_doctors}</p>}
                        </div>

                        <div>
                            <label className={labelCls}>Max Patients / Month *</label>
                            <input type="number" min={1} value={data.max_patients_per_month}
                                onChange={e => setData('max_patients_per_month', parseInt(e.target.value))}
                                className={inputCls} />
                            {errors.max_patients_per_month && <p className="mt-1 text-xs text-red-600">{errors.max_patients_per_month}</p>}
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
                            {processing ? 'Creating…' : 'Create Hospital'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
