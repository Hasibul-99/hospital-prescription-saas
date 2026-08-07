import RoleLayout from '@/Layouts/RoleLayout';
import FlashMessage from '@/Components/Common/FlashMessage';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import { Card, Col, Descriptions, Row, Tag, Typography } from 'antd';
import { CheckCircleFilled, ExclamationCircleFilled } from '@ant-design/icons';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

type Profile = {
    name: string;
    email: string;
    phone?: string | null;
    preferred_language: 'en' | 'bn';
    role: string;
    hospital?: string | null;
    email_verified_at?: string | null;
    last_login_at?: string | null;
    created_at?: string | null;
};

const ROLE_TAG: Record<string, { color: string; label: string }> = {
    super_admin: { color: 'purple', label: 'Super Admin' },
    hospital_admin: { color: 'geekblue', label: 'Hospital Admin' },
    doctor: { color: 'green', label: 'Doctor' },
    receptionist: { color: 'orange', label: 'Receptionist' },
};

function formatDate(iso?: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(iso?: string | null): string {
    if (!iso) return 'Never';
    return new Date(iso).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/** Identity summary — everything here is read-only; role and hospital are set by an admin. */
function IdentityCard({ profile }: { profile: Profile }) {
    const role = ROLE_TAG[profile.role] ?? { color: 'default', label: profile.role };
    const verified = !!profile.email_verified_at;

    return (
        <Card>
            <div className="flex flex-col items-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-teal-800 text-2xl font-semibold text-white shadow-sm">
                    {profile.name.charAt(0).toUpperCase()}
                </div>

                <Typography.Title level={5} className="!mb-1 !mt-4">
                    {profile.name}
                </Typography.Title>

                <Typography.Text type="secondary" className="text-xs">
                    {profile.email}
                </Typography.Text>

                <div className="mt-3 flex flex-wrap justify-center gap-1">
                    <Tag color={role.color} className="!mr-0">
                        {role.label}
                    </Tag>
                    {verified ? (
                        <Tag color="green" icon={<CheckCircleFilled />} className="!mr-0">
                            Verified
                        </Tag>
                    ) : (
                        <Tag color="warning" icon={<ExclamationCircleFilled />} className="!mr-0">
                            Unverified
                        </Tag>
                    )}
                </div>
            </div>

            <Descriptions column={1} size="small" className="mt-5" colon={false}>
                <Descriptions.Item label="Hospital">
                    {profile.hospital ?? <Typography.Text type="secondary">Platform-wide</Typography.Text>}
                </Descriptions.Item>
                <Descriptions.Item label="Phone">{profile.phone || '—'}</Descriptions.Item>
                <Descriptions.Item label="Member since">{formatDate(profile.created_at)}</Descriptions.Item>
                <Descriptions.Item label="Last sign-in">{formatDateTime(profile.last_login_at)}</Descriptions.Item>
            </Descriptions>

            <Typography.Text type="secondary" className="mt-2 block text-xs">
                Your role and hospital are managed by an administrator.
            </Typography.Text>
        </Card>
    );
}

export default function Edit({
    profile,
    languages,
    mustVerifyEmail,
    status,
}: PageProps<{
    profile: Profile;
    languages: { value: string; label: string }[];
    mustVerifyEmail: boolean;
    status?: string;
}>) {
    return (
        <RoleLayout>
            <Head title="Profile" />
            <FlashMessage />

            <div className="mb-5">
                <Typography.Title level={4} className="!mb-0">
                    Your profile
                </Typography.Title>
                <Typography.Text type="secondary" className="text-xs">
                    Account details, password, and sign-in preferences.
                </Typography.Text>
            </div>

            {/* Identity stays visible beside the forms rather than stacking three
                identical slabs down the page. */}
            <Row gutter={[16, 16]} className="max-w-6xl">
                <Col xs={24} lg={8}>
                    <div className="lg:sticky lg:top-20">
                        <IdentityCard profile={profile} />
                    </div>
                </Col>

                <Col xs={24} lg={16}>
                    <div className="flex flex-col gap-4">
                        <UpdateProfileInformationForm
                            profile={profile}
                            languages={languages}
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                        />
                        <UpdatePasswordForm />
                        <DeleteUserForm />
                    </div>
                </Col>
            </Row>
        </RoleLayout>
    );
}
