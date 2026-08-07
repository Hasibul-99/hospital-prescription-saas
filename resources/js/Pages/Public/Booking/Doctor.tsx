import PublicLayout from '@/Layouts/PublicLayout';
import { Head, router } from '@inertiajs/react';
import { FormEvent, ReactNode, useEffect, useState } from 'react';
import InputError from '@/Components/InputError';
import { CurrencyConfig } from '@/types';
import { formatMoney } from '@/utils/currency';

interface Chamber {
    id: number;
    name: string;
    room_number: string | null;
    floor: string | null;
    building: string | null;
    schedule: Record<string, string> | null;
    daily_slot_cap: number | null;
}

interface Doctor {
    slug: string;
    name: string | null;
    degrees: string | null;
    specialization: string | null;
    designation: string | null;
    bmdc: string | null;
    hospital: { id: number; name: string; address: string | null; phone: string | null } | null;
    fee: number;
}

interface Props {
    doctor: Doctor;
    chambers: Chamber[];
    /** This doctor's hospital currency, not the platform default. */
    currency: CurrencyConfig;
    errors: Partial<Record<string, string>>;
}

export default function Doctor({ doctor, chambers, currency, errors }: Props) {
    const [chamberId, setChamberId] = useState<number | null>(chambers[0]?.id ?? null);
    const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [slots, setSlots] = useState<{ cap: number; taken: number; remaining: number; is_holiday: boolean } | null>(null);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!chamberId || !date) return;
        setLoadingSlots(true);
        fetch(`/book/${doctor.slug}/slots?chamber_id=${chamberId}&date=${date}`, {
            headers: { Accept: 'application/json' },
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((json) => setSlots(json))
            .catch(() => setSlots(null))
            .finally(() => setLoadingSlots(false));
    }, [chamberId, date, doctor.slug]);

    function submit(e: FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        router.post(
            '/book',
            {
                doctor_slug: doctor.slug,
                chamber_id: chamberId,
                date,
                patient_name: name,
                patient_phone: phone,
                patient_email: email,
            },
            {
                onFinish: () => setSubmitting(false),
            },
        );
    }

    const disabled = !chamberId || !date || !name || !phone || !email || submitting
        || (slots ? slots.remaining <= 0 || slots.is_holiday : false);

    return (
        <>
            <Head title={`Book — ${doctor.name}`} />

            <div className="grid gap-6 lg:grid-cols-3">
                <aside className="lg:col-span-1">
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="font-semibold text-gray-900">{doctor.name}</div>
                        {doctor.degrees && <div className="text-xs text-gray-500">{doctor.degrees}</div>}
                        {doctor.specialization && <div className="mt-1 text-sm text-teal-700">{doctor.specialization}</div>}
                        {doctor.designation && <div className="mt-1 text-xs text-gray-500">{doctor.designation}</div>}
                        {doctor.bmdc && <div className="mt-2 text-xs text-gray-500">BMDC: {doctor.bmdc}</div>}
                        {doctor.hospital && (
                            <div className="mt-3 border-t pt-3 text-xs text-gray-600">
                                <div className="font-medium">{doctor.hospital.name}</div>
                                {doctor.hospital.address && <div>{doctor.hospital.address}</div>}
                                {doctor.hospital.phone && <div>Phone: {doctor.hospital.phone}</div>}
                            </div>
                        )}
                        <div className="mt-3 border-t pt-3 text-sm">
                            <span className="font-medium">{formatMoney(doctor.fee, currency, { decimals: 0 })}</span>
                            <span className="ml-1 text-xs text-gray-500">consultation fee</span>
                        </div>
                    </div>
                </aside>

                <form onSubmit={submit} className="lg:col-span-2 space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Chamber</label>
                        <select
                            value={chamberId ?? ''}
                            onChange={(e) => setChamberId(Number(e.target.value))}
                            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        >
                            {chambers.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}{c.room_number ? ` — Room ${c.room_number}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            min={new Date().toISOString().slice(0, 10)}
                            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        />
                        <div className="mt-1 text-xs text-gray-500">
                            {loadingSlots
                                ? 'Checking availability…'
                                : slots
                                    ? slots.is_holiday
                                        ? 'This date is a hospital holiday.'
                                        : `${slots.remaining} of ${slots.cap} slots available.`
                                    : ''}
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Your name</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
                            <InputError message={errors?.patient_name} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
                            <InputError message={errors?.patient_phone} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email (for confirmation code)</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
                        <InputError message={errors?.patient_email} />
                    </div>

                    {errors?.date && <InputError message={errors.date} />}
                    {errors?.email && <InputError message={errors.email} />}

                    <button
                        type="submit"
                        disabled={disabled}
                        className="w-full rounded bg-teal-600 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                        {submitting ? 'Sending code…' : 'Book appointment'}
                    </button>
                </form>
            </div>
        </>
    );
}

Doctor.layout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>;
