import Modal from '@/Components/Modal';
import { MedicineInput } from '@/hooks/usePrescriptionReducer';
import { useEffect, useState } from 'react';

interface Props {
    show: boolean;
    onClose: () => void;
    medicine: MedicineInput | null;
    onSave: (patch: MedicineInput, saveAsDefault: boolean) => void;
    instructionPresets: string[];
    dayPresets: number[];
}

const SLOTS: { key: keyof MedicineInput; label: string }[] = [
    { key: 'dose_morning', label: 'সকাল (Morning)' },
    { key: 'dose_noon', label: 'দুপুর (Noon)' },
    { key: 'dose_afternoon', label: 'বিকাল (Afternoon)' },
    { key: 'dose_night', label: 'রাত (Night)' },
    { key: 'dose_bedtime', label: 'শয়নে (Bedtime)' },
];

const DURATION_UNITS = ['days', 'weeks', 'months', 'years', 'continue', 'N_A'] as const;

export default function DoseConfigModal({
    show,
    onClose,
    medicine,
    onSave,
    instructionPresets,
    dayPresets,
}: Props) {
    const [form, setForm] = useState<MedicineInput | null>(medicine);
    const [saveAsDefault, setSaveAsDefault] = useState(false);

    useEffect(() => {
        setForm(medicine);
        setSaveAsDefault(false);
    }, [medicine]);

    if (!form) return null;

    function toggleSlot(key: keyof MedicineInput) {
        setForm((f) => {
            if (!f) return f;
            const current = f[key];
            const next = current == null ? 1 : null;
            return { ...f, [key]: next };
        });
    }

    function setSlotValue(key: keyof MedicineInput, val: string) {
        setForm((f) => {
            if (!f) return f;
            const n = val === '' ? null : Number(val);
            return { ...f, [key]: Number.isNaN(n as number) ? null : n };
        });
    }

    function appendInstruction(preset: string) {
        setForm((f) => {
            if (!f) return f;
            const prev = f.custom_instruction?.trim();
            const merged = prev ? `${prev}; ${preset}` : preset;
            return { ...f, custom_instruction: merged };
        });
    }

    function commit() {
        if (!form) return;
        onSave(form, saveAsDefault);
    }

    const header = `${form.medicine_type ? abbreviate(form.medicine_type) + '. ' : ''}${form.medicine_name}${form.strength ? ' ' + form.strength : ''}`;

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <div className="p-5">
                <h3 className="mb-3 text-lg font-semibold text-gray-800">{header}</h3>

                <div className="rounded border border-gray-200 p-3">
                    <div className="mb-2 text-xs font-semibold text-gray-700">Dose Schedule</div>
                    <div className="grid grid-cols-5 gap-2">
                        {SLOTS.map((s) => {
                            const active = (form as any)[s.key] != null;
                            return (
                                <div key={s.key as string} className="flex flex-col items-center rounded border border-gray-200 p-2">
                                    <label className="flex cursor-pointer items-center gap-1 text-[11px] text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={active}
                                            onChange={() => toggleSlot(s.key)}
                                        />
                                        {s.label}
                                    </label>
                                    {active && (
                                        <input
                                            type="number"
                                            step="0.25"
                                            min="0"
                                            value={(form as any)[s.key] ?? ''}
                                            onChange={(e) => setSlotValue(s.key, e.target.value)}
                                            className="mt-1 w-16 rounded border border-gray-300 px-1 py-0.5 text-center text-sm"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-3 rounded border border-gray-200 p-3">
                    <label className="text-xs font-semibold text-gray-700">Instruction</label>
                    <textarea
                        value={form.custom_instruction ?? ''}
                        onChange={(e) => setForm({ ...form, custom_instruction: e.target.value })}
                        rows={2}
                        className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                        placeholder="e.g., খাবারের পরে"
                    />
                    <div className="mt-2 flex flex-wrap gap-1">
                        {instructionPresets.map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => appendInstruction(p)}
                                className="rounded border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-700 hover:bg-blue-50"
                            >
                                + {p}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-3 rounded border border-gray-200 p-3">
                    <label className="text-xs font-semibold text-gray-700">Take For (Duration)</label>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {dayPresets.map((d) => {
                            const active = form.duration_value === d && form.duration_unit === 'days';
                            return (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => setForm({ ...form, duration_value: d, duration_unit: 'days' })}
                                    className={`rounded border px-2 py-0.5 text-xs ${
                                        active
                                            ? 'border-blue-500 bg-blue-500 text-white'
                                            : 'border-gray-300 bg-white text-gray-700 hover:bg-blue-50'
                                    }`}
                                >
                                    {d} day{d > 1 ? 's' : ''}
                                </button>
                            );
                        })}
                        <input
                            type="number"
                            min="0"
                            value={
                                form.duration_unit === 'days' && !dayPresets.includes(Number(form.duration_value))
                                    ? (form.duration_value ?? '')
                                    : ''
                            }
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    duration_value: e.target.value === '' ? null : Number(e.target.value),
                                    duration_unit: 'days',
                                })
                            }
                            placeholder="Custom days"
                            className="w-24 rounded border border-gray-300 px-2 py-0.5 text-xs"
                        />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {DURATION_UNITS.filter((u) => u !== 'days').map((unit) => (
                            <label
                                key={unit}
                                className={`flex cursor-pointer items-center gap-1 rounded border px-2 py-0.5 text-xs ${
                                    form.duration_unit === unit
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 text-gray-700'
                                }`}
                            >
                                <input
                                    type="radio"
                                    checked={form.duration_unit === unit}
                                    onChange={() => setForm({ ...form, duration_unit: unit })}
                                />
                                {unitLabel(unit)}
                            </label>
                        ))}
                        {form.duration_unit && !['days', 'continue', 'N_A'].includes(form.duration_unit) && (
                            <input
                                type="number"
                                min="0"
                                value={form.duration_value ?? ''}
                                onChange={(e) =>
                                    setForm({ ...form, duration_value: e.target.value === '' ? null : Number(e.target.value) })
                                }
                                placeholder={`# ${form.duration_unit}`}
                                className="w-24 rounded border border-gray-300 px-2 py-0.5 text-xs"
                            />
                        )}
                    </div>
                </div>

                {form.medicine_id && (
                    <label className="mt-3 flex items-center gap-2 text-xs text-gray-700">
                        <input
                            type="checkbox"
                            checked={saveAsDefault}
                            onChange={(e) => setSaveAsDefault(e.target.checked)}
                        />
                        Set as default settings for this medicine
                    </label>
                )}

                <div className="mt-4 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded border border-gray-300 bg-white px-4 py-1.5 text-sm hover:bg-gray-50"
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        onClick={commit}
                        className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        ✏️ Update
                    </button>
                </div>
            </div>
        </Modal>
    );
}

function unitLabel(u: string): string {
    switch (u) {
        case 'weeks': return 'Weeks';
        case 'months': return 'Months';
        case 'years': return 'Years';
        case 'continue': return 'চলবে (Continue)';
        case 'N_A': return 'N/A';
        default: return u;
    }
}

function abbreviate(type: string): string {
    const t = type.toLowerCase();
    if (t.startsWith('tab')) return 'Tab';
    if (t.startsWith('cap')) return 'Cap';
    if (t.startsWith('syr')) return 'Syr';
    if (t.startsWith('inj')) return 'Inj';
    if (t.startsWith('sup')) return 'Supp';
    if (t.startsWith('cre')) return 'Cream';
    if (t.startsWith('oin')) return 'Oint';
    if (t.startsWith('dro')) return 'Drops';
    if (t.startsWith('gel')) return 'Gel';
    if (t.startsWith('pow')) return 'Pwd';
    return type;
}
