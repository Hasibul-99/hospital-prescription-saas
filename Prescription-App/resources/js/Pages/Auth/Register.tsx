import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

const IcoUser = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
    </svg>
);

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

const inputBase = 'w-full h-10 bg-gray-800 border border-gray-800 rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-colors';

function Field({ label, id, type = 'text', value, onChange, placeholder, icon, error, autoFocus }: {
    label: string; id: string; type?: string; value: string;
    onChange: (v: string) => void; placeholder?: string;
    icon: React.ReactNode; error?: string; autoFocus?: boolean;
}) {
    const [show, setShow] = useState(false);
    const isPw = type === 'password';
    const actualType = isPw ? (show ? 'text' : 'password') : type;

    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="block text-sm font-medium text-gray-300">{label}</label>
            <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 pointer-events-none">{icon}</span>
                <input
                    id={id}
                    type={actualType}
                    name={id}
                    value={value}
                    placeholder={placeholder}
                    required
                    autoFocus={autoFocus}
                    onChange={e => onChange(e.target.value)}
                    className={`${inputBase} pl-10 ${isPw ? 'pr-10' : 'pr-3'}`}
                    style={{ '--tw-ring-color': '#0f766e' } as React.CSSProperties}
                />
                {isPw && (
                    <button type="button" onClick={() => setShow(v => !v)}
                        className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300 transition-colors">
                        {show ? <IcoEyeOff /> : <IcoEye />}
                    </button>
                )}
            </div>
            <InputError message={error} />
        </div>
    );
}

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), { onFinish: () => reset('password', 'password_confirmation') });
    };

    return (
        <GuestLayout>
            <Head title="Create account" />

            <div className="rounded-lg border border-gray-800 bg-gray-900 shadow-xl">
                <div className="p-6 pb-4 border-b border-gray-800">
                    <h2 className="text-xl font-semibold text-white tracking-tight">Sign up</h2>
                    <p className="mt-1 text-sm text-gray-400">Enter your information to create an account</p>
                </div>

                <form onSubmit={submit} className="p-6 space-y-5">
                    <Field label="Full Name" id="name" value={data.name} onChange={v => setData('name', v)}
                        placeholder="John Doe" icon={<IcoUser />} error={errors.name} autoFocus />

                    <Field label="Email" id="email" type="email" value={data.email}
                        onChange={v => setData('email', v)} placeholder="name@clinic.com"
                        icon={<IcoMail />} error={errors.email} />

                    <Field label="Password" id="password" type="password" value={data.password}
                        onChange={v => setData('password', v)} icon={<IcoLock />} error={errors.password} />

                    <Field label="Confirm Password" id="password_confirmation" type="password"
                        value={data.password_confirmation} onChange={v => setData('password_confirmation', v)}
                        icon={<IcoLock />} error={errors.password_confirmation} />

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full h-10 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: '#0f766e' }}
                        onMouseEnter={e => { if (!processing) (e.currentTarget as HTMLButtonElement).style.background = '#0d6460'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#0f766e'; }}
                    >
                        {processing ? 'Creating account…' : 'Create account'}
                    </button>

                    <p className="text-center text-sm text-gray-400">
                        Already have an account?{' '}
                        <Link href={route('login')} className="text-teal-400 hover:text-teal-300">Sign in</Link>
                    </p>
                </form>
            </div>
        </GuestLayout>
    );
}
