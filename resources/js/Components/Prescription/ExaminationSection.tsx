import { useEffect, useState } from 'react';
import SectionAccordion from './SectionAccordion';
import { ExaminationInput } from '@/hooks/usePrescriptionReducer';
import { Button, Empty, Input, Popover, Space, Tag, Tooltip } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

interface Props {
    items: ExaminationInput[];
    onAdd: (e: ExaminationInput) => void;
    onUpdate: (i: number, patch: Partial<ExaminationInput>) => void;
    onRemove: (i: number) => void;
}

const COMMON = [
    'Temperature',
    'BP',
    'Pulse',
    'SpO2',
    'Weight',
    'Height',
    'Pallor',
    'Jaundice',
    'Oedema',
    'Lymphadenopathy',
    'Chest — clear',
    'Abdomen — soft',
    'Heart sounds normal',
    'CNS — conscious',
];

const FINDING_PRESETS = ['Normal', 'Mild', 'Moderate', 'Severe', 'Bilateral', 'Unilateral', 'Pending', 'Absent'];

function computeBmi(items: ExaminationInput[]): string | null {
    const wItem = items.find((i) => i.examination_name.toLowerCase() === 'weight');
    const hItem = items.find((i) => i.examination_name.toLowerCase() === 'height');
    const w = wItem ? parseFloat(wItem.finding_value ?? '') : NaN;
    const h = hItem ? parseFloat(hItem.finding_value ?? '') : NaN;
    if (!w || !h) return null;

    const meters = h > 3 ? h / 100 : h;
    const bmi = w / (meters * meters);
    return Number.isFinite(bmi) ? bmi.toFixed(1) : null;
}

export default function ExaminationSection({ items, onAdd, onUpdate, onRemove }: Props) {
    const [bankOpen, setBankOpen] = useState(items.length === 0);

    const bmi = computeBmi(items);
    const bmiIdx = items.findIndex((i) => i.examination_name.toLowerCase() === 'bmi');

    // Keep a BMI row in step with weight/height. This used to run during
    // render via setTimeout, which is a side effect in the render phase.
    useEffect(() => {
        if (bmi && bmiIdx !== -1 && items[bmiIdx].finding_value !== bmi) {
            onUpdate(bmiIdx, { finding_value: bmi });
        }
    }, [bmi, bmiIdx, items, onUpdate]);

    const addedNames = new Set(items.map((i) => i.examination_name));

    function addExam(name: string) {
        if (addedNames.has(name)) return;
        onAdd({ examination_name: name, finding_value: '', note: '' });
    }

    return (
        <SectionAccordion
            title="On Examination"
            titleBn="পরীক্ষায় প্রাপ্ত"
            itemCount={items.length}
            onAdd={() => setBankOpen((o) => !o)}
            addLabel={bankOpen ? 'Done' : 'Add'}
        >
            {items.length === 0 && !bankOpen && (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    imageStyle={{ height: 28 }}
                    description={<span className="text-xs text-gray-400">Nothing examined yet.</span>}
                    className="!my-1"
                />
            )}

            <div className="flex flex-col gap-2">
                {items.map((item, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-2 rounded-lg border border-[#e3e7e3] bg-[#f6f7f5] px-2.5 py-1.5"
                    >
                        <span className="whitespace-nowrap text-[13.5px] font-semibold text-[#2b3a32]">
                            {item.examination_name}
                        </span>

                        <Popover
                            trigger="click"
                            placement="bottomLeft"
                            title="Finding / value"
                            content={
                                <div style={{ maxWidth: 280 }}>
                                    <Space size={4} wrap>
                                        {FINDING_PRESETS.map((p) => (
                                            <Tag.CheckableTag
                                                key={p}
                                                checked={item.finding_value === p}
                                                onChange={() => onUpdate(i, { finding_value: p })}
                                            >
                                                {p}
                                            </Tag.CheckableTag>
                                        ))}
                                    </Space>
                                    <Input
                                        className="mt-2"
                                        size="small"
                                        value={item.finding_value ?? ''}
                                        placeholder="Custom value… e.g. 101°F"
                                        onChange={(e) => onUpdate(i, { finding_value: e.target.value })}
                                    />
                                </div>
                            }
                        >
                            <Button size="small" type={item.finding_value ? 'default' : 'dashed'}>
                                {item.finding_value || 'Set value…'}
                            </Button>
                        </Popover>

                        <Input
                            size="small"
                            value={item.note ?? ''}
                            onChange={(e) => onUpdate(i, { note: e.target.value })}
                            placeholder="Note…"
                        />

                        <Tooltip title="Remove">
                            <Button
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
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#6a7a72]">
                        Quick add
                    </div>
                    <Space size={4} wrap>
                        {COMMON.filter((name) => !addedNames.has(name)).map((name) => (
                            <Tag.CheckableTag key={name} checked={false} onChange={() => addExam(name)}>
                                + {name}
                            </Tag.CheckableTag>
                        ))}
                    </Space>
                    <Input
                        className="mt-2"
                        size="small"
                        placeholder="Custom examination — press Enter"
                        onPressEnter={(e) => {
                            const value = e.currentTarget.value.trim();
                            if (!value) return;
                            addExam(value);
                            e.currentTarget.value = '';
                        }}
                    />
                </div>
            )}
        </SectionAccordion>
    );
}
