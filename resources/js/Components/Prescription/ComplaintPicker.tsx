import Modal from '@/Components/Modal';
import DurationPicker from '@/Components/Prescription/DurationPicker';
import { ComplaintMaster } from '@/types';
import { useMemo, useState } from 'react';

interface Props {
    show: boolean;
    onClose: () => void;
    masters: ComplaintMaster[];
    durationPresets: string[];
    onAdd: (complaint: { complaint_name: string; duration_text?: string; note?: string }) => void;
}

export default function ComplaintPicker({ show, onClose, masters, durationPresets, onAdd }: Props) {
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<string | null>(null);
    const [duration, setDuration] = useState('');
    const [note, setNote] = useState('');

    const filtered = useMemo(() => {
        const q = query.toLowerCase().trim();
        if (!q) return masters;
        return masters.filter(
            (m) =>
                m.name_en.toLowerCase().includes(q) ||
                (m.name_bn && m.name_bn.includes(q)) ||
                (m.category && m.category.toLowerCase().includes(q)),
        );
    }, [query, masters]);

    function choose(name: string) {
        setSelected(name);
    }

    function commit() {
        if (!selected) return;
        onAdd({
            complaint_name: selected,
            duration_text: duration || undefined,
            note: note || undefined,
        });
        setSelected(null);
        setDuration('');
        setNote('');
        setQuery('');
    }

    function close() {
        setSelected(null);
        setDuration('');
        setNote('');
        setQuery('');
        onClose();
    }

    return (
        <Modal show={show} onClose={close} maxWidth="2xl">
            <div className="p-5">
                <h3 className="mb-3 text-lg font-semibold text-gray-800">Add Complaint</h3>

                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search complaints..."
                    className="mb-3 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />

                <div className="max-h-48 overflow-y-auto rounded border border-gray-200 bg-gray-50 p-2">
                    <div className="flex flex-wrap gap-1.5">
                        {filtered.map((c) => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => choose(c.name_en)}
                                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                                    selected === c.name_en
                                        ? 'border-blue-500 bg-blue-500 text-white'
                                        : 'border-gray-300 bg-white text-gray-700 hover:bg-blue-50'
                                }`}
                                title={c.name_bn ?? undefined}
                            >
                                {c.name_en}
                            </button>
                        ))}
                        {filtered.length === 0 && (
                            <span className="text-xs text-gray-500">No matches. You can type a custom complaint below.</span>
                        )}
                    </div>
                </div>

                <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600">Custom complaint (optional)</label>
                    <input
                        type="text"
                        value={selected ?? ''}
                        onChange={(e) => setSelected(e.target.value)}
                        placeholder="Or type a free-text complaint"
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                </div>

                {selected && (
                    <div className="mt-4">
                        <DurationPicker
                            label={`Duration for: ${selected}`}
                            presets={durationPresets}
                            value={duration}
                            note={note}
                            onChange={setDuration}
                            onNoteChange={setNote}
                        />
                    </div>
                )}

                <div className="mt-5 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={close}
                        className="rounded border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={commit}
                        disabled={!selected}
                        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        Add Complaint
                    </button>
                </div>
            </div>
        </Modal>
    );
}
