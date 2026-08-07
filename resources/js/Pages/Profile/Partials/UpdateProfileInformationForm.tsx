import { Link, useForm } from '@inertiajs/react';
import { Alert, Button, Card, Col, Form, Input, Row, Select, Typography } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { FormEventHandler } from 'react';

type ProfileData = {
    name: string;
    email: string;
    phone?: string | null;
    preferred_language: 'en' | 'bn';
};

export default function UpdateProfileInformationForm({
    profile,
    languages,
    mustVerifyEmail,
    status,
}: {
    profile: ProfileData;
    languages: { value: string; label: string }[];
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { data, setData, patch, errors, processing, isDirty } = useForm({
        name: profile.name,
        email: profile.email,
        phone: profile.phone ?? '',
        preferred_language: profile.preferred_language ?? 'en',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('profile.update'), { preserveScroll: true });
    };

    return (
        <Card
            title="Account details"
            extra={
                <Typography.Text type="secondary" className="text-xs">
                    Visible to your colleagues
                </Typography.Text>
            }
        >
            <form onSubmit={submit}>
                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="Full name"
                            required
                            validateStatus={errors.name ? 'error' : undefined}
                            help={errors.name}
                            layout="vertical"
                        >
                            <Input
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                autoComplete="name"
                                maxLength={255}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="Email"
                            required
                            validateStatus={errors.email ? 'error' : undefined}
                            help={errors.email}
                            layout="vertical"
                        >
                            <Input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                autoComplete="username"
                                maxLength={255}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="Phone"
                            validateStatus={errors.phone ? 'error' : undefined}
                            help={errors.phone}
                            layout="vertical"
                        >
                            <Input
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                autoComplete="tel"
                                placeholder="+880 1700 000000"
                                maxLength={30}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="Language"
                            tooltip="Applies to the interface as soon as you save."
                            validateStatus={errors.preferred_language ? 'error' : undefined}
                            help={errors.preferred_language}
                            layout="vertical"
                        >
                            <Select
                                value={data.preferred_language}
                                onChange={(v) => setData('preferred_language', v)}
                                options={languages}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                {mustVerifyEmail && (
                    <Alert
                        type="warning"
                        showIcon
                        className="mb-4"
                        title="Your email address is unverified."
                        description={
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="text-sm underline"
                            >
                                Resend the verification email
                            </Link>
                        }
                    />
                )}

                {status === 'verification-link-sent' && (
                    <Alert
                        type="success"
                        showIcon
                        className="mb-4"
                        title="A new verification link has been sent to your email address."
                    />
                )}

                <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={processing}
                    disabled={!isDirty}
                >
                    Save changes
                </Button>
            </form>
        </Card>
    );
}
