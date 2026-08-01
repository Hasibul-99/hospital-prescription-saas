import DoctorLayout from '@/Layouts/DoctorLayout';
import { Head } from '@inertiajs/react';
import { FormEvent, ReactNode, useState } from 'react';

type DocType = 'fitness' | 'sick_leave' | 'referral';

interface PatientLite {
    id: number;
    patient_uid: string;
    name: string;
    gender: string | null;
    age_years: number | null;
    age_months: number | null;
    phone: string;
}

interface Props {
    type: DocType;
    patient: PatientLite | null;
}

const TITLES: Record<DocType, string> = {
    fitness: 'Medical Fitness Certificate',
    sick_leave: 'Sick-Leave Certificate',
    referral: 'Referral Letter',
};

const PLACEHOLDERS: Record<DocType, string> = {
    fitness: 'e.g., This is to certify that the above-named person is medically fit to resume duties/travel/…',
    sick_leave: 'e.g., The above-named patient is advised bed rest / medical leave due to acute febrile illness.',
    referral: 'e.g., Kindly evaluate and manage the above-named patient for further investigation of persistent chest pain.',
};

export default function Create({ type, patient }: Props) {
    const [patientId, setPatientId] = useState<number | ''>(patient?.id ?? '');
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [bodyText, setBodyText] = useState('');
    const [durationText, setDurationText] = useState('');
    const [referredTo, setReferredTo] = useState('');

    function submit(e: FormEvent) {
        e.preventDefault();
        // POST to a new tab so the PDF opens directly.
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/doctor/documents/${type}/render`;
        form.target = '_blank';

        const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
        const put = (name: string, value: string) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value = value;
            form.appendChild(input);
        };
        put('_token', csrf);
        put('patient_id', String(patientId));
        put('date', date);
        put('body_text', bodyText);
        put('duration_text', durationText);
        put('referred_to', referredTo);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    }

    return (
        <>
            <Head title={TITLES[type]} />

            <h1 className="mb-4 text-xl font-semibold text-gray-800">{TITLES[type]}</h1>

            <form onSubmit={submit} className="mx-auto max-w-2xl space-y-4 rounded-lg bg-white p-5 shadow-sm">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Patient ID</label>
                    <input
                        type="number"
                        required
                        value={patientId}
                        onChange={(e) => setPatientId(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Numeric patient ID"
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                    {patient && (
                        <div className="mt-1 text-xs text-gray-500">
                            Pre-selected: <strong>{patient.name}</strong> ({patient.patient_uid}) · {patient.phone}
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                </div>

                {type === 'referral' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Referred to</label>
                        <input
                            type="text"
                            value={referredTo}
                            onChange={(e) => setReferredTo(e.target.value)}
                            placeholder="e.g., Dr. Kamal Ahmed, Cardiology, Square Hospital"
                            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        {type === 'referral' ? 'Reason for referral' : 'Certificate body'}
                    </label>
                    <textarea
                        required
                        rows={6}
                        value={bodyText}
                        onChange={(e) => setBodyText(e.target.value)}
                        placeholder={PLACEHOLDERS[type]}
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm font-serif"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        {type === 'sick_leave' ? 'Leave duration' : type === 'fitness' ? 'Validity' : 'Duration (optional)'}
                    </label>
                    <input
                        type="text"
                        value={durationText}
                        onChange={(e) => setDurationText(e.target.value)}
                        placeholder="e.g., 3 days from 2026-07-30 to 2026-08-01"
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        type="submit"
                        className="rounded bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
                    >
                        Generate PDF
                    </button>
                    <a
                        href="/doctor/dashboard"
                        className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                        Cancel
                    </a>
                </div>
            </form>
        </>
    );
}

Create.layout = (page: ReactNode) => <DoctorLayout>{page}</DoctorLayout>;
