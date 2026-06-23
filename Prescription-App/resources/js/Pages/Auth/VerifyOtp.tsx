import GuestLayout from '@/Layouts/GuestLayout';
import OtpInput from '@/Components/OtpInput';
import InputError from '@/Components/InputError';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';

interface Props {
    email: string;
    purpose: 'registration' | 'password_reset';
    cooldown_seconds: number;
    otp_length: number;
}

export default function VerifyOtp({ email, purpose, cooldown_seconds, otp_length }: Props) {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        email,
        code: '',
    });

    const [cooldown, setCooldown] = useState(cooldown_seconds);
    const [resendStatus, setResendStatus] = useState<string | null>(null);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
        return () => clearInterval(t);
    }, [cooldown]);

    const codeReady = data.code.length === otp_length;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('verification.otp.verify'), {
            preserveScroll: true,
            onError: () => {
                reset('code');
            },
        });
    };

    function resend() {
        if (cooldown > 0) return;
        setResendStatus(null);
        clearErrors();
        router.post(
            route('verification.otp.resend'),
            { email, purpose },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCooldown(60);
                    setResendStatus('A new code has been sent to your email.');
                    reset('code');
                },
            },
        );
    }

    useEffect(() => {
        if (codeReady && !processing) submit({ preventDefault: () => {} } as unknown as React.FormEvent);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.code]);

    return (
        <GuestLayout>
            <Head title="Verify Email" />

            <div className="rounded-lg border border-gray-800 bg-gray-900 shadow-xl">
                <div className="p-6 pb-4 border-b border-gray-800 text-center">
                    <h2 className="text-xl font-semibold text-white tracking-tight">
                        {purpose === 'password_reset' ? 'Verify your code' : 'Verify your email'}
                    </h2>
                    <p className="mt-1 text-sm text-gray-400">
                        We sent a confirmation code to <span className="text-white">{email}</span>
                    </p>
                </div>

                <form onSubmit={submit} className="p-6 space-y-5">
                    <OtpInput
                        length={otp_length}
                        value={data.code}
                        onChange={(v) => setData('code', v)}
                        error={!!errors.code}
                        disabled={processing}
                    />

                    {errors.code && (
                        <div className="text-center">
                            <InputError message={errors.code} />
                        </div>
                    )}

                    {resendStatus && (
                        <div className="text-center text-sm text-emerald-400">{resendStatus}</div>
                    )}

                    <button
                        type="submit"
                        disabled={!codeReady || processing}
                        className="w-full h-10 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                    >
                        {processing ? 'Verifying…' : 'Verify'}
                    </button>

                    <div className="text-center text-sm text-gray-400">
                        Didn't get the code?{' '}
                        <button
                            type="button"
                            onClick={resend}
                            disabled={cooldown > 0 || processing}
                            className="text-emerald-400 hover:text-emerald-300 disabled:text-gray-600 disabled:cursor-not-allowed"
                        >
                            {cooldown > 0
                                ? `Resend in 0:${String(cooldown).padStart(2, '0')}`
                                : 'Send it again'}
                        </button>
                    </div>
                </form>
            </div>
        </GuestLayout>
    );
}
