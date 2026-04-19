import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Patient } from '@/types';

interface Props {
    onSelect: (patient: Patient) => void;
    placeholder?: string;
    className?: string;
}

export default function PatientSearch({ onSelect, placeholder = 'Search patients...', className = '' }: Props) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (query.length < 1) {
            setResults([]);
            setOpen(false);
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const { data } = await axios.get('/api/patients/search', { params: { q: query } });
                setResults(data);
                setOpen(true);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    function handleSelect(patient: Patient) {
        onSelect(patient);
        setQuery('');
        setResults([]);
        setOpen(false);
    }

    function ageDisplay(p: Patient): string {
        const parts = [];
        if (p.age_years) parts.push(`${p.age_years}Y`);
        if (p.age_months) parts.push(`${p.age_months}M`);
        if (p.age_days) parts.push(`${p.age_days}D`);
        return parts.join(' ') || 'N/A';
    }

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {loading && (
                <div className="absolute right-3 top-2.5 text-xs text-gray-400">Searching...</div>
            )}

            {open && results.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg">
                    {results.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelect(p)}
                            className="flex w-full items-center gap-3 border-b px-3 py-2 text-left text-sm hover:bg-blue-50 last:border-0"
                        >
                            <div className="flex-1">
                                <div className="font-medium text-gray-800">{p.name}</div>
                                <div className="text-xs text-gray-500">
                                    {p.patient_uid} &middot; {ageDisplay(p)}/{p.gender?.charAt(0).toUpperCase()} &middot; {p.phone}
                                </div>
                            </div>
                            {(p as any).last_visit && (
                                <span className="text-xs text-gray-400">
                                    Last: {new Date((p as any).last_visit).toLocaleDateString()}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {open && query.length >= 1 && results.length === 0 && !loading && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-white p-3 text-center text-sm text-gray-500 shadow-lg">
                    No patients found
                </div>
            )}
        </div>
    );
}
