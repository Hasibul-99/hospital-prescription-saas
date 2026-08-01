import PublicLayout from '@/Layouts/PublicLayout';
import { Head } from '@inertiajs/react';
import { ReactNode } from 'react';
import { toEnglishNumerals } from '@/utils/numerals';
import { timingLabel } from '@/utils/timingLabel';

interface Medicine {
    name: string;
    type: string | null;
    strength: string | null;
    generic: string | null;
    dose_display: string;
    timing: string | null;
    custom: string | null;
    duration: string;
}

interface Props {
    prescription: { uid: string; date: string | null; follow_up: string | null; status: string; printed_at: string | null };
    patient: { uid: string | null; display_name: string; gender: string | null; age_display: string; allergies: string[] };
    doctor: { name: string | null; degrees: string | null; specialization: string | null; designation: string | null; bmdc: string | null; bmdc_verified: boolean };
    hospital: { name: string | null; address: string | null; phone: string | null };
    medicines: Medicine[];
}

export default function RxVerify({ prescription, patient, doctor, hospital, medicines }: Props) {
    return (
        <>
            <Head title={`Prescription ${prescription.uid}`} />

            <div className="mx-auto max-w-2xl">
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center text-sm text-emerald-800">
                    ✓ Verified prescription · issued by {doctor.name ?? 'Unknown'}
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    {/* Header */}
                    <div className="flex items-start justify-between border-b pb-4">
                        <div>
                            <div className="text-lg font-semibold text-gray-900">{doctor.name}</div>
                            {doctor.degrees && <div className="text-xs text-gray-500">{doctor.degrees}</div>}
                            {doctor.specialization && <div className="text-sm text-teal-700">{doctor.specialization}</div>}
                            {doctor.bmdc && (
                                <div className="mt-1 text-xs text-gray-500">
                                    BMDC: {doctor.bmdc}
                                    {doctor.bmdc_verified && (
                                        <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800">✓ Verified</span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="text-right text-xs text-gray-500">
                            <div className="font-medium text-gray-900">{hospital.name}</div>
                            {hospital.address && <div>{hospital.address}</div>}
                            {hospital.phone && <div>Phone: {hospital.phone}</div>}
                        </div>
                    </div>

                    {/* Patient bar */}
                    <div className="mt-4 grid grid-cols-2 gap-3 rounded bg-gray-50 p-3 text-sm sm:grid-cols-4">
                        <div>
                            <div className="text-xs text-gray-500">Patient</div>
                            <div className="font-medium">{patient.display_name}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Patient ID</div>
                            <div className="font-mono text-xs">{patient.uid}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Age / Sex</div>
                            <div>{toEnglishNumerals(patient.age_display) || '—'} · {patient.gender ?? '—'}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Date</div>
                            <div>{toEnglishNumerals(prescription.date ?? '')}</div>
                        </div>
                    </div>

                    {patient.allergies.length > 0 && (
                        <div className="mt-3 rounded border-l-4 border-red-400 bg-red-50 p-2 text-sm text-red-800">
                            <span className="font-semibold">Drug allergies:</span> {patient.allergies.join(', ')}
                        </div>
                    )}

                    {/* Rx list */}
                    <div className="mt-5">
                        <div className="mb-2 text-xs font-medium uppercase text-gray-500">Rx</div>
                        {medicines.length === 0 ? (
                            <div className="text-sm text-gray-500">No medicines listed.</div>
                        ) : (
                            <ol className="space-y-3 pl-4 [list-style:decimal]">
                                {medicines.map((m, i) => (
                                    <li key={i}>
                                        <div className="font-semibold text-gray-900">
                                            {m.type && <span className="text-gray-500">{m.type}. </span>}
                                            {m.name}
                                            {m.strength && <span className="text-gray-500"> {m.strength}</span>}
                                        </div>
                                        {m.generic && <div className="text-xs text-gray-500">{m.generic}</div>}
                                        <div className="mt-1 text-sm text-gray-700">
                                            {toEnglishNumerals(m.dose_display) || '—'}
                                            {(m.custom || m.timing) && (
                                                <>
                                                    <span className="mx-2 text-gray-400">|</span>
                                                    {m.custom ? toEnglishNumerals(m.custom) : timingLabel(m.timing)}
                                                </>
                                            )}
                                            {m.duration && (
                                                <>
                                                    <span className="mx-2 text-gray-400">|</span>
                                                    {toEnglishNumerals(m.duration)}
                                                </>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>

                    {prescription.follow_up && (
                        <div className="mt-4 rounded border-l-4 border-teal-500 bg-teal-50 p-2 text-sm">
                            <span className="font-semibold text-teal-800">Follow-up:</span> {toEnglishNumerals(prescription.follow_up)}
                        </div>
                    )}

                    <div className="mt-6 border-t pt-3 text-xs text-gray-400">
                        Prescription ID: <span className="font-mono">{prescription.uid}</span>
                    </div>
                </div>

                <p className="mt-4 text-center text-xs text-gray-500">
                    Complaints, examinations and diagnosis are withheld on this public view for patient privacy.
                </p>
            </div>
        </>
    );
}

RxVerify.layout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>;
