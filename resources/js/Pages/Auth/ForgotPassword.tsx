import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            <div className="rounded-lg border border-gray-800 bg-gray-900 shadow-xl">
                <div className="p-6 pb-4 border-b border-gray-800">
                    <h2 className="text-xl font-semibold text-white tracking-tight">Forgot password</h2>
                    <p className="mt-1 text-sm text-gray-400">
                        Enter your email address and we'll send you a link to reset your password
                    </p>
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
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="20" height="16" x="2" y="4" rx="2"/>
                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                                </svg>
                            </span>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                placeholder="name@clinic.com"
                                required
                                autoFocus
                                onChange={e => setData('email', e.target.value)}
                                className="w-full h-10 bg-gray-800 border border-gray-800 rounded-md pl-10 pr-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-colors"
                                style={{ '--tw-ring-color': '#0f766e' } as React.CSSProperties}
                            />
                        </div>
                        <InputError message={errors.email} />
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full h-10 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: '#0f766e' }}
                        onMouseEnter={e => { if (!processing) (e.currentTarget as HTMLButtonElement).style.background = '#0d6460'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#0f766e'; }}
                    >
                        {processing ? 'Sending…' : 'Send reset link'}
                    </button>

                    <Link
                        href={route('login')}
                        className="flex items-center justify-center gap-2 w-full h-10 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m12 19-7-7 7-7"/>
                            <path d="M19 12H5"/>
                        </svg>
                        Back to login
                    </Link>
                </form>
            </div>
        </GuestLayout>
    );
}
