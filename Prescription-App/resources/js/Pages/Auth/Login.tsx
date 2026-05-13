import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';
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

const inputCls = 'w-full h-10 bg-gray-800 border border-gray-800 rounded-md pl-10 pr-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-colors';
const inputClsNoRight = 'w-full h-10 bg-gray-800 border border-gray-800 rounded-md pl-10 pr-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-colors';

export default function Login({ status, canResetPassword }: { status?: string; canResetPassword: boolean }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const [showPw, setShowPw] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    return (
        <GuestLayout>
            <Head title="Sign in" />

            <div className="rounded-lg border border-gray-800 bg-gray-900 shadow-xl">
                <div className="p-6 pb-4 border-b border-gray-800">
                    <h2 className="text-xl font-semibold text-white tracking-tight">Sign in to your account</h2>
                    <p className="mt-1 text-sm text-gray-400">Enter your credentials to access the dashboard</p>
                </div>

                {status && (
                    <div className="mx-6 mt-4 rounded-md bg-green-900/40 border border-green-800 px-4 py-2 text-sm text-green-400">
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="p-6 space-y-5">
                    <div className="space-y-1.5">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500 pointer-events-none">
                                <IcoMail />
                            </span>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                placeholder="name@clinic.com"
                                autoComplete="username"
                                autoFocus
                                required
                                onChange={e => setData('email', e.target.value)}
                                className={inputClsNoRight}
                                style={{ '--tw-ring-color': '#0f766e' } as React.CSSProperties}
                            />
                        </div>
                        <InputError message={errors.email} />
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
                            {canResetPassword && (
                                <Link href={route('password.request')} className="text-xs text-teal-400 hover:text-teal-300">
                                    Forgot password?
                                </Link>
                            )}
                        </div>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500 pointer-events-none">
                                <IcoLock />
                            </span>
                            <input
                                id="password"
                                type={showPw ? 'text' : 'password'}
                                name="password"
                                value={data.password}
                                placeholder="Password"
                                autoComplete="current-password"
                                required
                                onChange={e => setData('password', e.target.value)}
                                className={inputCls}
                                style={{ '--tw-ring-color': '#0f766e' } as React.CSSProperties}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw(v => !v)}
                                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300 transition-colors"
                            >
                                {showPw ? <IcoEyeOff /> : <IcoEye />}
                            </button>
                        </div>
                        <InputError message={errors.password} />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="remember"
                            checked={data.remember}
                            onChange={e => setData('remember', e.target.checked as false)}
                            className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-teal-600 focus:ring-teal-600 focus:ring-offset-gray-900"
                        />
                        <label htmlFor="remember" className="text-sm text-gray-300">Remember me for 30 days</label>
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full h-10 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: '#0f766e' }}
                        onMouseEnter={e => { if (!processing) (e.currentTarget as HTMLButtonElement).style.background = '#0d6460'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#0f766e'; }}
                    >
                        {processing ? 'Signing in…' : 'Sign in'}
                    </button>

                    <p className="text-center text-sm text-gray-400">
                        {"Don't have an account? "}
                        <Link href={route('register')} className="text-teal-400 hover:text-teal-300">Create an account</Link>
                    </p>
                </form>
            </div>
        </GuestLayout>
    );
}
