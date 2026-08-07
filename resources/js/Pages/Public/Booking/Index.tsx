import PublicLayout from '@/Layouts/PublicLayout';
import { Head, Link } from '@inertiajs/react';
import { ReactNode } from 'react';
import Pagination from '@/Components/UI/Pagination';
import { CurrencyConfig, PaginatedData } from '@/types';
import { formatMoney } from '@/utils/currency';

interface Doctor {
    slug: string;
    name: string | null;
    degrees: string | null;
    specialization: string | null;
    designation: string | null;
    hospital: string | null;
    fee: number;
    /** The doctor's hospital currency — the directory can mix currencies. */
    currency: CurrencyConfig;
}

interface Props {
    doctors: PaginatedData<Doctor>;
}

export default function Index({ doctors }: Props) {
    return (
        <>
            <Head title="Find a doctor" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Find a doctor</h1>
                <p className="mt-1 text-sm text-gray-600">Pick a doctor to see their chambers and book an appointment.</p>
            </div>

            {doctors.data.length === 0 ? (
                <div className="rounded border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
                    No public doctor profiles yet.
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                    {doctors.data.map((d) => (
                        <Link
                            key={d.slug}
                            href={`/book/${d.slug}`}
                            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-teal-500 hover:shadow"
                        >
                            <div className="font-semibold text-gray-900">{d.name}</div>
                            {d.degrees && <div className="text-xs text-gray-500">{d.degrees}</div>}
                            {d.specialization && <div className="mt-1 text-sm text-teal-700">{d.specialization}</div>}
                            {d.hospital && <div className="mt-2 text-xs text-gray-500">at {d.hospital}</div>}
                            <div className="mt-3 text-sm">
                                <span className="font-medium">{formatMoney(d.fee, d.currency, { decimals: 0 })}</span>
                                <span className="ml-1 text-xs text-gray-500">consultation</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {doctors.meta.last_page > 1 && (
                <div className="mt-6 flex justify-center">
                    <Pagination
                        meta={doctors.meta}
                        onChange={(page) => (window.location.href = `/book?page=${page}`)}
                    />
                </div>
            )}
        </>
    );
}

Index.layout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>;
