import DoctorLayout from '@/Layouts/DoctorLayout';
import FlashMessage from '@/Components/FlashMessage';
import { Head } from '@inertiajs/react';
import { Medicine, PageProps } from '@/types';
import {
    AutoComplete,
    Badge,
    Button,
    Card,
    Col,
    Empty,
    List,
    Popconfirm,
    Row,
    Space,
    Tabs,
    Tag,
    Typography,
    App as AntApp,
} from 'antd';
import { DeleteOutlined, DragOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';
import {
    DndContext,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FrequentRow {
    id: number;
    sort_order: number;
    medicine: Medicine | null;
}

interface DefaultRow {
    id: number;
    medicine: Medicine | null;
    dose_morning?: number | null;
    dose_noon?: number | null;
    dose_afternoon?: number | null;
    dose_night?: number | null;
    dose_bedtime?: number | null;
    timing?: string | null;
    duration_value?: number | null;
    duration_unit?: string | null;
    custom_instruction?: string | null;
}

type Props = PageProps<{
    frequent: FrequentRow[];
    defaults: DefaultRow[];
    frequent_cap: number;
}>;

export default function MedicineDefaults({ frequent: initialFrequent, defaults, frequent_cap }: Props) {
    const { message } = AntApp.useApp();
    const [frequent, setFrequent] = useState<FrequentRow[]>(initialFrequent);
    const [search, setSearch] = useState('');
    const [options, setOptions] = useState<{ value: string; label: string; medicine: Medicine }[]>([]);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    async function searchMeds(q: string) {
        setSearch(q);
        if (!q.trim()) {
            setOptions([]);
            return;
        }
        const res = await fetch(`/doctor/medicines/search?q=${encodeURIComponent(q)}&limit=15`, {
            credentials: 'same-origin',
            headers: { Accept: 'application/json' },
        });
        if (!res.ok) return;
        const json = await res.json();
        setOptions(
            (json.results ?? []).map((m: Medicine) => ({
                value: String(m.id),
                label: `${m.brand_name}${m.strength ? ` — ${m.strength}` : ''} (${m.generic_name ?? ''})`,
                medicine: m,
            })),
        );
    }

    async function addFrequent(medicine: Medicine) {
        if (frequent.length >= frequent_cap) {
            message.warning(`Cap reached (${frequent_cap}). Remove one first.`);
            return;
        }
        if (frequent.some((f) => f.medicine?.id === medicine.id)) {
            message.info('Already in your frequent list.');
            return;
        }
        const res = await fetch(`/doctor/medicines/frequent/${medicine.id}`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '',
            },
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            message.error(err.message ?? 'Failed to add.');
            return;
        }
        setFrequent((prev) => [
            ...prev,
            { id: Date.now(), sort_order: prev.length, medicine },
        ]);
        setSearch('');
        setOptions([]);
        message.success('Added.');
    }

    async function removeFrequent(medicineId: number) {
        const res = await fetch(`/doctor/medicines/frequent/${medicineId}`, {
            method: 'DELETE',
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '',
            },
        });
        if (!res.ok) {
            message.error('Failed to remove.');
            return;
        }
        setFrequent((prev) => prev.filter((f) => f.medicine?.id !== medicineId));
    }

    async function onDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = frequent.findIndex((f) => String(f.medicine?.id) === String(active.id));
        const newIndex = frequent.findIndex((f) => String(f.medicine?.id) === String(over.id));
        if (oldIndex < 0 || newIndex < 0) return;

        const next = arrayMove(frequent, oldIndex, newIndex);
        setFrequent(next);

        await fetch('/doctor/settings/frequent/reorder', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '',
            },
            body: JSON.stringify({
                ordered_medicine_ids: next.map((f) => f.medicine?.id).filter(Boolean),
            }),
        });
    }

    async function removeDefault(medicineId: number) {
        const res = await fetch(`/doctor/medicine-defaults/${medicineId}`, {
            method: 'DELETE',
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '',
            },
        });
        if (!res.ok) {
            message.error('Failed to remove default.');
            return;
        }
        message.success('Default removed. Reload to refresh.');
    }

    return (
        <DoctorLayout>
            <Head title="Medicine Settings" />
            <FlashMessage />

            <div className="mb-4 flex items-center justify-between">
                <Typography.Title level={4} className="!mb-0">
                    Medicine Settings
                </Typography.Title>
                <Badge count={`${frequent.length} / ${frequent_cap}`} color="blue" />
            </div>

            <Tabs
                items={[
                    {
                        key: 'frequent',
                        label: 'Frequent Medicines',
                        children: (
                            <Row gutter={[16, 16]}>
                                <Col xs={24} md={10}>
                                    <Card title="Add Medicine">
                                        <AutoComplete
                                            value={search}
                                            options={options}
                                            onSearch={searchMeds}
                                            onSelect={(_, opt) => addFrequent((opt as any).medicine)}
                                            style={{ width: '100%' }}
                                            placeholder="Type brand or generic..."
                                        />
                                    </Card>
                                </Col>
                                <Col xs={24} md={14}>
                                    <Card title="Your Frequent Medicines (drag to reorder)">
                                        {frequent.length === 0 ? (
                                            <Empty description="No frequent medicines yet." />
                                        ) : (
                                            <DndContext
                                                sensors={sensors}
                                                collisionDetection={closestCenter}
                                                onDragEnd={onDragEnd}
                                            >
                                                <SortableContext
                                                    items={frequent.map((f) => String(f.medicine?.id))}
                                                    strategy={verticalListSortingStrategy}
                                                >
                                                    {frequent.map((f) =>
                                                        f.medicine ? (
                                                            <SortableRow
                                                                key={f.medicine.id}
                                                                id={String(f.medicine.id)}
                                                                medicine={f.medicine}
                                                                onRemove={() => removeFrequent(f.medicine!.id)}
                                                            />
                                                        ) : null,
                                                    )}
                                                </SortableContext>
                                            </DndContext>
                                        )}
                                    </Card>
                                </Col>
                            </Row>
                        ),
                    },
                    {
                        key: 'defaults',
                        label: 'Saved Dose Defaults',
                        children: (
                            <Card>
                                {defaults.length === 0 ? (
                                    <Empty description="No saved defaults. Set a default from Add Medicine modal in any prescription." />
                                ) : (
                                    <List
                                        dataSource={defaults}
                                        renderItem={(d) => (
                                            <List.Item
                                                actions={[
                                                    d.medicine && (
                                                        <Popconfirm
                                                            key="del"
                                                            title="Remove this dose default?"
                                                            okText="Remove"
                                                            okButtonProps={{ danger: true }}
                                                            onConfirm={() => removeDefault(d.medicine!.id)}
                                                        >
                                                            <Button danger size="small" icon={<DeleteOutlined />}>
                                                                Remove
                                                            </Button>
                                                        </Popconfirm>
                                                    ),
                                                ]}
                                            >
                                                <List.Item.Meta
                                                    title={
                                                        <Space>
                                                            <strong>
                                                                {d.medicine?.brand_name ?? 'Unknown'}{' '}
                                                                {d.medicine?.strength && (
                                                                    <span className="text-gray-500">— {d.medicine.strength}</span>
                                                                )}
                                                            </strong>
                                                            {d.medicine?.type && <Tag>{d.medicine.type}</Tag>}
                                                        </Space>
                                                    }
                                                    description={
                                                        <Space wrap size={[8, 4]}>
                                                            <Tag color="blue">
                                                                Dose: {fmtDose(d)}
                                                            </Tag>
                                                            {d.timing && <Tag>{d.timing}</Tag>}
                                                            {d.duration_value != null && (
                                                                <Tag>
                                                                    {d.duration_value} {d.duration_unit ?? ''}
                                                                </Tag>
                                                            )}
                                                            {d.custom_instruction && (
                                                                <span className="text-xs text-gray-500">
                                                                    {d.custom_instruction}
                                                                </span>
                                                            )}
                                                        </Space>
                                                    }
                                                />
                                            </List.Item>
                                        )}
                                    />
                                )}
                            </Card>
                        ),
                    },
                ]}
            />
        </DoctorLayout>
    );
}

function fmtDose(d: DefaultRow): string {
    const parts = [d.dose_morning, d.dose_noon, d.dose_afternoon, d.dose_night, d.dose_bedtime];
    return parts.map((p) => (p == null ? '0' : String(p))).join(' + ');
}

function SortableRow({
    id,
    medicine,
    onRemove,
}: {
    id: string;
    medicine: Medicine;
    onRemove: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="mb-2 flex items-center gap-2 rounded border border-gray-200 bg-white p-2"
        >
            <span className="cursor-grab text-gray-400" {...attributes} {...listeners}>
                <DragOutlined />
            </span>
            <div className="flex-1">
                <div className="font-medium">
                    {medicine.brand_name}
                    {medicine.strength && <span className="text-gray-500"> — {medicine.strength}</span>}
                </div>
                <div className="text-xs text-gray-500">
                    {medicine.generic_name} · {medicine.type}
                </div>
            </div>
            <Popconfirm
                title="Remove from frequent list?"
                okText="Remove"
                okButtonProps={{ danger: true }}
                onConfirm={onRemove}
            >
                <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
        </div>
    );
}
