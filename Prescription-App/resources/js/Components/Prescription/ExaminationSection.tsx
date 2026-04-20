import SectionAccordion from './SectionAccordion';
import { ExaminationInput } from '@/hooks/usePrescriptionReducer';

interface Props {
    items: ExaminationInput[];
    onAdd: (e: ExaminationInput) => void;
    onUpdate: (i: number, patch: Partial<ExaminationInput>) => void;
    onRemove: (i: number) => void;
}

const COMMON = ['Temperature', 'BP', 'Pulse', 'SpO2', 'Weight', 'Height', 'BMI', 'Respiratory rate'];

function computeBmi(items: ExaminationInput[]): string | null {
    const wItem = items.find((i) => i.examination_name.toLowerCase() === 'weight');
    const hItem = items.find((i) => i.examination_name.toLowerCase() === 'height');
    const w = wItem ? parseFloat(wItem.finding_value ?? '') : NaN;
    const h = hItem ? parseFloat(hItem.finding_value ?? '') : NaN;
    if (!w || !h) return null;
    const meters = h > 3 ? h / 100 : h;
    const bmi = w / (meters * meters);
    return Number.isFinite(bmi) ? bmi.toFixed(1) : null;
}

export default function ExaminationSection({ items, onAdd, onUpdate, onRemove }: Props) {
    const bmi = computeBmi(items);
    const bmiIdx = items.findIndex((i) => i.examination_name.toLowerCase() === 'bmi');

    if (bmi && bmiIdx !== -1 && items[bmiIdx].finding_value !== bmi) {
        setTimeout(() => onUpdate(bmiIdx, { finding_value: bmi }), 0);
    }

    return (
        <SectionAccordion
            title="On Examination"
            onAdd={() => onAdd({ examination_name: '', finding_value: '', note: '' })}
            itemCount={items.length}
        >
            <div className="mb-2 flex flex-wrap gap-1">
                {COMMON.filter((c) => !items.find((i) => i.examination_name === c)).map((c) => (
                    <button
                        key={c}
                        type="button"
                        onClick={() => onAdd({ examination_name: c, finding_value: '', note: '' })}
                        className="rounded border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-700 hover:bg-blue-50"
                    >
                        + {c}
                    </button>
                ))}
            </div>

            {items.length === 0 ? (
                <p className="text-sm text-gray-500">No examination findings.</p>
            ) : (
                <table className="w-full text-sm">
                    <thead className="text-xs text-gray-500">
                        <tr>
                            <th className="pb-1 text-left">Examination</th>
                            <th className="pb-1 text-left">Finding / Value</th>
                            <th className="pb-1 text-left">Note</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((e, i) => (
                            <tr key={i} className="border-t">
                                <td className="py-1 pr-1">
                                    <input
                                        type="text"
                                        value={e.examination_name}
                                        onChange={(ev) => onUpdate(i, { examination_name: ev.target.value })}
                                        placeholder="e.g., Temperature"
                                        className="w-full rounded border border-gray-200 px-2 py-1 text-sm"
                                    />
                                </td>
                                <td className="py-1 pr-1">
                                    <input
                                        type="text"
                                        value={e.finding_value ?? ''}
                                        onChange={(ev) => onUpdate(i, { finding_value: ev.target.value })}
                                        placeholder="e.g., 101°F"
                                        className="w-full rounded border border-gray-200 px-2 py-1 text-sm"
                                    />
                                </td>
                                <td className="py-1 pr-1">
                                    <input
                                        type="text"
                                        value={e.note ?? ''}
                                        onChange={(ev) => onUpdate(i, { note: ev.target.value })}
                                        className="w-full rounded border border-gray-200 px-2 py-1 text-sm"
                                    />
                                </td>
                                <td className="py-1">
                                    <button
                                        type="button"
                                        onClick={() => onRemove(i)}
                                        className="text-xs text-red-600 hover:underline"
                                    >
                                        ❌
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </SectionAccordion>
    );
}
