import { useMemo, useState } from 'react';
import SectionAccordion from './SectionAccordion';
import { ComplaintMaster } from '@/types';
import { ComplaintInput } from '@/hooks/usePrescriptionReducer';
import { Button, Empty, Input, Popover, Space, Tag, Tooltip } from 'antd';
import { DeleteOutlined, SearchOutlined } from '@ant-design/icons';

interface Props {
    complaints: ComplaintInput[];
    masters: ComplaintMaster[];
    durationPresets: string[];
    onAdd: (c: ComplaintInput) => void;
    onRemove: (i: number) => void;
    onUpdate: (i: number, patch: Partial<ComplaintInput>) => void;
}

export default function ComplaintsSection({
    complaints,
    masters,
    durationPresets,
    onAdd,
    onRemove,
    onUpdate,
}: Props) {
    const [bankOpen, setBankOpen] = useState(complaints.length === 0);
    const [bankQuery, setBankQuery] = useState('');

    const addedNames = new Set(complaints.map((c) => c.complaint_name));

    const filtered = useMemo(() => {
        if (!bankQuery.trim()) return masters;
        const q = bankQuery.toLowerCase();
        return masters.filter((m) => m.name_en.toLowerCase().includes(q) || (m.name_bn || '').includes(q));
    }, [bankQuery, masters]);

    function addComplaint(name: string) {
        if (addedNames.has(name)) return;
        onAdd({ complaint_name: name, duration_text: '', note: '' });
    }

    return (
        <SectionAccordion
            title="Patient Complaints"
            titleBn="রোগীর অভিযোগ"
            itemCount={complaints.length}
            onAdd={() => setBankOpen((o) => !o)}
            addLabel={bankOpen ? 'Done' : 'Add'}
        >
            {complaints.length === 0 && !bankOpen && (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    imageStyle={{ height: 28 }}
                    description={<span className="text-xs text-gray-400">No complaints added.</span>}
                    className="!my-1"
                />
            )}

            <div className="flex flex-col gap-2">
                {complaints.map((c, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-2 rounded-lg border border-[#e3e7e3] bg-[#f6f7f5] px-2.5 py-1.5"
                    >
                        <span className="text-[13.5px] font-semibold text-[#2b3a32]">{c.complaint_name}</span>

                        <Popover
                            trigger="click"
                            placement="bottomLeft"
                            title="Duration"
                            content={
                                <div style={{ maxWidth: 280 }}>
                                    <Space size={4} wrap>
                                        {durationPresets.map((d) => (
                                            <Tag.CheckableTag
                                                key={d}
                                                checked={c.duration_text === d}
                                                onChange={() => onUpdate(i, { duration_text: d })}
                                            >
                                                {d}
                                            </Tag.CheckableTag>
                                        ))}
                                    </Space>
                                    <Input
                                        className="mt-2"
                                        size="small"
                                        defaultValue={c.duration_text}
                                        placeholder="Custom — press Enter"
                                        onPressEnter={(e) =>
                                            onUpdate(i, { duration_text: e.currentTarget.value.trim() })
                                        }
                                    />
                                </div>
                            }
                        >
                            <Button size="small" type={c.duration_text ? 'default' : 'dashed'}>
                                {c.duration_text || 'Set duration…'}
                            </Button>
                        </Popover>

                        <Tooltip title="Remove">
                            <Button
                                className="!ml-auto"
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => onRemove(i)}
                            />
                        </Tooltip>
                    </div>
                ))}
            </div>

            {bankOpen && (
                <div className="mt-2.5 rounded-lg border border-[#e3e7e3] bg-[#f6f7f5] p-2.5">
                    <Input
                        allowClear
                        size="small"
                        prefix={<SearchOutlined />}
                        value={bankQuery}
                        onChange={(e) => setBankQuery(e.target.value)}
                        placeholder="Search complaints… e.g. fever, cough"
                    />

                    <div className="mt-2 max-h-56 overflow-y-auto">
                        <Space size={4} wrap>
                            {filtered.map((m) => (
                                <Tag.CheckableTag
                                    key={m.id}
                                    checked={addedNames.has(m.name_en)}
                                    onChange={() => addComplaint(m.name_en)}
                                >
                                    {m.name_en}
                                    {m.name_bn && (
                                        <span
                                            className="ml-1 opacity-60"
                                            style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}
                                        >
                                            · {m.name_bn}
                                        </span>
                                    )}
                                </Tag.CheckableTag>
                            ))}

                            {bankQuery.trim() &&
                                !filtered.some((m) => m.name_en.toLowerCase() === bankQuery.trim().toLowerCase()) && (
                                    <Button
                                        size="small"
                                        type="dashed"
                                        onClick={() => addComplaint(bankQuery.trim())}
                                    >
                                        + Add “{bankQuery.trim()}”
                                    </Button>
                                )}
                        </Space>
                    </div>
                </div>
            )}
        </SectionAccordion>
    );
}
