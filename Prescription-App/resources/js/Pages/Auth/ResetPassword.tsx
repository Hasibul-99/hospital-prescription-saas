import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

const IcoMail = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2"/>
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
);

const IcoLock = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
);

const IcoEye = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
);

const IcoEyeOff = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
        <line x1="2" x2="22" y1="2" y2="22"/>
    </svg>
);

function PwField({ label, id, value, onChange, error, autoFocus }: {
    label: string; id: string; value: string;
    onChange: (v: string) => void; error?: string; autoFocus?: boolean;
}) {
    const [show, setShow] = useState(false);
    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="block text-sm font-medium text-gray-300">{label}</label>
            <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 pointer-events-none"><IcoLock /></span>
                <input
                    id={id}
                    type={show ? 'text' : 'password'}
                    name={id}
                    value={value}
                    required
                    autoFocus={autoFocus}
                    onChange={e => onChange(e.target.value)}
                    className="w-full h-10 bg-gray-800 border border-gray-800 rounded-md pl-10 pr-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-colors"
                    style={{ '--tw-ring-color': '#0f766e' } as React.CSSProperties}
                />
                <button type="button" onClick={() => setShow(v => !v)}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300 transition-colors">
                    {show ? <IcoEyeOff /> : <IcoEye />}
                </button>
            </div>
            <InputError message={error} />
        </div>
    );
}

export default function ResetPassword({ token, email }: { token: string; email: string }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.store'), { onFinish: () => reset('password', 'password_confirmation') });
    };

    return (
        <GuestLayout>
            <Head title="Reset Password" />

            <div className="rounded-lg border border-gray-800 bg-gray-900 shadow-xl">
                <div className="p-6 pb-4 border-b border-gray-800">
                    <h2 className="text-xl font-semibold text-white tracking-tight">Reset your password</h2>
                    <p className="mt-1 text-sm text-gray-400">Choose a new password for your account</p>
                </div>

                <form onSubmit={submit} className="p-6 space-y-5">
                    <div className="space-y-1.5">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500 pointer-events-none"><IcoMail /></span>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                autoComplete="username"
                                onChange={e => setData('email', e.target.value)}
                                className="w-full h-10 bg-gray-800 border border-gray-800 rounded-md pl-10 pr-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-colors"
                                style={{ '--tw-ring-color': '#0f766e' } as React.CSSProperties}
                            />
                        </div>
                        <InputError message={errors.email} />
                    </div>

                    <PwField label="New Password" id="password" value={data.password}
                        onChange={v => setData('password', v)} error={errors.password} autoFocus />

                    <PwField label="Confirm Password" id="password_confirmation"
                        value={data.password_confirmation}
                        onChange={v => setData('password_confirmation', v)}
                        error={errors.password_confirmation} />

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full h-10 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: '#0f766e' }}
                        onMouseEnter={e => { if (!processing) (e.currentTarget as HTMLButtonElement).style.background = '#0d6460'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#0f766e'; }}
                    >
                        {processing ? 'Resetting…' : 'Reset password'}
                    </button>
                </form>
            </div>
        </GuestLayout>
    );
}
