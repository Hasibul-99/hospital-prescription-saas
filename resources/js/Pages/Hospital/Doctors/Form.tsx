import HospitalLayout from '@/Layouts/HospitalLayout';
import FlashMessage from '@/Components/FlashMessage';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { App as AntApp, Button, Card, Col, Form, Input, InputNumber, Row, Space, Switch, Typography } from 'antd';
import { ReactNode } from 'react';

const { Title } = Typography;

type DoctorProfile = {
    specialization: string | null;
    designation: string | null;
    bmdc_number: string | null;
    degrees: string | null;
    consultation_fee: number | null;
};

type Doctor = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    is_active: boolean;
    doctor_profile: DoctorProfile | null;
};

type Props = PageProps<{ doctor: Doctor | null }>;

export default function DoctorForm({ doctor }: Props) {
    const { message } = AntApp.useApp();
    const isEdit = doctor !== null;

    function onFinish(values: Record<string, unknown>) {
        if (isEdit) {
            router.put(`/hospital/doctors/${doctor.id}`, values as never, {
                onError: () => message.error('Please fix the errors and try again.'),
            });
        } else {
            router.post('/hospital/doctors', values as never, {
                onError: () => message.error('Please fix the errors and try again.'),
            });
        }
    }

    const initialValues = isEdit
        ? {
              name: doctor.name,
              email: doctor.email,
              phone: doctor.phone,
              is_active: doctor.is_active,
              bmdc_number: doctor.doctor_profile?.bmdc_number,
              degrees: doctor.doctor_profile?.degrees,
              specialization: doctor.doctor_profile?.specialization,
              designation: doctor.doctor_profile?.designation,
              consultation_fee: doctor.doctor_profile?.consultation_fee,
          }
        : { is_active: true };

    return (
        <>
            <Head title={isEdit ? 'Edit Doctor' : 'Add Doctor'} />
            <FlashMessage />

            <Title level={4} style={{ marginBottom: 24 }}>{isEdit ? 'Edit Doctor' : 'Add Doctor'}</Title>

            <Form layout="vertical" initialValues={initialValues} onFinish={onFinish} style={{ maxWidth: 800 }}>
                <Card title="Account" style={{ marginBottom: 16 }}>
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

                <Card title="Professional Info" style={{ marginBottom: 16 }}>
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item name="bmdc_number" label="BMDC Number">
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item name="consultation_fee" label="Consultation Fee (৳)">
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item name="specialization" label="Specialization">
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item name="designation" label="Designation">
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col xs={24}>
                            <Form.Item name="degrees" label="Degrees / Qualifications">
                                <Input.TextArea rows={2} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                <Space>
                    <Button type="primary" htmlType="submit">{isEdit ? 'Update Doctor' : 'Create Doctor'}</Button>
                    <Button onClick={() => router.visit('/hospital/doctors')}>Cancel</Button>
                </Space>
            </Form>
        </>
    );
}

DoctorForm.layout = (page: ReactNode) => <HospitalLayout>{page}</HospitalLayout>;
