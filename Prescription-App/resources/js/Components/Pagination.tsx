import { Link } from '@inertiajs/react';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    links: PaginationLink[];
}

export default function Pagination({ links }: Props) {
    if (links.length <= 3) return null;

    return (
        <nav className="flex items-center justify-center gap-1">
            {links.map((link, i) => (
                <Link
                    key={i}
                    href={link.url ?? '#'}
                    preserveScroll
                    className={`rounded px-3 py-1 text-sm ${
                        link.active
                            ? 'bg-blue-600 text-white'
                            : link.url
                              ? 'bg-white text-gray-700 hover:bg-gray-100'
                              : 'cursor-not-allowed text-gray-400'
                    }`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                />
            ))}
        </nav>
    );
}
