import HospitalLayout from '@/Layouts/HospitalLayout';
import FlashMessage from '@/Components/FlashMessage';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { App as AntApp, Button, Card, Col, Form, Input, Row, Space, Switch, Typography } from 'antd';
import { ReactNode } from 'react';

const { Title } = Typography;

type Receptionist = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    is_active: boolean;
};

type Props = PageProps<{ receptionist: Receptionist | null }>;

export default function ReceptionistForm({ receptionist }: Props) {
    const { message } = AntApp.useApp();
    const isEdit = receptionist !== null;

    function onFinish(values: Record<string, unknown>) {
        if (isEdit) {
            router.put(`/hospital/receptionists/${receptionist.id}`, values as never, {
                onError: () => message.error('Please fix the errors and try again.'),
            });
        } else {
            router.post('/hospital/receptionists', values as never, {
                onError: () => message.error('Please fix the errors and try again.'),
            });
        }
    }

    const initialValues = isEdit
        ? { name: receptionist.name, email: receptionist.email, phone: receptionist.phone, is_active: receptionist.is_active }
        : { is_active: true };

    return (
        <>
            <Head title={isEdit ? 'Edit Receptionist' : 'Add Receptionist'} />
            <FlashMessage />

            <Title level={4} style={{ marginBottom: 24 }}>{isEdit ? 'Edit Receptionist' : 'Add Receptionist'}</Title>

            <Form layout="vertical" initialValues={initialValues} onFinish={onFinish} style={{ maxWidth: 640 }}>
                <Card style={{ marginBottom: 16 }}>
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item name="phone" label="Phone">
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item name="is_active" label="Active" valuePropName="checked">
                                <Switch />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="password"
                                label={isEdit ? 'New Password (leave blank to keep)' : 'Password'}
                                rules={isEdit ? [] : [{ required: true, min: 8 }]}
                            >
                                <Input.Password />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="password_confirmation"
                                label="Confirm Password"
                                dependencies={['password']}
                                rules={[
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            const pwd = getFieldValue('password');
                                            if (!pwd || pwd === value) return Promise.resolve();
                                            return Promise.reject(new Error('Passwords do not match.'));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                <Space>
                    <Button type="primary" htmlType="submit">{isEdit ? 'Update' : 'Create'}</Button>
                    <Button onClick={() => router.visit('/hospital/receptionists')}>Cancel</Button>
                </Space>
            </Form>
        </>
    );
}

ReceptionistForm.layout = (page: ReactNode) => <HospitalLayout>{page}</HospitalLayout>;
