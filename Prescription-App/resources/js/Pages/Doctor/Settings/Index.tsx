import DoctorLayout from '@/Layouts/DoctorLayout';
import FlashMessage from '@/Components/FlashMessage';
import { Head, router } from '@inertiajs/react';
import { DoctorProfile, PageProps } from '@/types';
import {
    Avatar,
    Button,
    Card,
    Col,
    Form,
    Input,
    InputNumber,
    Row,
    Select,
    Switch,
    Tabs,
    Typography,
    Upload,
    App as AntApp,
} from 'antd';
import type { UploadProps } from 'antd';
import { LockOutlined, SaveOutlined, UploadOutlined, UserOutlined } from '@ant-design/icons';
import { useState } from 'react';

type Props = PageProps<{
    profile: DoctorProfile;
    user: { id: number; name: string; email: string; phone?: string; preferred_language: 'en' | 'bn' };
}>;

export default function DoctorSettings({ profile, user }: Props) {
    const { message } = AntApp.useApp();
    const [profileForm] = Form.useForm();
    const [prefsForm] = Form.useForm();
    const [pwForm] = Form.useForm();
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPrefs, setSavingPrefs] = useState(false);
    const [savingPw, setSavingPw] = useState(false);

    function saveProfile(values: any) {
        setSavingProfile(true);
        router.put('/doctor/settings/profile', values, {
            preserveScroll: true,
            onSuccess: () => message.success('Profile saved.'),
            onError: () => message.error('Save failed.'),
            onFinish: () => setSavingProfile(false),
        });
    }

    function savePrefs(values: any) {
        setSavingPrefs(true);
        router.put('/doctor/settings/preferences', values, {
            preserveScroll: true,
            onSuccess: () => message.success('Preferences saved.'),
            onError: () => message.error('Save failed.'),
            onFinish: () => setSavingPrefs(false),
        });
    }

    function savePassword(values: any) {
        setSavingPw(true);
        router.put('/doctor/settings/password', values, {
            preserveScroll: true,
            onSuccess: () => {
                message.success('Password changed.');
                pwForm.resetFields();
            },
            onError: (errors) => message.error(errors.current_password ?? 'Failed.'),
            onFinish: () => setSavingPw(false),
        });
    }

    function uploadProps(kind: string): UploadProps {
        return {
            name: 'image',
            action: '/doctor/settings/upload',
            data: { kind },
            headers: {
                'X-CSRF-TOKEN':
                    (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '',
                'X-Requested-With': 'XMLHttpRequest',
            },
            withCredentials: true,
            showUploadList: false,
            accept: '.jpg,.jpeg,.png,.webp',
            onChange(info) {
                if (info.file.status === 'done') {
                    message.success(`${kind} uploaded.`);
                    router.reload({ only: ['profile'] });
                } else if (info.file.status === 'error') {
                    message.error('Upload failed.');
                }
            },
        };
    }

    return (
        <DoctorLayout>
            <Head title="Settings" />
            <FlashMessage />

            <Typography.Title level={4} className="!mb-4">
                Settings
            </Typography.Title>

            <Tabs
                items={[
                    {
                        key: 'profile',
                        label: 'Profile',
                        children: (
                            <Row gutter={[16, 16]}>
                                <Col xs={24} md={16}>
                                    <Card title="Profile & BMDC">
                                        <Form
                                            form={profileForm}
                                            layout="vertical"
                                            onFinish={saveProfile}
                                            initialValues={{
                                                name: user.name,
                                                phone: user.phone ?? '',
                                                bmdc_number: profile.bmdc_number ?? '',
                                                degrees: profile.degrees ?? '',
                                                specialization: profile.specialization ?? '',
                                                designation: profile.designation ?? '',
                                                consultation_fee: profile.consultation_fee ?? 0,
                                                follow_up_fee: profile.follow_up_fee ?? 0,
                                                prescription_header_text: profile.prescription_header_text ?? '',
                                                prescription_footer_text: profile.prescription_footer_text ?? '',
                                            }}
                                        >
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <Form.Item label="Name" name="name" rules={[{ required: true }]}>
                                                    <Input />
                                                </Form.Item>
                                                <Form.Item label="Phone" name="phone">
                                                    <Input />
                                                </Form.Item>
                                                <Form.Item label="BMDC Number" name="bmdc_number">
                                                    <Input />
                                                </Form.Item>
                                                <Form.Item label="Designation" name="designation">
                                                    <Input />
                                                </Form.Item>
                                                <Form.Item label="Degrees" name="degrees">
                                                    <Input />
                                                </Form.Item>
                                                <Form.Item label="Specialization" name="specialization">
                                                    <Input />
                                                </Form.Item>
                                                <Form.Item label="Consultation Fee (BDT)" name="consultation_fee">
                                                    <InputNumber min={0} style={{ width: '100%' }} />
                                                </Form.Item>
                                                <Form.Item label="Follow-up Fee (BDT)" name="follow_up_fee">
                                                    <InputNumber min={0} style={{ width: '100%' }} />
                                                </Form.Item>
                                            </div>
                                            <Form.Item label="Header Text (used when image not set)" name="prescription_header_text">
                                                <Input.TextArea rows={2} maxLength={1000} />
                                            </Form.Item>
                                            <Form.Item label="Footer Text" name="prescription_footer_text">
                                                <Input.TextArea rows={2} maxLength={1000} />
                                            </Form.Item>
                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                                icon={<SaveOutlined />}
                                                loading={savingProfile}
                                            >
                                                Save Profile
                                            </Button>
                                        </Form>
                                    </Card>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Card title="Images" size="small">
                                        <div className="mb-3 flex flex-col items-center gap-2">
                                            <Avatar
                                                size={96}
                                                src={profile.signature_image}
                                                icon={!profile.signature_image && <UserOutlined />}
                                            />
                                            <Upload {...uploadProps('signature')}>
                                                <Button size="small" icon={<UploadOutlined />}>
                                                    Upload Signature
                                                </Button>
                                            </Upload>
                                        </div>
                                        <div className="mb-3">
                                            <div className="mb-1 text-xs text-gray-500">Header Image</div>
                                            {profile.prescription_header_image && (
                                                <img
                                                    src={profile.prescription_header_image}
                                                    alt="header"
                                                    className="mb-2 max-h-20 w-full rounded border object-contain"
                                                />
                                            )}
                                            <Upload {...uploadProps('header')}>
                                                <Button size="small" icon={<UploadOutlined />}>
                                                    Upload Header
                                                </Button>
                                            </Upload>
                                        </div>
                                        <div>
                                            <div className="mb-1 text-xs text-gray-500">Footer Image</div>
                                            {profile.prescription_footer_image && (
                                                <img
                                                    src={profile.prescription_footer_image}
                                                    alt="footer"
                                                    className="mb-2 max-h-20 w-full rounded border object-contain"
                                                />
                                            )}
                                            <Upload {...uploadProps('footer')}>
                                                <Button size="small" icon={<UploadOutlined />}>
                                                    Upload Footer
                                                </Button>
                                            </Upload>
                                        </div>
                                    </Card>
                                </Col>
                            </Row>
                        ),
                    },
                    {
                        key: 'prefs',
                        label: 'Prescription Preferences',
                        children: (
                            <Card>
                                <Form
                                    form={prefsForm}
                                    layout="vertical"
                                    onFinish={savePrefs}
                                    initialValues={{
                                        preferred_language: user.preferred_language,
                                        default_prescription_language: profile.default_prescription_language ?? 'both',
                                        print_paper_size: profile.print_paper_size ?? 'A4',
                                        print_show_header: profile.print_show_header ?? true,
                                        print_show_footer: profile.print_show_footer ?? true,
                                        print_show_logo: profile.print_show_logo ?? false,
                                        print_header_mode: profile.print_header_mode ?? 'text',
                                        print_footer_mode: profile.print_footer_mode ?? 'signature',
                                        print_font_size: profile.print_font_size ?? 'medium',
                                        print_margin_top: profile.print_margin_top ?? 15,
                                        print_margin_bottom: profile.print_margin_bottom ?? 15,
                                        print_margin_left: profile.print_margin_left ?? 15,
                                        print_margin_right: profile.print_margin_right ?? 15,
                                    }}
                                >
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <Form.Item label="UI Language" name="preferred_language">
                                            <Select
                                                options={[
                                                    { label: 'English', value: 'en' },
                                                    { label: 'বাংলা', value: 'bn' },
                                                ]}
                                            />
                                        </Form.Item>
                                        <Form.Item label="Prescription Output Language" name="default_prescription_language">
                                            <Select
                                                options={[
                                                    { label: 'English', value: 'en' },
                                                    { label: 'Bangla', value: 'bn' },
                                                    { label: 'Both', value: 'both' },
                                                ]}
                                            />
                                        </Form.Item>
                                        <Form.Item label="Paper Size" name="print_paper_size">
                                            <Select
                                                options={[
                                                    { label: 'A4', value: 'A4' },
                                                    { label: 'Letter', value: 'Letter' },
                                                ]}
                                            />
                                        </Form.Item>
                                        <Form.Item label="Font Size" name="print_font_size">
                                            <Select
                                                options={[
                                                    { label: 'Small', value: 'small' },
                                                    { label: 'Medium', value: 'medium' },
                                                    { label: 'Large', value: 'large' },
                                                ]}
                                            />
                                        </Form.Item>
                                        <Form.Item label="Header Mode" name="print_header_mode">
                                            <Select
                                                options={[
                                                    { label: 'Image', value: 'image' },
                                                    { label: 'Text', value: 'text' },
                                                    { label: 'None', value: 'none' },
                                                ]}
                                            />
                                        </Form.Item>
                                        <Form.Item label="Footer Mode" name="print_footer_mode">
                                            <Select
                                                options={[
                                                    { label: 'Image', value: 'image' },
                                                    { label: 'Signature', value: 'signature' },
                                                    { label: 'None', value: 'none' },
                                                ]}
                                            />
                                        </Form.Item>
                                        <Form.Item label="Show Header" name="print_show_header" valuePropName="checked">
                                            <Switch />
                                        </Form.Item>
                                        <Form.Item label="Show Footer" name="print_show_footer" valuePropName="checked">
                                            <Switch />
                                        </Form.Item>
                                        <Form.Item label="Show Logo" name="print_show_logo" valuePropName="checked">
                                            <Switch />
                                        </Form.Item>
                                        <Form.Item label="Margin Top (mm)" name="print_margin_top">
                                            <InputNumber min={0} max={50} style={{ width: '100%' }} />
                                        </Form.Item>
                                        <Form.Item label="Margin Bottom (mm)" name="print_margin_bottom">
                                            <InputNumber min={0} max={50} style={{ width: '100%' }} />
                                        </Form.Item>
                                        <Form.Item label="Margin Left (mm)" name="print_margin_left">
                                            <InputNumber min={0} max={50} style={{ width: '100%' }} />
                                        </Form.Item>
                                        <Form.Item label="Margin Right (mm)" name="print_margin_right">
                                            <InputNumber min={0} max={50} style={{ width: '100%' }} />
                                        </Form.Item>
                                    </div>
                                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={savingPrefs}>
                                        Save Preferences
                                    </Button>
                                </Form>
                            </Card>
                        ),
                    },
                    {
                        key: 'password',
                        label: 'Password',
                        children: (
                            <Card>
                                <Form form={pwForm} layout="vertical" onFinish={savePassword} style={{ maxWidth: 500 }}>
                                    <Form.Item label="Current Password" name="current_password" rules={[{ required: true }]}>
                                        <Input.Password />
                                    </Form.Item>
                                    <Form.Item
                                        label="New Password"
                                        name="password"
                                        rules={[{ required: true, min: 8, message: 'Min 8 chars' }]}
                                    >
                                        <Input.Password />
                                    </Form.Item>
                                    <Form.Item
                                        label="Confirm Password"
                                        name="password_confirmation"
                                        dependencies={['password']}
                                        rules={[
                                            { required: true },
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    if (!value || getFieldValue('password') === value) {
                                                        return Promise.resolve();
                                                    }
                                                    return Promise.reject(new Error('Passwords do not match'));
                                                },
                                            }),
                                        ]}
                                    >
                                        <Input.Password />
                                    </Form.Item>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        icon={<LockOutlined />}
                                        loading={savingPw}
                                        danger
                                    >
                                        Change Password
                                    </Button>
                                </Form>
                            </Card>
                        ),
                    },
                ]}
            />
        </DoctorLayout>
    );
}
