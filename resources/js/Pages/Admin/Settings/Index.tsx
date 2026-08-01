import AdminLayout from '@/Layouts/AdminLayout';
import FlashMessage from '@/Components/FlashMessage';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import {
    Alert,
    Button,
    Card,
    Col,
    Descriptions,
    Form,
    Input,
    Row,
    Switch,
    Tag,
    Typography,
    App as AntApp,
} from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useState } from 'react';

interface Plan {
    price: number;
    max_doctors: number;
    max_patients_per_month: number;
}

type Props = PageProps<{
    platform: { name: string; logo_url?: string | null };
    plans: Record<string, Plan>;
    maintenance_mode: boolean;
}>;

export default function AdminSettings({ platform, plans, maintenance_mode }: Props) {
    const { message } = AntApp.useApp();
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);
    const [maintenance, setMaintenance] = useState(maintenance_mode);

    function savePlatform(values: any) {
        setSaving(true);
        router.put('/admin/settings/platform', values, {
            preserveScroll: true,
            onSuccess: () => message.success('Platform settings saved.'),
            onError: () => message.error('Save failed.'),
            onFinish: () => setSaving(false),
        });
    }

    function toggleMaintenance(enable: boolean) {
        router.put(
            '/admin/settings/maintenance',
            { enable },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setMaintenance(enable);
                    message.success(`Maintenance mode ${enable ? 'enabled' : 'disabled'}.`);
                },
                onError: () => message.error('Failed.'),
            },
        );
    }

    return (
        <AdminLayout>
            <Head title="Platform Settings" />
            <FlashMessage />

            <Typography.Title level={4} className="!mb-4">
                Platform Settings
            </Typography.Title>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                    <Card title="Platform Identity">
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={savePlatform}
                            initialValues={{ name: platform.name, logo_url: platform.logo_url ?? '' }}
                        >
                            <Form.Item label="Platform Name" name="name" rules={[{ required: true }]}>
                                <Input maxLength={100} />
                            </Form.Item>
                            <Form.Item label="Logo URL (optional)" name="logo_url">
                                <Input placeholder="https://…/logo.png" />
                            </Form.Item>
                            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                                Save
                            </Button>
                        </Form>
                    </Card>
                </Col>

                <Col xs={24} lg={12}>
                    <Card title="Maintenance Mode">
                        {maintenance && (
                            <Alert
                                className="mb-3"
                                type="warning"
                                showIcon
                                message="Maintenance mode is ON"
                                description="All non-super-admin requests are blocked. Bypass at /medixpro-bypass"
                            />
                        )}
                        <div className="flex items-center gap-3">
                            <Switch checked={maintenance} onChange={toggleMaintenance} />
                            <span className="text-sm text-gray-600">
                                {maintenance ? 'Disable maintenance mode' : 'Enable maintenance mode'}
                            </span>
                        </div>
                    </Card>
                </Col>

                <Col xs={24}>
                    <Card title="Subscription Plans (read-only)">
                        <Descriptions bordered size="small" column={4}>
                            {Object.entries(plans).map(([key, plan]) => (
                                <Descriptions.Item
                                    key={key}
                                    label={
                                        <span>
                                            <Tag color="blue">{key}</Tag>
                                        </span>
                                    }
                                    span={1}
                                >
                                    <div className="text-sm">
                                        <div>Price: <strong>{plan.price}</strong> BDT/mo</div>
                                        <div>Max Doctors: {plan.max_doctors}</div>
                                        <div>Max Patients/mo: {plan.max_patients_per_month}</div>
                                    </div>
                                </Descriptions.Item>
                            ))}
                        </Descriptions>
                        <div className="mt-3 text-xs text-gray-500">
                            Edit via <code>config/subscription.php</code>.
                        </div>
                    </Card>
                </Col>
            </Row>
        </AdminLayout>
    );
}
