import { useState } from 'react';
import SectionAccordion from './SectionAccordion';
import ComplaintPicker from './ComplaintPicker';
import { ComplaintMaster } from '@/types';
import { ComplaintInput } from '@/hooks/usePrescriptionReducer';

interface Props {
    complaints: ComplaintInput[];
    masters: ComplaintMaster[];
    durationPresets: string[];
    onAdd: (c: ComplaintInput) => void;
    onRemove: (i: number) => void;
    onUpdate: (i: number, patch: Partial<ComplaintInput>) => void;
}

export default function ComplaintsSection({
    complaints,
    masters,
    durationPresets,
    onAdd,
    onRemove,
    onUpdate,
}: Props) {
    const [show, setShow] = useState(false);

    return (
        <>
            <SectionAccordion title="Patient Complaints" onAdd={() => setShow(true)} itemCount={complaints.length}>
                {complaints.length === 0 ? (
                    <p className="text-sm text-gray-500">No complaints added. Click ⊕ Add to choose one.</p>
                ) : (
                    <ul className="space-y-1.5">
                        {complaints.map((c, i) => (
                            <li
                                key={i}
                                className="flex items-start gap-2 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                            >
                                <span className="mt-0.5 text-gray-400">•</span>
                                <div className="flex-1">
                                    <span className="font-medium text-gray-800">{c.complaint_name}</span>
                                    {c.duration_text && (
                                        <span className="text-gray-600"> — {c.duration_text}</span>
                                    )}
                                    {c.note && <div className="mt-0.5 text-xs text-gray-500">Note: {c.note}</div>}
                                    <div className="mt-1 flex gap-2">
                                        <input
                                            type="text"
                                            value={c.duration_text ?? ''}
                                            onChange={(e) => onUpdate(i, { duration_text: e.target.value })}
                                            placeholder="Duration"
                                            className="w-32 rounded border border-gray-200 px-2 py-0.5 text-xs"
                                        />
                                        <input
                                            type="text"
                                            value={c.note ?? ''}
                                            onChange={(e) => onUpdate(i, { note: e.target.value })}
                                            placeholder="Note"
                                            className="flex-1 rounded border border-gray-200 px-2 py-0.5 text-xs"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onRemove(i)}
                                    className="text-xs text-red-600 hover:underline"
                                >
                                    ❌
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </SectionAccordion>

            <ComplaintPicker
                show={show}
                onClose={() => setShow(false)}
                masters={masters}
                durationPresets={durationPresets}
                onAdd={(c) => {
                    onAdd(c);
                    setShow(false);
                }}
            />
        </>
    );
}
