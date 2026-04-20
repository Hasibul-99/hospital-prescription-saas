import { DoctorTemplate } from '@/types';
import { useMemo, useState } from 'react';

interface Props {
    templates: DoctorTemplate[];
    activeId?: number | null;
    onSelect: (tpl: DoctorTemplate) => void;
}

export default function TemplateSidebar({ templates, activeId, onSelect }: Props) {
    const [q, setQ] = useState('');
    const [loading, setLoading] = useState<number | null>(null);

    const { mine, global } = useMemo(() => {
        const query = q.toLowerCase().trim();
        const filtered = query
            ? templates.filter((t) => t.disease_name.toLowerCase().includes(query))
            : templates;
        return {
            mine: filtered.filter((t) => !t.is_global),
            global: filtered.filter((t) => t.is_global),
        };
    }, [templates, q]);

    async function load(tpl: DoctorTemplate) {
        setLoading(tpl.id);
        try {
            const res = await fetch(`/doctor/templates/${tpl.id}`, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error('Failed');
            const full = await res.json();
            onSelect(full);
        } finally {
            setLoading(null);
        }
    }

    return (
        <aside className="sticky top-12 h-[calc(100vh-3rem)] w-60 shrink-0 overflow-y-auto border-r bg-white p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">Templates</h3>
            <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search templates..."
                className="mb-3 w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />

            <Group label="My Templates" items={mine} activeId={activeId} loading={loading} onSelect={load} />
            <Group label="Global Templates" items={global} activeId={activeId} loading={loading} onSelect={load} />
        </aside>
    );
}

function Group({
    label,
    items,
    activeId,
    loading,
    onSelect,
}: {
    label: string;
    items: DoctorTemplate[];
    activeId?: number | null;
    loading: number | null;
    onSelect: (t: DoctorTemplate) => void;
}) {
    if (items.length === 0) return null;
    return (
        <div className="mb-4">
            <div className="mb-1 text-xs font-semibold text-gray-600">{label}</div>
            <ul className="space-y-1">
                {items.map((t) => (
                    <li key={t.id}>
                        <button
                            type="button"
                            onClick={() => onSelect(t)}
                            disabled={loading === t.id}
                            className={`w-full rounded px-2 py-1.5 text-left text-sm transition-colors ${
                                activeId === t.id
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'text-gray-700 hover:bg-gray-100'
                            } ${loading === t.id ? 'opacity-50' : ''}`}
                        >
                            <div className="font-medium">{t.disease_name}</div>
                            <div className="text-xs text-gray-500">
                                Updated: {new Date(t.updated_at).toLocaleDateString()}
                            </div>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
