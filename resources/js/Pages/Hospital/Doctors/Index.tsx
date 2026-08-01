import HospitalLayout from '@/Layouts/HospitalLayout';
import FlashMessage from '@/Components/FlashMessage';
import Pagination from '@/Components/Pagination';
import { Head, Link, router } from '@inertiajs/react';
import { PageProps, PaginatedData } from '@/types';
import { Button, Input, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons';
import { ReactNode, useState } from 'react';

const { Title } = Typography;

type Doctor = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    is_active: boolean;
    created_at: string;
    doctor_profile: {
        specialization: string | null;
        designation: string | null;
        bmdc_number: string | null;
    } | null;
};

type Props = PageProps<{
    doctors: PaginatedData<Doctor>;
    filters: { search?: string };
}>;

export default function Index({ doctors, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    function doSearch(value: string) {
        router.get('/hospital/doctors', { search: value }, { preserveState: true, replace: true });
    }

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (name: string, r: Doctor) => (
                <Space>
                    <UserOutlined />
                    <span>{name}</span>
                    {!r.is_active && <Tag color="red">Inactive</Tag>}
                </Space>
            ),
        },
        { title: 'Email',  dataIndex: 'email', key: 'email' },
        { title: 'Phone',  dataIndex: 'phone', key: 'phone', render: (v: string | null) => v ?? '—' },
        {
            title: 'Specialization',
            key: 'spec',
            render: (_: unknown, r: Doctor) => r.doctor_profile?.specialization ?? '—',
        },
        {
            title: 'BMDC',
            key: 'bmdc',
            render: (_: unknown, r: Doctor) => r.doctor_profile?.bmdc_number ?? '—',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: unknown, r: Doctor) => (
                <Space>
                    <Link href={`/hospital/doctors/${r.id}/edit`}>
                        <Button size="small" icon={<EditOutlined />} />
                    </Link>
                    <Popconfirm
                        title="Remove this doctor?"
                        onConfirm={() => router.delete(`/hospital/doctors/${r.id}`)}
                        okText="Remove"
                        okButtonProps={{ danger: true }}
                    >
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <>
            <Head title="Doctors" />
            <FlashMessage />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>Doctors</Title>
                <Link href="/hospital/doctors/create">
                    <Button type="primary" icon={<PlusOutlined />}>Add Doctor</Button>
                </Link>
            </div>

            <div style={{ marginBottom: 16, maxWidth: 320 }}>
                <Input.Search
                    placeholder="Search by name, email or phone"
                    defaultValue={search}
                    onSearch={doSearch}
                    allowClear
                />
            </div>

            <Table
                dataSource={doctors.data}
                columns={columns}
                rowKey="id"
                pagination={false}
                size="small"
            />

            <div style={{ marginTop: 16 }}>
                <Pagination
                    meta={doctors.meta}
                    onChange={(page) => router.get('/hospital/doctors', { search: filters.search || undefined, page }, { preserveState: true })}
                />
            </div>
        </>
    );
}

Index.layout = (page: ReactNode) => <HospitalLayout>{page}</HospitalLayout>;
