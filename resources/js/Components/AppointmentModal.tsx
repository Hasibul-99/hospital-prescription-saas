import Modal from '@/Components/Modal';
import PatientSearch from '@/Components/PatientSearch';
import { Chamber, Patient, User } from '@/types';
import { router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface Props {
    onClose: () => void;
    defaultDate: string;
    chambers: Chamber[];
    defaultChamberId?: number;
    doctors?: Pick<User, 'id' | 'name'>[];
    defaultDoctorId?: number;
    submitUrl: string;
    context: 'doctor' | 'receptionist';
}

export default function AppointmentModal({
    onClose,
    defaultDate,
    chambers,
    defaultChamberId,
    doctors,
    defaultDoctorId,
    submitUrl,
    context,
}: Props) {
    const [patient, setPatient] = useState<Patient | null>(null);
    const [date, setDate] = useState(defaultDate);
    const [chamberId, setChamberId] = useState<number | ''>(defaultChamberId ?? '');
    const [doctorId, setDoctorId] = useState<number | ''>(defaultDoctorId ?? (doctors?.[0]?.id ?? ''));
    const [type, setType] = useState<'new_visit' | 'follow_up' | 'emergency'>('new_visit');
    const [feeAmount, setFeeAmount] = useState<string>('');
    const [feePaid, setFeePaid] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!patient) {
            setError('Please select a patient.');
            return;
        }
        setSubmitting(true);

        const payload: Record<string, unknown> = {
            patient_id: patient.id,
            appointment_date: date,
            type,
            chamber_id: chamberId || null,
            fee_amount: feeAmount === '' ? null : Number(feeAmount),
            fee_paid: feePaid,
            payment_method: feePaid ? paymentMethod : null,
            notes: notes || null,
        };

        if (context === 'receptionist') {
            payload.doctor_id = doctorId || null;
        }

        router.post(submitUrl, payload as any, {
            preserveScroll: true,
            onSuccess: () => onClose(),
            onError: (errs) => setError(Object.values(errs)[0] as string ?? 'Failed to save.'),
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <Modal show={true} onClose={onClose} maxWidth="2xl">
            <form onSubmit={submit} className="p-6">
                <h3 className="text-lg font-semibold text-gray-800">New Appointment</h3>

                {error && (
                    <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
                )}

                <div className="mt-4 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-600">Patient</label>
                        {patient ? (
                            <div className="mt-1 flex items-center justify-between rounded border bg-gray-50 px-3 py-2 text-sm">
                                <div>
                                    <div className="font-medium">{patient.name}</div>
                                    <div className="text-xs text-gray-500">{patient.patient_uid} · {patient.phone}</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setPatient(null)}
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    Change
                                </button>
                            </div>
                        ) : (
                            <>
                                <PatientSearch onSelect={setPatient} placeholder="Search by name, phone or UID..." className="mt-1" />
                                <div className="mt-1 text-xs text-gray-500">
                                    Or{' '}
                                    <a href={`/${context}/patients/create`} className="text-blue-600 hover:underline">
                                        register new patient
                                    </a>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600">Date</label>
                            <input
                                type="date"
                                value={date}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setDate(e.target.value)}
                                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600">Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as any)}
                                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                            >
                                <option value="new_visit">New Visit</option>
                                <option value="follow_up">Follow-up</option>
                                <option value="emergency">Emergency</option>
                            </select>
                        </div>

                        {context === 'receptionist' && doctors && (
                            <div>
                                <label className="block text-xs font-medium text-gray-600">Doctor</label>
                                <select
                                    value={doctorId}
                                    onChange={(e) => setDoctorId(e.target.value ? Number(e.target.value) : '')}
                                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                                >
                                    <option value="">Select doctor…</option>
                                    {doctors.map((d) => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {chambers.length > 0 && (
                            <div>
                                <label className="block text-xs font-medium text-gray-600">Chamber</label>
                                <select
                                    value={chamberId}
                                    onChange={(e) => setChamberId(e.target.value ? Number(e.target.value) : '')}
                                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                                >
                                    <option value="">None</option>
                                    {chambers.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600">Fee (৳)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={feeAmount}
                                onChange={(e) => setFeeAmount(e.target.value)}
                                placeholder="Auto from profile"
                                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600">Payment</label>
                            <div className="mt-1 flex items-center gap-2">
                                <label className="flex items-center gap-1 text-sm">
                                    <input type="checkbox" checked={feePaid} onChange={(e) => setFeePaid(e.target.checked)} />
                                    Paid
                                </label>
                                {feePaid && (
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="rounded border border-gray-300 px-2 py-1 text-sm"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="bkash">bKash</option>
                                        <option value="nagad">Nagad</option>
                                        <option value="rocket">Rocket</option>
                                        <option value="card">Card</option>
                                    </select>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600">Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        />
                    </div>
                </div>

                <div className="mt-5 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting || !patient}
                        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                        {submitting ? 'Saving…' : 'Book Appointment'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
