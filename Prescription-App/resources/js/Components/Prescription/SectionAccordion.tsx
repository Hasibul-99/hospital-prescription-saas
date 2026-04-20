import { PropsWithChildren, useState } from 'react';

interface Props {
    title: string;
    onAdd?: () => void;
    itemCount?: number;
    defaultOpen?: boolean;
}

export default function SectionAccordion({
    title,
    onAdd,
    itemCount,
    defaultOpen = true,
    children,
}: PropsWithChildren<Props>) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <section className="mb-3 rounded-lg border border-gray-200 bg-white shadow-sm">
            <header className="flex items-center justify-between border-b bg-gray-50 px-3 py-2">
                <button
                    type="button"
                    onClick={() => setOpen(!open)}
                    className="flex items-center gap-2 text-left text-sm font-semibold text-gray-800"
                >
                    <span className="text-xs text-gray-500">{open ? '▼' : '▶'}</span>
                    {title}
                    {typeof itemCount === 'number' && itemCount > 0 && (
                        <span className="rounded bg-blue-100 px-1.5 text-xs text-blue-700">{itemCount}</span>
                    )}
                </button>
                {onAdd && (
                    <button
                        type="button"
                        onClick={onAdd}
                        className="rounded-full bg-green-600 px-3 py-0.5 text-xs font-bold text-white hover:bg-green-700"
                    >
                        ⊕ Add
                    </button>
                )}
            </header>
            {open && <div className="p-3">{children}</div>}
        </section>
    );
}
