import Modal from '@/Components/Modal';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

const inputCls =
    'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

/**
 * Administrative password reset for another account.
 *
 * Posts to a dedicated endpoint rather than the profile form, so a routine
 * profile save can never change credentials as a side effect. There is no
 * current-password field: an admin cannot know the user's password, which is
 * the point of an administrative reset — the server compensates by auditing
 * the reset and rotating the target's remember-me token.
 *
 * Shared by the super-admin user form and the hospital-admin doctor form; the
 * caller supplies the endpoint so each stays within its own authorization
 * boundary.
 */
export default function PasswordResetModal({
    user,
    endpoint,
    show,
    onClose,
}: {
    user: { name: string; email: string };
    endpoint: string;
    show: boolean;
    onClose: () => void;
}) {
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
        put(endpoint, {
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
