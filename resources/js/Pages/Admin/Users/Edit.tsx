import AdminLayout from '@/Layouts/AdminLayout';
import FlashMessage from '@/Components/FlashMessage';
import Modal from '@/Components/Modal';
import DoctorProfileFields from '@/Components/DoctorProfileFields';
import { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface User {
    id: number; name: string; email: string; role: string;
    hospital_id?: number | null; is_active: boolean;
    doctor_profile?: { specialization: string | null; degrees: string | null } | null;
}

interface Props extends PageProps {
    user: User;
    hospitals: { id: number; name: string }[];
    specializations: string[];
}

const inputCls = 'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

/**
 * Password reset lives in its own modal posting to its own endpoint, so a
 * routine profile save can never change credentials as a side effect.
 */
function PasswordModal({ user, show, onClose }: { user: User; show: boolean; onClose: () => void }) {
    const { data, setData, put, processing, errors, reset, clearErrors } = useForm({
        password: '',
        password_confirmation: '',
    });
    const [reveal, setReveal] = useState(false);

    function close() {
        reset();
        clearErrors();
        setReveal(false);
        onClose();
    }

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('admin.users.password', user.id), {
            preserveScroll: true,
            onSuccess: () => close(),
        });
    };

    return (
        <Modal show={show} maxWidth="md" onClose={close}>
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <h3 className="text-base font-semibold text-gray-900">Change password</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Set a new password for <span className="font-medium text-gray-700">{user.name}</span> ({user.email}).
                    </p>
                </div>

                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    The user is not notified automatically. Share the new password with them over a secure channel,
                    and ask them to change it after signing in.
                </div>

                <div>
                    <label className={labelCls}>New password *</label>
                    <input
                        type={reveal ? 'text' : 'password'}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoComplete="new-password"
                        required
                        className={inputCls}
                    />
                    {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                </div>

                <div>
                    <label className={labelCls}>Confirm new password *</label>
                    <input
                        type={reveal ? 'text' : 'password'}
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        autoComplete="new-password"
                        required
                        className={inputCls}
                    />
                    {errors.password_confirmation && (
                        <p className="mt-1 text-xs text-red-600">{errors.password_confirmation}</p>
                    )}
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                        type="checkbox"
                        checked={reveal}
                        onChange={(e) => setReveal(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-teal-600"
                    />
                    Show passwords
                </label>

                <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                    <button
                        type="button"
                        onClick={close}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                        style={{ background: '#0f766e' }}
                    >
                        {processing ? 'Updating…' : 'Update password'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default function Edit({ user, hospitals, specializations }: Props) {
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        name:           user.name,
        email:          user.email,
        role:           user.role,
        hospital_id:    user.hospital_id ?? ('' as string | number),
        is_active:      user.is_active,
        specialization: user.doctor_profile?.specialization ?? '',
        degrees:        user.doctor_profile?.degrees ?? '',
    });

    // A doctor profile only exists for doctors attached to a hospital.
    const showDoctorFields = data.role === 'doctor';

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('admin.users.update', user.id));
    };

    return (
        <AdminLayout>
            <Head title={`Edit — ${user.name}`} />
            <FlashMessage />

            <div className="mb-6 flex items-center gap-3">
                <Link href={route('admin.users.index')} className="text-gray-400 hover:text-gray-600">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
                    </svg>
                </Link>
                <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
            </div>

            <div className="max-w-lg space-y-4">
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className={labelCls}>Full Name *</label>
                            <input type="text" value={data.name} onChange={e => setData('name', e.target.value)}
                                required className={inputCls} />
                            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                        </div>

                        <div>
                            <label className={labelCls}>Email *</label>
                            <input type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                                required className={inputCls} />
                            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
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
                                <select value={data.hospital_id ?? ''}
                                    onChange={e => setData('hospital_id', e.target.value)} className={inputCls}>
                                    <option value="">None (Super Admin)</option>
                                    {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                </select>
                                {errors.hospital_id && <p className="mt-1 text-xs text-red-600">{errors.hospital_id}</p>}
                            </div>
                        </div>

                        {showDoctorFields && (
                            <DoctorProfileFields
                                specialization={data.specialization}
                                degrees={data.degrees}
                                specializations={specializations}
                                onChange={(field, value) => setData(field, value)}
                                errors={{ specialization: errors.specialization, degrees: errors.degrees }}
                            />
                        )}

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
                                {processing ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">Password</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Reset this user's password. Changed separately from the profile above, and recorded in the audit log.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowPasswordModal(true)}
                            className="flex-none rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Change password
                        </button>
                    </div>
                </div>
            </div>

            <PasswordModal user={user} show={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
        </AdminLayout>
    );
}
