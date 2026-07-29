import PublicLayout from '@/Layouts/PublicLayout';
import OtpInput from '@/Components/OtpInput';
import InputError from '@/Components/InputError';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, ReactNode } from 'react';

interface Props {
    email: string;
    otp_length: number;
}

export default function Verify({ email, otp_length }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({ code: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/book/verify', {
            preserveScroll: true,
            onError: () => reset('code'),
        });
    };

    return (
        <>
            <Head title="Confirm booking" />

            <div className="mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h1 className="text-lg font-semibold text-gray-900">Enter your confirmation code</h1>
                <p className="mt-1 text-sm text-gray-600">
                    We sent a {otp_length}-digit code to <span className="font-medium text-gray-900">{email}</span>.
                </p>

                <form onSubmit={submit} className="mt-5 space-y-4">
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

                    <button
                        type="submit"
                        disabled={processing || data.code.length !== otp_length}
                        className="w-full rounded bg-teal-600 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                        {processing ? 'Confirming…' : 'Confirm appointment'}
                    </button>
                </form>
            </div>
        </>
    );
}

Verify.layout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>;
