import HospitalLayout from '@/Layouts/HospitalLayout';
import FlashMessage from '@/Components/Common/FlashMessage';
import DoctorQuota, { DoctorQuotaData } from '@/Components/Staff/DoctorQuota';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Button, Card, Col, Descriptions, Form, Input, Row, Select, Tag, Typography, App as AntApp } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useState } from 'react';

interface Hospital {
    id: number;
    name: string;
    slug: string;
    logo?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    plan_name?: string | null;
    billing_cycle: 'monthly' | 'yearly';
    currency: string;
    subscription_status: string;
    subscription_ends_at?: string | null;
    /** Effective limits — null means unlimited on this plan. */
    max_doctors: number | null;
    max_patients_per_month: number | null;
    settings: { default_language?: 'en' | 'bn'; working_hours?: string };
}

type Props = PageProps<{
    hospital: Hospital;
    quota: DoctorQuotaData;
    currencies: { code: string; symbol: string; name: string }[];
}>;

export default function HospitalSettings({ hospital, quota, currencies }: Props) {
    const { message } = AntApp.useApp();
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);

    function save(values: any) {
        setSaving(true);
        router.put('/hospital/settings', values, {
            preserveScroll: true,
            onSuccess: () => message.success('Settings saved.'),
            onError: () => message.error('Save failed.'),
            onFinish: () => setSaving(false),
        });
    }

    return (
        <HospitalLayout>
            <Head title="Hospital Settings" />
            <FlashMessage />

            <Typography.Title level={4} className="!mb-4">
                Hospital Settings
            </Typography.Title>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={16}>
                    <Card title="Hospital Info">
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={save}
                            initialValues={{
                                name: hospital.name,
                                logo: hospital.logo ?? '',
                                address: hospital.address ?? '',
                                phone: hospital.phone ?? '',
                                email: hospital.email ?? '',
                                website: hospital.website ?? '',
                                currency: hospital.currency,
                                default_language: hospital.settings.default_language ?? 'en',
                                working_hours: hospital.settings.working_hours ?? '',
                            }}
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <Form.Item label="Name" name="name" rules={[{ required: true }]}>
                                    <Input maxLength={255} />
                                </Form.Item>
                                <Form.Item label="Logo URL" name="logo">
                                    <Input maxLength={500} />
                                </Form.Item>
                                <Form.Item label="Phone" name="phone">
                                    <Input />
                                </Form.Item>
                                <Form.Item label="Email" name="email" rules={[{ type: 'email' }]}>
                                    <Input />
                                </Form.Item>
                                <Form.Item label="Website" name="website" rules={[{ type: 'url' }]}>
                                    <Input />
                                </Form.Item>
                                <Form.Item label="Default Language for new doctors" name="default_language">
                                    <Select
                                        options={[
                                            { label: 'English', value: 'en' },
                                            { label: 'বাংলা', value: 'bn' },
                                        ]}
                                    />
                                </Form.Item>
                                <Form.Item
                                    label="Currency"
                                    name="currency"
                                    rules={[{ required: true }]}
                                    tooltip="Used for consultation fees, chamber fees and daily statements. Your subscription is billed separately."
                                >
                                    <Select
                                        showSearch
                                        optionFilterProp="label"
                                        options={currencies.map((c) => ({
                                            value: c.code,
                                            label: `${c.code} — ${c.name} (${c.symbol})`,
                                        }))}
                                    />
                                </Form.Item>
                            </div>
                            <Form.Item label="Address" name="address">
                                <Input.TextArea rows={2} maxLength={1000} />
                            </Form.Item>
                            <Form.Item label="Working Hours (free text)" name="working_hours">
                                <Input.TextArea rows={2} maxLength={500} placeholder="e.g., Sat–Thu 9am–9pm, Fri off" />
                            </Form.Item>
                            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                                Save
                            </Button>
                        </Form>
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card title="Subscription (read-only)" className="mb-4">
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label="Plan">
                                <Tag color="blue">{hospital.plan_name ?? 'No plan'}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Billing">
                                <span className="capitalize">{hospital.billing_cycle}</span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Status">
                                <Tag color={hospital.subscription_status === 'active' ? 'green' : 'orange'}>
                                    {hospital.subscription_status}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Ends">
                                {hospital.subscription_ends_at ?? '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Max Doctors">
                                {hospital.max_doctors ?? 'Unlimited'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Max Patients/mo">
                                {hospital.max_patients_per_month ?? 'Unlimited'}
                            </Descriptions.Item>
                        </Descriptions>
                        <p className="mt-2 text-xs text-gray-400">
                            Contact your platform administrator to change plan.
                        </p>
                    </Card>

                    <DoctorQuota quota={quota} />
                </Col>
            </Row>
        </HospitalLayout>
    );
}
