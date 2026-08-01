import HospitalLayout from '@/Layouts/HospitalLayout';
import FlashMessage from '@/Components/FlashMessage';
import Pagination from '@/Components/Pagination';
import { Head, Link, router } from '@inertiajs/react';
import { PageProps, PaginatedData } from '@/types';
import { Button, Input, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { ReactNode, useState } from 'react';

const { Title } = Typography;

type Receptionist = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    is_active: boolean;
    created_at: string;
};

type Props = PageProps<{
    receptionists: PaginatedData<Receptionist>;
    filters: { search?: string };
}>;

export default function Index({ receptionists, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    function doSearch(value: string) {
        router.get('/hospital/receptionists', { search: value }, { preserveState: true, replace: true });
    }

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (name: string, r: Receptionist) => (
                <Space>
                    {name}
                    {!r.is_active && <Tag color="red">Inactive</Tag>}
                </Space>
            ),
        },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        { title: 'Phone', dataIndex: 'phone', key: 'phone', render: (v: string | null) => v ?? '—' },
        {
            title: 'Joined',
            dataIndex: 'created_at',
            key: 'joined',
            render: (v: string) => new Date(v).toLocaleDateString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: unknown, r: Receptionist) => (
                <Space>
                    <Link href={`/hospital/receptionists/${r.id}/edit`}>
                        <Button size="small" icon={<EditOutlined />} />
                    </Link>
                    <Popconfirm
                        title="Remove this receptionist?"
                        onConfirm={() => router.delete(`/hospital/receptionists/${r.id}`)}
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
            <Head title="Receptionists" />
            <FlashMessage />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>Receptionists</Title>
                <Link href="/hospital/receptionists/create">
                    <Button type="primary" icon={<PlusOutlined />}>Add Receptionist</Button>
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
                dataSource={receptionists.data}
                columns={columns}
                rowKey="id"
                pagination={false}
                size="small"
            />

            <div style={{ marginTop: 16 }}>
                <Pagination
                    meta={receptionists.meta}
                    onChange={(page) => router.get('/hospital/receptionists', { search: filters.search || undefined, page }, { preserveState: true })}
                />
            </div>
        </>
    );
}

Index.layout = (page: ReactNode) => <HospitalLayout>{page}</HospitalLayout>;
