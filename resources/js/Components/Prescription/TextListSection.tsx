import SectionAccordion from './SectionAccordion';
import { SectionInput } from '@/hooks/usePrescriptionReducer';
import { AdviceSuggestion } from '@/types';
import { Button, Empty, Input, Space, Tag, Tooltip } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

interface Props {
    title: string;
    titleBn?: string;
    sectionType: SectionInput['section_type'];
    allSections: SectionInput[];
    onAdd: (section: SectionInput) => void;
    onUpdate: (globalIndex: number, content: string) => void;
    onRemove: (globalIndex: number) => void;
    placeholder?: string;
    suggestions?: string[];
    bilingualSuggestions?: AdviceSuggestion[];
    defaultOpen?: boolean;
    /** Lets the doctor drop an optional section they no longer want. */
    onRemoveSection?: () => void;
    /** Rendered under the suggestion chips — used for the ICD-10 picker. */
    extra?: React.ReactNode;
}

export default function TextListSection({
    title,
    titleBn,
    sectionType,
    allSections,
    onAdd,
    onUpdate,
    onRemove,
    placeholder = 'Type here…',
    suggestions = [],
    bilingualSuggestions = [],
    defaultOpen = true,
    onRemoveSection,
    extra,
}: Props) {
    // Sections live in one flat list, so each row has to carry the index it
    // occupies there — the local position would point at the wrong entry.
    const items = allSections
        .map((s, gi) => ({ s, gi }))
        .filter(({ s }) => s.section_type === sectionType);

    const used = new Set(items.map(({ s }) => s.content));

    return (
        <SectionAccordion
            title={title}
            titleBn={titleBn}
            onAdd={() => onAdd({ section_type: sectionType, content: '' })}
            itemCount={items.length}
            defaultOpen={defaultOpen}
            onRemoveSection={onRemoveSection}
        >
            {(suggestions.length > 0 || bilingualSuggestions.length > 0) && (
                <Space size={4} wrap className="mb-2">
                    {suggestions
                        .filter((s) => !used.has(s))
                        .map((s) => (
                            <Tag.CheckableTag
                                key={s}
                                checked={false}
                                onChange={() => onAdd({ section_type: sectionType, content: s })}
                            >
                                + {s}
                            </Tag.CheckableTag>
                        ))}
                    {bilingualSuggestions.map((s) => (
                        <Tooltip key={s.en} title={s.bn}>
                            <Tag.CheckableTag
                                checked={false}
                                onChange={() => onAdd({ section_type: sectionType, content: `${s.en} (${s.bn})` })}
                            >
                                + {s.en}
                            </Tag.CheckableTag>
                        </Tooltip>
                    ))}
                </Space>
            )}

            {extra && <div className="mb-2">{extra}</div>}

            {items.length === 0 ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    imageStyle={{ height: 28 }}
                    description={<span className="text-xs text-gray-400">Nothing added yet.</span>}
                    className="!my-1"
                />
            ) : (
                <div className="flex flex-col gap-1.5">
                    {items.map(({ s, gi }, position) => (
                        <div key={gi} className="flex items-start gap-2">
                            <span className="mt-1.5 w-4 flex-none text-right text-xs text-gray-400">
                                {position + 1}.
                            </span>
                            <Input.TextArea
                                value={s.content}
                                onChange={(e) => onUpdate(gi, e.target.value)}
                                autoSize={{ minRows: 1, maxRows: 4 }}
                                placeholder={placeholder}
                                size="small"
                            />
                            <Tooltip title="Remove">
                                <Button
                                    type="text"
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => onRemove(gi)}
                                />
                            </Tooltip>
                        </div>
                    ))}
                </div>
            )}
        </SectionAccordion>
    );
}
