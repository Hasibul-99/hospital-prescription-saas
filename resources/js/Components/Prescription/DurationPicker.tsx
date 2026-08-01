interface Props {
    label?: string;
    presets: string[];
    value: string;
    note?: string;
    onChange: (duration: string) => void;
    onNoteChange?: (note: string) => void;
    showNote?: boolean;
}

export default function DurationPicker({
    label,
    presets,
    value,
    note,
    onChange,
    onNoteChange,
    showNote = true,
}: Props) {
    return (
        <div className="rounded border border-blue-200 bg-blue-50 p-3">
            {label && <div className="mb-2 text-xs font-semibold text-blue-900">{label}</div>}
            <div className="flex flex-wrap gap-1.5">
                {presets.map((d) => (
                    <button
                        key={d}
                        type="button"
                        onClick={() => onChange(d)}
                        className={`rounded border px-2 py-0.5 text-xs ${
                            value === d
                                ? 'border-blue-500 bg-blue-500 text-white'
                                : 'border-blue-300 bg-white text-blue-700 hover:bg-blue-100'
                        }`}
                    >
                        {d}
                    </button>
                ))}
            </div>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Or type a custom duration"
                className="mt-2 w-full rounded border border-blue-300 px-3 py-2 text-sm"
            />
            {showNote && onNoteChange && (
                <textarea
                    value={note ?? ''}
                    onChange={(e) => onNoteChange(e.target.value)}
                    placeholder="Optional note..."
                    rows={2}
                    className="mt-2 w-full rounded border border-blue-300 px-3 py-2 text-sm"
                />
            )}
        </div>
    );
}
