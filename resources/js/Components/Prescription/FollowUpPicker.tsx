import { useState } from 'react';

interface Props {
    followUpDate: string | null;
    durationValue: number | null;
    durationUnit: 'days' | 'months' | 'years' | null;
    onChange: (
        date: string | null,
        value: number | null,
        unit: 'days' | 'months' | 'years' | null,
    ) => void;
    onSaveAsTemplate: (name: string) => void;
}

function addDays(base: Date, days: number): string {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

function addBy(value: number, unit: 'days' | 'months' | 'years'): string {
    const d = new Date();
    if (unit === 'days') d.setDate(d.getDate() + value);
    if (unit === 'months') d.setMonth(d.getMonth() + value);
    if (unit === 'years') d.setFullYear(d.getFullYear() + value);
    return d.toISOString().slice(0, 10);
}

const QUICK = [1, 7, 15, 30, 90, 180];

export default function FollowUpPicker({
    followUpDate,
    durationValue,
    durationUnit,
    onChange,
    onSaveAsTemplate,
}: Props) {
    const [tplName, setTplName] = useState('');
    const [afterValue, setAfterValue] = useState<number | ''>(durationValue ?? '');
    const [afterUnit, setAfterUnit] = useState<'days' | 'months' | 'years'>(durationUnit ?? 'days');

    return (
        <section className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">Next Follow-up</h3>

            <div className="flex flex-wrap items-center gap-3">
                <input
                    type="date"
                    value={followUpDate ?? ''}
                    onChange={(e) => onChange(e.target.value || null, null, null)}
                    className="rounded border border-gray-300 px-3 py-1.5 text-sm"
                />

                <div className="flex flex-wrap gap-1">
                    {QUICK.map((d) => (
                        <button
                            key={d}
                            type="button"
                            onClick={() => onChange(addDays(new Date(), d), d, 'days')}
                            className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs hover:bg-blue-50"
                        >
                            +{d}d
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">After</span>
                    <input
                        type="number"
                        min={0}
                        value={afterValue}
                        onChange={(e) => setAfterValue(e.target.value ? Number(e.target.value) : '')}
                        className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                    {(['days', 'months', 'years'] as const).map((u) => (
                        <label key={u} className="flex items-center gap-1 text-xs">
                            <input
                                type="radio"
                                checked={afterUnit === u}
                                onChange={() => setAfterUnit(u)}
                            />
                            {u}
                        </label>
                    ))}
                    <button
                        type="button"
                        disabled={!afterValue}
                        onClick={() => {
                            if (!afterValue) return;
                            const d = addBy(Number(afterValue), afterUnit);
                            onChange(d, Number(afterValue), afterUnit);
                        }}
                        className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:bg-gray-300"
                    >
                        Apply
                    </button>
                </div>

                {followUpDate && (
                    <button
                        type="button"
                        onClick={() => onChange(null, null, null)}
                        className="text-xs text-red-600 hover:underline"
                    >
                        Clear
                    </button>
                )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
                <input
                    type="text"
                    value={tplName}
                    onChange={(e) => setTplName(e.target.value)}
                    placeholder="Template Name (e.g., Common Cold)"
                    className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm"
                />
                <button
                    type="button"
                    disabled={!tplName.trim()}
                    onClick={() => {
                        onSaveAsTemplate(tplName.trim());
                        setTplName('');
                    }}
                    className="rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:bg-gray-300"
                >
                    Save as Template
                </button>
            </div>
        </section>
    );
}
