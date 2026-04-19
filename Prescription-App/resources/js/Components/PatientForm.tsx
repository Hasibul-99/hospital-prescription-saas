import { useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Patient } from '@/types';

interface Props {
    patient?: Patient;
    submitUrl: string;
    method?: 'post' | 'put';
    cancelUrl: string;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function PatientForm({ patient, submitUrl, method = 'post', cancelUrl }: Props) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: patient?.name ?? '',
        age_years: patient?.age_years ?? '',
        age_months: patient?.age_months ?? '',
        age_days: patient?.age_days ?? '',
        date_of_birth: patient?.date_of_birth ?? '',
        gender: patient?.gender ?? 'male',
        phone: patient?.phone ?? '',
        email: patient?.email ?? '',
        address: patient?.address ?? '',
        blood_group: patient?.blood_group ?? '',
        profile_image: null as File | null,
        emergency_contact_name: patient?.emergency_contact_name ?? '',
        emergency_contact_phone: patient?.emergency_contact_phone ?? '',
        notes: patient?.notes ?? '',
    });

    const [duplicate, setDuplicate] = useState<Patient | null>(null);
    const [checkingDup, setCheckingDup] = useState(false);
    const dupDebounce = useRef<ReturnType<typeof setTimeout>>();

    // Duplicate detection on phone change
    useEffect(() => {
        if (!data.phone || data.phone.length < 5 || patient) {
            setDuplicate(null);
            return;
        }

        if (dupDebounce.current) clearTimeout(dupDebounce.current);

        dupDebounce.current = setTimeout(async () => {
            setCheckingDup(true);
            try {
                const { data: res } = await axios.get('/api/patients/check-duplicate', {
                    params: { phone: data.phone },
                });
                setDuplicate(res.exists ? res.patient : null);
            } catch {
                setDuplicate(null);
            } finally {
                setCheckingDup(false);
            }
        }, 500);

        return () => {
            if (dupDebounce.current) clearTimeout(dupDebounce.current);
        };
    }, [data.phone]);

    // Auto-calculate age from DOB
    function handleDobChange(dob: string) {
        setData('date_of_birth', dob);
        if (dob) {
            const birthDate = new Date(dob);
            const now = new Date();
            let years = now.getFullYear() - birthDate.getFullYear();
            let months = now.getMonth() - birthDate.getMonth();
            let days = now.getDate() - birthDate.getDate();

            if (days < 0) {
                months--;
                days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
            }
            if (months < 0) {
                years--;
                months += 12;
            }

            setData((prev: any) => ({
                ...prev,
                date_of_birth: dob,
                age_years: years,
                age_months: months,
                age_days: days,
            }));
        }
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (method === 'put') {
            put(submitUrl);
        } else {
            post(submitUrl);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Duplicate Warning */}
            {duplicate && (
                <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4">
                    <p className="text-sm font-medium text-yellow-800">
                        This phone number already exists for patient: <strong>{duplicate.name}</strong> ({duplicate.patient_uid})
                    </p>
                    <div className="mt-2 flex gap-2">
                        <a
                            href={`${cancelUrl}/${duplicate.id}`}
                            className="rounded bg-yellow-600 px-3 py-1 text-xs text-white hover:bg-yellow-700"
                        >
                            View Existing Patient
                        </a>
                        <button
                            type="button"
                            onClick={() => setDuplicate(null)}
                            className="rounded bg-gray-200 px-3 py-1 text-xs text-gray-700 hover:bg-gray-300"
                        >
                            Create Anyway
                        </button>
                    </div>
                </div>
            )}

            {/* Name */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                    <input
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Gender *</label>
                    <div className="mt-2 flex gap-4">
                        {(['male', 'female', 'other'] as const).map((g) => (
                            <label key={g} className="flex items-center gap-1 text-sm">
                                <input
                                    type="radio"
                                    name="gender"
                                    value={g}
                                    checked={data.gender === g}
                                    onChange={(e) => setData('gender', e.target.value as any)}
                                    className="text-blue-600"
                                />
                                {g.charAt(0).toUpperCase() + g.slice(1)}
                            </label>
                        ))}
                    </div>
                    {errors.gender && <p className="mt-1 text-xs text-red-600">{errors.gender}</p>}
                </div>
            </div>

            {/* Age / DOB */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <input
                        type="date"
                        value={data.date_of_birth}
                        onChange={(e) => handleDobChange(e.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Years</label>
                    <input
                        type="number"
                        min="0"
                        max="150"
                        value={data.age_years}
                        onChange={(e) => setData('age_years', e.target.value as any)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Months</label>
                    <input
                        type="number"
                        min="0"
                        max="11"
                        value={data.age_months}
                        onChange={(e) => setData('age_months', e.target.value as any)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Days</label>
                    <input
                        type="number"
                        min="0"
                        max="30"
                        value={data.age_days}
                        onChange={(e) => setData('age_days', e.target.value as any)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Phone / Email */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Phone * {checkingDup && <span className="text-xs text-gray-400">(checking...)</span>}
                    </label>
                    <input
                        type="text"
                        value={data.phone}
                        onChange={(e) => setData('phone', e.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>
            </div>

            {/* Address / Blood Group */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <textarea
                        value={data.address}
                        onChange={(e) => setData('address', e.target.value)}
                        rows={2}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Blood Group</label>
                    <select
                        value={data.blood_group}
                        onChange={(e) => setData('blood_group', e.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="">Select...</option>
                        {BLOOD_GROUPS.map((bg) => (
                            <option key={bg} value={bg}>{bg}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Profile Image */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setData('profile_image', e.target.files?.[0] ?? null)}
                    className="mt-1 text-sm"
                />
                {errors.profile_image && <p className="mt-1 text-xs text-red-600">{errors.profile_image}</p>}
            </div>

            {/* Emergency Contact */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Emergency Contact Name</label>
                    <input
                        type="text"
                        value={data.emergency_contact_name}
                        onChange={(e) => setData('emergency_contact_name', e.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Emergency Contact Phone</label>
                    <input
                        type="text"
                        value={data.emergency_contact_phone}
                        onChange={(e) => setData('emergency_contact_phone', e.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Notes */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    {processing ? 'Saving...' : patient ? 'Update Patient' : 'Register Patient'}
                </button>
                <a
                    href={cancelUrl}
                    className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                    Cancel
                </a>
            </div>
        </form>
    );
}
