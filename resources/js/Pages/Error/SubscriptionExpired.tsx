import { Head, Link } from '@inertiajs/react';

/**
 * Rendered by EnsureHospitalActive when a hospital's subscription is expired or
 * suspended. Deliberately has no upgrade or payment link — billing is arranged
 * directly with the platform administrator, not self-serve.
 */
export default function SubscriptionExpired({ hospital }: { hospital: string }) {
    return (
        <>
            <Head title="Subscription inactive" />

            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
                <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 8v5M12 16v.5" />
                        </svg>
                    </div>

                    <h1 className="text-lg font-semibold text-gray-900">Subscription inactive</h1>

                    <p className="mt-3 text-sm leading-relaxed text-gray-600">
                        The subscription for <span className="font-medium text-gray-900">{hospital}</span> has expired
                        or been suspended, so this area is temporarily unavailable.
                    </p>

                    <p className="mt-3 text-sm leading-relaxed text-gray-600">
                        Your data is safe and nothing has been deleted. Contact your platform administrator to
                        reactivate the subscription.
                    </p>

                    <div className="mt-6 flex items-center justify-center gap-3">
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Log out
                        </Link>
                        <a
                            href="/"
                            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                            style={{ background: '#0f766e' }}
                        >
                            Back to home
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}
