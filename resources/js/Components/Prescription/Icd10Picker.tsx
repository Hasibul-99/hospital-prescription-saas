import { useEffect, useRef, useState } from 'react';

interface Icd10Row {
    code: string;
    title: string;
    chapter: string | null;
}

interface Props {
    /** Called with formatted `"CODE — Title"` when a suggestion is clicked. */
    onPick: (formatted: string) => void;
    placeholder?: string;
}

/**
 * Typeahead search over ICD-10 codes. Debounced. Purely additive:
 * doctor can still type freehand diagnoses in the Diagnosis section —
 * this is a shortcut for standard codes.
 */
export default function Icd10Picker({ onPick, placeholder = 'Search ICD-10 code or title…' }: Props) {
    const [q, setQ] = useState('');
    const [rows, setRows] = useState<Icd10Row[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const boxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handle = (e: MouseEvent) => {
            if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const ctrl = new AbortController();
        setLoading(true);
        const t = setTimeout(() => {
            fetch(`/doctor/icd10/search?q=${encodeURIComponent(q)}`, {
                headers: { Accept: 'application/json' },
                signal: ctrl.signal,
            })
                .then((r) => (r.ok ? r.json() : { data: [] }))
                .then((j) => setRows(j.data ?? []))
                .catch(() => { /* aborted or offline — ignore */ })
                .finally(() => setLoading(false));
        }, 200);
        return () => {
            clearTimeout(t);
            ctrl.abort();
        };
    }, [q, open]);

    function pick(row: Icd10Row) {
        onPick(`${row.code} — ${row.title}`);
        setQ('');
        setOpen(false);
    }

    return (
        <div className="relative" ref={boxRef}>
            <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onFocus={() => setOpen(true)}
                placeholder={placeholder}
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
            {open && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded border border-gray-200 bg-white shadow-lg">
                    {loading ? (
                        <div className="px-3 py-2 text-xs text-gray-500">Searching…</div>
                    ) : rows.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-gray-500">No matches.</div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {rows.map((r) => (
                                <li key={r.code}>
                                    <button
                                        type="button"
                                        onClick={() => pick(r)}
                                        className="block w-full px-3 py-1.5 text-left text-sm hover:bg-teal-50"
                                    >
                                        <span className="mr-2 font-mono text-teal-700">{r.code}</span>
                                        <span className="text-gray-800">{r.title}</span>
                                        {r.chapter && <span className="ml-2 text-xs text-gray-400">{r.chapter}</span>}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
