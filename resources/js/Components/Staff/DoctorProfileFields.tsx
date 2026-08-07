const inputCls =
    'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

/**
 * Optional specialization / degrees for a doctor account, shared by the admin
 * create and edit forms.
 *
 * Specialization uses a native <datalist>: the listed disciplines are
 * suggestions that keep spelling consistent, but the input stays free text so
 * a sub-specialty that isn't listed is never blocked. Degrees is plain text
 * because it is normally a comma-separated combination ("MBBS, FCPS
 * (Medicine)") that a picker would clobber.
 */
export default function DoctorProfileFields({
    specialization,
    degrees,
    specializations,
    onChange,
    errors = {},
}: {
    specialization: string;
    degrees: string;
    specializations: string[];
    onChange: (field: 'specialization' | 'degrees', value: string) => void;
    errors?: Partial<Record<'specialization' | 'degrees', string>>;
}) {
    return (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <p className="mb-3 text-sm font-medium text-gray-700">
                Doctor details <span className="font-normal text-gray-500">— optional</span>
            </p>

            <div className="space-y-4">
                <div>
                    <label className={labelCls}>Specialization</label>
                    <input
                        type="text"
                        list="doctor-specializations"
                        value={specialization}
                        onChange={(e) => onChange('specialization', e.target.value)}
                        placeholder="Choose or type a specialization"
                        className={inputCls}
                    />
                    <datalist id="doctor-specializations">
                        {specializations.map((option) => (
                            <option key={option} value={option} />
                        ))}
                    </datalist>
                    {errors.specialization && <p className="mt-1 text-xs text-red-600">{errors.specialization}</p>}
                </div>

                <div>
                    <label className={labelCls}>Degrees / Qualifications</label>
                    <input
                        type="text"
                        value={degrees}
                        onChange={(e) => onChange('degrees', e.target.value)}
                        placeholder="e.g. MBBS, FCPS (Medicine)"
                        className={inputCls}
                    />
                    {errors.degrees && <p className="mt-1 text-xs text-red-600">{errors.degrees}</p>}
                </div>
            </div>

            <p className="mt-3 text-xs text-gray-500">
                Shown on prescriptions and the public doctor profile. Can be filled in later by the doctor or their
                hospital admin.
            </p>
        </div>
    );
}
