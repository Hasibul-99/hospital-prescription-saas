import AdminLayout from '@/Layouts/AdminLayout';
import FlashMessage from '@/Components/FlashMessage';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import {
    Alert,
    Button,
    Card,
    Col,
    Form,
    Input,
    Row,
    Select,
    Switch,
    Typography,
    App as AntApp,
} from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useState } from 'react';

type CurrencyOption = { code: string; symbol: string; name: string };

type Props = PageProps<{
    platform: { name: string; logo_url?: string | null };
    currency: { current: string; supported: CurrencyOption[] };
    plan_count: number;
    maintenance_mode: boolean;
}>;

export default function AdminSettings({ platform, currency, plan_count, maintenance_mode }: Props) {
    const { message } = AntApp.useApp();
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);
    const [maintenance, setMaintenance] = useState(maintenance_mode);
    const [baseCurrency, setBaseCurrency] = useState(currency.current);

    function saveCurrency(code: string) {
        setBaseCurrency(code);
        router.put(
            '/admin/settings/currency',
            { currency: code },
            {
                preserveScroll: true,
                onError: () => {
                    setBaseCurrency(currency.current);
                    message.error('Could not change the platform currency.');
                },
            },
        );
    }

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

                <Col xs={24} lg={12}>
                    <Card title="Platform Currency">
                        <p className="mb-3 text-sm text-gray-600">
                            The currency subscription plan prices are quoted in, and the one shown on the public
                            pricing page. Each hospital picks its own currency separately for in-app money.
                        </p>

                        <Select
                            value={baseCurrency}
                            onChange={saveCurrency}
                            style={{ width: '100%', maxWidth: 360 }}
                            options={currency.supported.map((c) => ({
                                value: c.code,
                                label: `${c.code} — ${c.name} (${c.symbol})`,
                            }))}
                        />

                        <Alert
                            className="mt-3"
                            type="info"
                            showIcon
                            message="Changing this does not convert any price."
                            description="Plan amounts stay exactly as entered — only the symbol they display with changes."
                        />
                    </Card>
                </Col>

                <Col xs={24} lg={12}>
                    <Card title="Subscription Plans">
                        <p className="mb-3 text-sm text-gray-600">
                            {plan_count === 0
                                ? 'No active plans yet — the pricing page will be empty until you add one.'
                                : `${plan_count} active ${plan_count === 1 ? 'plan' : 'plans'}. Prices, limits and the landing page cards are all managed here.`}
                        </p>
                        <Button type="primary" onClick={() => router.visit('/admin/plans')}>
                            Manage Plans
                        </Button>
                    </Card>
                </Col>
            </Row>
        </AdminLayout>
    );
}
