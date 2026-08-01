import { Medicine } from '@/types';
import { useEffect, useRef, useState } from 'react';

interface Props {
    onSelect: (m: Medicine) => void;
    onOpenMissing: () => void;
}

export default function MedicineSearch({ onSelect, onOpenMissing }: Props) {
    const [q, setQ] = useState('');
    const [results, setResults] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        const term = q.trim();
        if (term.length < 2) {
            setResults([]);
            return;
        }

        const handle = setTimeout(() => {
            abortRef.current?.abort();
            const ctrl = new AbortController();
            abortRef.current = ctrl;
            setLoading(true);

            fetch(`/doctor/medicines/search?q=${encodeURIComponent(term)}&limit=20`, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
                signal: ctrl.signal,
            })
                .then((res) => res.json())
                .then((data) => setResults(data.results ?? []))
                .catch(() => {})
                .finally(() => setLoading(false));
        }, 300);

        return () => clearTimeout(handle);
    }, [q]);

    const groups: Record<string, Medicine[]> = {};
    for (const m of results) {
        const key = m.type ?? 'Other';
        (groups[key] ??= []).push(m);
    }

    return (
        <div>
            <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-700">Medicine</label>
                <button
                    type="button"
                    onClick={onOpenMissing}
                    className="text-xs text-blue-600 hover:underline"
                >
                    Medicine Missing? Add
                </button>
            </div>

            <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Type medicine name..."
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                autoFocus
            />

            <div className="mt-2 max-h-[380px] overflow-y-auto rounded border border-gray-200">
                {loading && <div className="p-2 text-xs text-gray-500">Searching...</div>}

                {!loading && q.trim().length >= 2 && results.length === 0 && (
                    <div className="p-3 text-xs text-gray-500">No matches. Try "Medicine Missing? Add" above.</div>
                )}

                {!loading && q.trim().length < 2 && (
                    <div className="p-3 text-xs text-gray-400">Type at least 2 characters.</div>
                )}

                {Object.entries(groups).map(([type, items]) => (
                    <div key={type}>
                        <div className="sticky top-0 bg-gray-50 px-2 py-1 text-[11px] font-semibold uppercase text-gray-500">
                            {type}
                        </div>
                        <ul>
                            {items.map((m) => (
                                <li key={m.id}>
                                    <button
                                        type="button"
                                        onClick={() => onSelect(m)}
                                        className="w-full border-b border-gray-100 px-3 py-2 text-left text-sm hover:bg-blue-50"
                                    >
                                        <div className="font-medium text-gray-800">
                                            {m.brand_name}
                                            {m.strength && (
                                                <span className="ml-1 text-xs text-gray-600">({m.type}, {m.strength})</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {m.generic_name}
                                            {m.manufacturer && ` — ${m.manufacturer}`}
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}
