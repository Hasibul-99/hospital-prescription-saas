import AdminLayout from '@/Layouts/AdminLayout';
import FlashMessage from '@/Components/FlashMessage';
import { Head, router } from '@inertiajs/react';
import { PageProps, Medicine } from '@/types';
import { Button, Card, Form, Input, InputNumber, Select, Space, Switch, Typography, App as AntApp } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useState } from 'react';

type Props = PageProps<{
    medicine: Medicine | null;
    types: string[];
}>;

export default function AdminMedicineForm({ medicine, types }: Props) {
    const { message } = AntApp.useApp();
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();

    const initial = medicine ?? {
        brand_name: '',
        generic_name: '',
        type: 'Tablet',
        strength: '',
        manufacturer: '',
        price: null as number | null,
        is_active: true,
    };

    function save() {
        form.validateFields().then((values) => {
            setSaving(true);
            const onOk = () => {
                setSaving(false);
                message.success('Medicine saved.');
            };
            const onFail = () => {
                setSaving(false);
                message.error('Save failed.');
            };

            if (medicine) {
                router.put(`/admin/medicines/${medicine.id}`, values, { onSuccess: onOk, onError: onFail });
            } else {
                router.post('/admin/medicines', values, { onSuccess: onOk, onError: onFail });
            }
        });
    }

    return (
        <AdminLayout>
            <Head title={medicine ? 'Edit Medicine' : 'New Medicine'} />
            <FlashMessage />

            <div className="mb-4 flex items-center justify-between">
                <Typography.Title level={4} className="!mb-0">
                    {medicine ? 'Edit Medicine' : 'New Medicine'}
                </Typography.Title>
                <Space>
                    <Button onClick={() => router.visit('/admin/medicines')}>Cancel</Button>
                    <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={save}>
                        Save
                    </Button>
                </Space>
            </div>

            <Card>
                <Form layout="vertical" form={form} initialValues={initial}>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Form.Item
                            label="Brand Name"
                            name="brand_name"
                            rules={[{ required: true, message: 'Brand name required' }]}
                        >
                            <Input maxLength={255} />
                        </Form.Item>

                        <Form.Item label="Generic Name" name="generic_name">
                            <Input maxLength={255} />
                        </Form.Item>

                        <Form.Item label="Type" name="type" rules={[{ required: true }]}>
                            <Select options={types.map((t) => ({ label: t, value: t }))} />
                        </Form.Item>

                        <Form.Item label="Strength" name="strength">
                            <Input maxLength={100} placeholder="e.g., 500 mg" />
                        </Form.Item>

                        <Form.Item label="Manufacturer" name="manufacturer">
                            <Input maxLength={255} />
                        </Form.Item>

                        <Form.Item label="Price (BDT)" name="price">
                            <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item label="Active" name="is_active" valuePropName="checked">
                            <Switch />
                        </Form.Item>
                    </div>
                </Form>
            </Card>
        </AdminLayout>
    );
}
