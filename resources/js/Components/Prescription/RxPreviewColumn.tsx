import { MedicineInput, SectionInput } from '@/hooks/usePrescriptionReducer';
import { timingLabel } from '@/utils/timingLabel';
import { Badge, Button, Card, DatePicker, Empty, Input, InputNumber, Segmented, Space, Tag, Tooltip } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const HOSPITALIZATION_PRESETS = [
    'Routine follow-up',
    'Emergency review if condition worsens',
    'Admission considered if no improvement in 48 h',
    'Referred to specialist',
];

const FOLLOW_UP_QUICK = [3, 7, 14, 30];

type FollowUpUnit = 'days' | 'months' | 'years';

interface Props {
    medicines: MedicineInput[];
    sections: SectionInput[];
    followUpDate: string | null;
    followUpDurationValue: number | null;
    followUpDurationUnit: FollowUpUnit | null;
    onOpenMedicineModal: () => void;
    onEditMedicine: (index: number) => void;
    onRemoveMedicine: (index: number) => void;
    onAddSection: (section: SectionInput) => void;
    onRemoveSection: (globalIndex: number) => void;
    onFollowUpChange: (date: string | null, value: number | null, unit: FollowUpUnit | null) => void;
}

export default function RxPreviewColumn({
    medicines,
    sections,
    followUpDate,
    followUpDurationValue,
    followUpDurationUnit,
    onOpenMedicineModal,
    onEditMedicine,
    onRemoveMedicine,
    onAddSection,
    onRemoveSection,
    onFollowUpChange,
}: Props) {
    // Hospitalisation notes used to live in this component's own useState, so
    // everything typed here was dropped on save. They are prescription
    // sections like any other and now go through the form state.
    const hospitalizations = sections
        .map((s, gi) => ({ s, gi }))
        .filter(({ s }) => s.section_type === 'hospitalization');

    const chosen = new Set(hospitalizations.map(({ s }) => s.content));

    return (
        <div className="flex h-full flex-col gap-2.5 overflow-y-auto p-3">
            <Card
                size="small"
                title={
                    <Space size={6}>
                        <span className="font-serif text-lg font-bold italic text-[#0a8754]">℞</span>
                        <span>Prescription</span>
                        {medicines.length > 0 && <Badge count={medicines.length} color="#0a8754" size="small" />}
                    </Space>
                }
            >
                {medicines.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        imageStyle={{ height: 32 }}
                        description={<span className="text-xs text-gray-400">No medicines yet.</span>}
                        className="!my-2"
                    />
                ) : (
                    <div className="flex flex-col">
                        {medicines.map((m, i) => (
                            <MedRow
                                key={i}
                                index={i}
                                medicine={m}
                                onEdit={() => onEditMedicine(i)}
                                onRemove={() => onRemoveMedicine(i)}
                            />
                        ))}
                    </div>
                )}

                <Button type="dashed" block className="mt-2.5" icon={<PlusOutlined />} onClick={onOpenMedicineModal}>
                    Add medicines
                    <span className="ml-auto text-[10px] text-gray-400">⌘K</span>
                </Button>
            </Card>

            <Card
                size="small"
                title="Hospitalization / Referrals"
                extra={hospitalizations.length > 0 && <Badge count={hospitalizations.length} color="#0a8754" size="small" />}
            >
                {hospitalizations.map(({ s, gi }) => (
                    <div key={gi} className="mb-1.5 flex items-center gap-2">
                        <span className="flex-1 text-[13px] text-[#0f1a14]">{s.content}</span>
                        <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => onRemoveSection(gi)}
                        />
                    </div>
                ))}

                <Space size={4} wrap className={hospitalizations.length ? 'mt-2' : ''}>
                    {HOSPITALIZATION_PRESETS.filter((p) => !chosen.has(p)).map((p) => (
                        <Tag.CheckableTag
                            key={p}
                            checked={false}
                            onChange={() => onAddSection({ section_type: 'hospitalization', content: p })}
                        >
                            + {p}
                        </Tag.CheckableTag>
                    ))}
                </Space>

                <Input
                    className="mt-2"
                    size="small"
                    placeholder="Custom note — press Enter"
                    onPressEnter={(e) => {
                        const value = e.currentTarget.value.trim();
                        if (!value) return;
                        onAddSection({ section_type: 'hospitalization', content: value });
                        e.currentTarget.value = '';
                    }}
                />
            </Card>

            <Card size="small" title="Follow-up">
                <div className="mb-3">
                    <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#6a7a72]">
                        On date
                    </div>
                    <DatePicker
                        className="w-full"
                        size="small"
                        format="DD MMM YYYY"
                        value={followUpDate ? dayjs(followUpDate) : null}
                        minDate={dayjs()}
                        onChange={(d) =>
                            onFollowUpChange(
                                d ? d.format('YYYY-MM-DD') : null,
                                followUpDurationValue,
                                followUpDurationUnit,
                            )
                        }
                    />
                </div>

                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#6a7a72]">Or after</div>
                <Space.Compact className="w-full">
                    <InputNumber
                        size="small"
                        min={1}
                        style={{ width: 70 }}
                        value={followUpDurationValue}
                        onChange={(v) => onFollowUpChange(followUpDate, v, followUpDurationUnit ?? 'days')}
                    />
                    <Segmented
                        size="small"
                        value={followUpDurationUnit ?? 'days'}
                        onChange={(u) => onFollowUpChange(followUpDate, followUpDurationValue, u as FollowUpUnit)}
                        options={[
                            { label: 'days', value: 'days' },
                            { label: 'months', value: 'months' },
                            { label: 'years', value: 'years' },
                        ]}
                    />
                </Space.Compact>

                <Space size={4} wrap className="mt-2">
                    {FOLLOW_UP_QUICK.map((d) => (
                        <Tag.CheckableTag
                            key={d}
                            checked={
                                followUpDurationValue === d &&
                                (followUpDurationUnit ?? 'days') === 'days' &&
                                !followUpDate
                            }
                            onChange={() => onFollowUpChange(null, d, 'days')}
                        >
                            {d} days
                        </Tag.CheckableTag>
                    ))}
                    {(followUpDate || followUpDurationValue) && (
                        <Button type="link" size="small" onClick={() => onFollowUpChange(null, null, null)}>
                            Clear
                        </Button>
                    )}
                </Space>
            </Card>
        </div>
    );
}

function MedRow({
    index,
    medicine: m,
    onEdit,
    onRemove,
}: {
    index: number;
    medicine: MedicineInput;
    onEdit: () => void;
    onRemove: () => void;
}) {
    const abbr = abbreviate(m.medicine_type ?? '');
    const doseStr = [m.dose_morning, m.dose_noon, m.dose_afternoon, m.dose_night].map((v) => v ?? 0).join('+');
    const hasAnyDose = [m.dose_morning, m.dose_noon, m.dose_afternoon, m.dose_night].some(
        (v) => v != null && v > 0,
    );

    return (
        <div className="flex items-start gap-1.5 border-b border-[#f0f2f0] py-1.5 last:border-0">
            <span className="mt-0.5 w-4 flex-none text-[11px] font-bold text-[#6a7a72]">{index + 1}.</span>

            <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold text-[#0f1a14]">
                    {abbr ? `${abbr}. ` : ''}
                    {m.medicine_name}
                    {m.strength && <span className="ml-1 text-xs font-normal text-[#6a7a72]">{m.strength}</span>}
                </div>
                <div
                    className="mt-0.5 flex flex-wrap gap-x-1.5 text-[11.5px] text-[#6a7a72]"
                    style={{ fontFamily: "'Noto Sans Bengali', 'Inter', sans-serif" }}
                >
                    {hasAnyDose && <span className="font-mono font-bold text-[#0a8754]">{doseStr}</span>}
                    {m.timing && <span>· {timingLabel(m.timing)}</span>}
                    {m.duration_value && <span>· {m.duration_value} {m.duration_unit ?? 'days'}</span>}
                    {m.custom_instruction && <span className="italic">· {m.custom_instruction}</span>}
                </div>
            </div>

            <Space size={0}>
                <Tooltip title="Edit dose">
                    <Button type="text" size="small" icon={<EditOutlined />} onClick={onEdit} />
                </Tooltip>
                <Tooltip title="Remove">
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={onRemove} />
                </Tooltip>
            </Space>
        </div>
    );
}

function abbreviate(type: string): string {
    const t = type.toLowerCase();
    if (t.startsWith('tab')) return 'Tab';
    if (t.startsWith('cap')) return 'Cap';
    if (t.startsWith('syr')) return 'Syr';
    if (t.startsWith('inj')) return 'Inj';
    if (t.startsWith('sup')) return 'Supp';
    if (t.startsWith('cre')) return 'Cream';
    if (t.startsWith('oin')) return 'Oint';
    if (t.startsWith('dro')) return 'Drops';
    return type;
}
