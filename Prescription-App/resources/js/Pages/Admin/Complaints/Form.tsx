import AdminLayout from '@/Layouts/AdminLayout';
import FlashMessage from '@/Components/FlashMessage';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Button, Card, Form, Input, InputNumber, Popconfirm, Space, Switch, Typography, App as AntApp } from 'antd';
import { DeleteOutlined, DragOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
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

interface DurationPreset {
    id: number;
    duration_text_en: string;
    duration_text_bn?: string | null;
    sort_order: number;
}

interface ComplaintRow {
    id: number;
    name_en: string;
    name_bn?: string | null;
    category?: string | null;
    sort_order: number;
    is_active: boolean;
    duration_presets?: DurationPreset[];
}

type Props = PageProps<{
    complaint: ComplaintRow | null;
}>;

export default function ComplaintForm({ complaint }: Props) {
    const { message } = AntApp.useApp();
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);
    const [presetEn, setPresetEn] = useState('');
    const [presetBn, setPresetBn] = useState('');
    const [presets, setPresets] = useState<DurationPreset[]>(complaint?.duration_presets ?? []);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    useEffect(() => {
        setPresets(complaint?.duration_presets ?? []);
    }, [complaint?.id, complaint?.duration_presets]);

    const initial = complaint ?? {
        name_en: '',
        name_bn: '',
        category: '',
        sort_order: 0,
        is_active: true,
    };

    function save() {
        form.validateFields().then((values) => {
            setSaving(true);
            const onOk = () => {
                setSaving(false);
                message.success('Complaint saved.');
            };
            const onFail = () => {
                setSaving(false);
                message.error('Save failed.');
            };
            if (complaint) {
                router.put(`/admin/complaints/${complaint.id}`, values, { onSuccess: onOk, onError: onFail });
            } else {
                router.post('/admin/complaints', values, { onSuccess: onOk, onError: onFail });
            }
        });
    }

    function addPreset() {
        if (!complaint || !presetEn.trim()) {
            message.warning('Enter English preset text.');
            return;
        }
        router.post(
            `/admin/complaints/${complaint.id}/presets`,
            { duration_text_en: presetEn.trim(), duration_text_bn: presetBn.trim() || null },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setPresetEn('');
                    setPresetBn('');
                },
            },
        );
    }

    function removePreset(id: number) {
        router.delete(`/admin/complaints/presets/${id}`, { preserveScroll: true });
    }

    async function onPresetDragEnd(event: DragEndEvent) {
        if (!complaint) return;
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = presets.findIndex((p) => String(p.id) === String(active.id));
        const newIndex = presets.findIndex((p) => String(p.id) === String(over.id));
        if (oldIndex < 0 || newIndex < 0) return;

        const next = arrayMove(presets, oldIndex, newIndex);
        setPresets(next);

        await fetch(`/admin/complaints/${complaint.id}/presets/reorder`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '',
            },
            body: JSON.stringify({ ordered_ids: next.map((p) => p.id) }),
        });
    }

    return (
        <AdminLayout>
            <Head title={complaint ? 'Edit Complaint' : 'New Complaint'} />
            <FlashMessage />

            <div className="mb-4 flex items-center justify-between">
                <Typography.Title level={4} className="!mb-0">
                    {complaint ? `Edit: ${complaint.name_en}` : 'New Complaint'}
                </Typography.Title>
                <Space>
                    <Button onClick={() => router.visit('/admin/complaints')}>Cancel</Button>
                    <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={save}>
                        Save
                    </Button>
                </Space>
            </div>

            <Card className="mb-4">
                <Form layout="vertical" form={form} initialValues={initial}>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Form.Item label="Name (English)" name="name_en" rules={[{ required: true }]}>
                            <Input maxLength={255} />
                        </Form.Item>
                        <Form.Item label="Name (Bangla)" name="name_bn">
                            <Input maxLength={255} />
                        </Form.Item>
                        <Form.Item label="Category" name="category">
                            <Input maxLength={100} placeholder="e.g., General, Respiratory" />
                        </Form.Item>
                        <Form.Item label="Sort Order" name="sort_order">
                            <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item label="Active" name="is_active" valuePropName="checked">
                            <Switch />
                        </Form.Item>
                    </div>
                </Form>
            </Card>

            {complaint && (
                <Card title="Duration Presets">
                    <div className="mb-3 flex flex-wrap gap-2">
                        <Input
                            value={presetEn}
                            onChange={(e) => setPresetEn(e.target.value)}
                            placeholder="English (e.g., 3 days)"
                            style={{ width: 220 }}
                        />
                        <Input
                            value={presetBn}
                            onChange={(e) => setPresetBn(e.target.value)}
                            placeholder="Bangla (optional)"
                            style={{ width: 220 }}
                        />
                        <Button type="primary" icon={<PlusOutlined />} onClick={addPreset}>
                            Add Preset
                        </Button>
                    </div>

                    {presets.length === 0 ? (
                        <div className="text-sm text-gray-500">No presets yet.</div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={onPresetDragEnd}
                        >
                            <SortableContext
                                items={presets.map((p) => String(p.id))}
                                strategy={verticalListSortingStrategy}
                            >
                                {presets.map((p) => (
                                    <SortablePreset
                                        key={p.id}
                                        id={String(p.id)}
                                        preset={p}
                                        onRemove={() => removePreset(p.id)}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    )}
                </Card>
            )}
        </AdminLayout>
    );
}

function SortablePreset({
    id,
    preset,
    onRemove,
}: {
    id: string;
    preset: DurationPreset;
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
                <strong>{preset.duration_text_en}</strong>
                {preset.duration_text_bn && (
                    <span className="ml-2 text-gray-500">{preset.duration_text_bn}</span>
                )}
            </div>
            <Popconfirm
                title="Delete this preset?"
                okText="Delete"
                okButtonProps={{ danger: true }}
                onConfirm={onRemove}
            >
                <Button danger size="small" icon={<DeleteOutlined />} />
            </Popconfirm>
        </div>
    );
}
