import SectionAccordion from './SectionAccordion';
import { SectionInput } from '@/hooks/usePrescriptionReducer';
import { AdviceSuggestion } from '@/types';

interface Props {
    title: string;
    sectionType: SectionInput['section_type'];
    allSections: SectionInput[];
    onAdd: (section: SectionInput) => void;
    onUpdate: (globalIndex: number, content: string) => void;
    onRemove: (globalIndex: number) => void;
    placeholder?: string;
    suggestions?: string[];
    bilingualSuggestions?: AdviceSuggestion[];
}

export default function TextListSection({
    title,
    sectionType,
    allSections,
    onAdd,
    onUpdate,
    onRemove,
    placeholder = 'Type here...',
    suggestions = [],
    bilingualSuggestions = [],
}: Props) {
    const items = allSections
        .map((s, gi) => ({ s, gi }))
        .filter(({ s }) => s.section_type === sectionType);

    return (
        <SectionAccordion
            title={title}
            onAdd={() => onAdd({ section_type: sectionType, content: '' })}
            itemCount={items.length}
        >
            {(suggestions.length > 0 || bilingualSuggestions.length > 0) && (
                <div className="mb-2 flex flex-wrap gap-1">
                    {suggestions.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => onAdd({ section_type: sectionType, content: s })}
                            className="rounded border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-700 hover:bg-blue-50"
                        >
                            + {s}
                        </button>
                    ))}
                    {bilingualSuggestions.map((s) => (
                        <button
                            key={s.en}
                            type="button"
                            onClick={() => onAdd({ section_type: sectionType, content: `${s.en} (${s.bn})` })}
                            className="rounded border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-700 hover:bg-blue-50"
                            title={s.bn}
                        >
                            + {s.en}
                        </button>
                    ))}
                </div>
            )}

            {items.length === 0 ? (
                <p className="text-sm text-gray-500">No entries.</p>
            ) : (
                <ul className="space-y-1.5">
                    {items.map(({ s, gi }) => (
                        <li key={gi} className="flex items-start gap-2">
                            <span className="mt-2 text-gray-400">•</span>
                            <textarea
                                value={s.content}
                                onChange={(e) => onUpdate(gi, e.target.value)}
                                rows={1}
                                placeholder={placeholder}
                                className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => onRemove(gi)}
                                className="mt-1 text-xs text-red-600 hover:underline"
                            >
                                ❌
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </SectionAccordion>
    );
}
