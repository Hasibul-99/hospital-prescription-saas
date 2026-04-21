import Modal from '@/Components/Modal';
import MedicineSearch from './MedicineSearch';
import { MedicineInput } from '@/hooks/usePrescriptionReducer';
import { Medicine } from '@/types';
import { useState } from 'react';

interface Props {
    show: boolean;
    onClose: () => void;
    frequent: Medicine[];
    addedMedicines: MedicineInput[];
    onPickFromFrequent: (m: Medicine) => void;
    onPickFromSearch: (m: Medicine) => void;
    onEditAdded: (index: number) => void;
    onRemoveAdded: (index: number) => void;
}

export default function AddMedicineModal({
    show,
    onClose,
    frequent,
    addedMedicines,
    onPickFromFrequent,
    onPickFromSearch,
    onEditAdded,
    onRemoveAdded,
}: Props) {
    const [missingOpen, setMissingOpen] = useState(false);

    return (
        <>
            <Modal show={show} onClose={onClose} maxWidth="3xl">
                <div className="flex max-h-[85vh] flex-col sm:flex-row">
                    <aside className="w-full shrink-0 overflow-y-auto border-b border-gray-200 bg-gray-50 p-3 sm:w-[300px] sm:border-b-0 sm:border-r">
                        <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">
                            Commonly used drugs
                        </h3>
                        {frequent.length === 0 ? (
                            <p className="text-xs text-gray-500">
                                No frequent medicines yet. Search and pick medicines on the right; they will be added to this list.
                            </p>
                        ) : (
                            <ul className="space-y-0.5">
                                {frequent.map((m) => (
                                    <li key={m.id}>
                                        <button
                                            type="button"
                                            onClick={() => onPickFromFrequent(m)}
                                            className="w-full rounded px-2 py-1 text-left text-sm text-gray-700 hover:bg-blue-50"
                                        >
                                            • {m.brand_name}
                                            {m.strength && (
                                                <span className="text-xs text-gray-500"> ({m.type}, {m.strength})</span>
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </aside>

                    <section className="flex-1 overflow-y-auto p-4">
                        <MedicineSearch
                            onSelect={onPickFromSearch}
                            onOpenMissing={() => setMissingOpen(true)}
                        />

                        {addedMedicines.length > 0 && (
                            <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-3">
                                <div className="mb-2 text-xs font-semibold text-gray-700">
                                    Added ({addedMedicines.length})
                                </div>
                                <ul className="space-y-1">
                                    {addedMedicines.map((m, i) => (
                                        <li key={i} className="flex items-center justify-between rounded bg-white px-2 py-1 text-sm">
                                            <span className="truncate text-gray-800">
                                                <span className="mr-1 text-gray-500">{i + 1}.</span>
                                                {label(m)}
                                            </span>
                                            <span className="flex gap-2 text-xs">
                                                <button
                                                    type="button"
                                                    onClick={() => onEditAdded(i)}
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onRemoveAdded(i)}
                                                    className="text-red-600 hover:underline"
                                                >
                                                    delete
                                                </button>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="mt-4 flex justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded border border-gray-300 bg-white px-4 py-1.5 text-sm hover:bg-gray-50"
                            >
                                Close
                            </button>
                        </div>
                    </section>
                </div>
            </Modal>

            <MissingMedicineModal
                show={missingOpen}
                onClose={() => setMissingOpen(false)}
                onCreated={(m) => {
                    setMissingOpen(false);
                    onPickFromSearch(m);
                }}
            />
        </>
    );
}

function label(m: MedicineInput): string {
    const abbr = abbreviate(m.medicine_type ?? '');
    return `${abbr ? abbr + '. ' : ''}${m.medicine_name}${m.strength ? ' ' + m.strength : ''}`;
}

function abbreviate(type: string): string {
    const t = type.toLowerCase();
    if (t.startsWith('tab')) return 'Tab';
    if (t.startsWith('cap')) return 'Cap';
    if (t.startsWith('syr')) return 'Syr';
    if (t.startsWith('inj')) return 'Inj';
    return type;
}

function MissingMedicineModal({
    show,
    onClose,
    onCreated,
}: {
    show: boolean;
    onClose: () => void;
    onCreated: (m: Medicine) => void;
}) {
    const [form, setForm] = useState({
        brand_name: '',
        generic_name: '',
        type: 'Tablet',
        strength: '',
        manufacturer: '',
    });
    const [saving, setSaving] = useState(false);

    async function submit() {
        if (!form.brand_name.trim()) {
            alert('Brand name required');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('/doctor/medicines', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '',
                },
                credentials: 'same-origin',
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error('Save failed');
            const data = await res.json();
            onCreated(data.medicine);
            setForm({ brand_name: '', generic_name: '', type: 'Tablet', strength: '', manufacturer: '' });
        } catch {
            alert('Failed to add medicine.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <div className="p-5">
                <h3 className="mb-3 text-lg font-semibold text-gray-800">Add Missing Medicine</h3>
                <p className="mb-2 text-xs text-amber-700">
                    Medicine will be submitted for admin approval. You can still use it immediately.
                </p>
                <div className="space-y-2">
                    <Field label="Brand name *">
                        <input
                            type="text"
                            value={form.brand_name}
                            onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
                            className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                        />
                    </Field>
                    <Field label="Generic name">
                        <input
                            type="text"
                            value={form.generic_name}
                            onChange={(e) => setForm({ ...form, generic_name: e.target.value })}
                            className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                        />
                    </Field>
                    <div className="grid grid-cols-2 gap-2">
                        <Field label="Type">
                            <select
                                value={form.type}
                                onChange={(e) => setForm({ ...form, type: e.target.value })}
                                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                            >
                                {['Tablet', 'Syrup', 'Capsule', 'Injection', 'Suppository', 'Cream', 'Drops', 'Mouthwash', 'Toothpaste', 'Gel', 'Powder', 'Suspension', 'Ointment', 'Inhaler'].map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Strength">
                            <input
                                type="text"
                                value={form.strength}
                                onChange={(e) => setForm({ ...form, strength: e.target.value })}
                                className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                                placeholder="e.g., 500 mg"
                            />
                        </Field>
                    </div>
                    <Field label="Manufacturer">
                        <input
                            type="text"
                            value={form.manufacturer}
                            onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                            className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                        />
                    </Field>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded border border-gray-300 bg-white px-4 py-1.5 text-sm hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={submit}
                        disabled={saving}
                        className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? 'Saving…' : 'Add Medicine'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="text-xs font-medium text-gray-600">{label}</span>
            <div className="mt-1">{children}</div>
        </label>
    );
}
