import AdminLayout from '@/Layouts/AdminLayout';
import FlashMessage from '@/Components/FlashMessage';
import { Head, router } from '@inertiajs/react';
import { PageProps, PaginatedData } from '@/types';
import { Button, Input, Pagination, Popconfirm, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckOutlined, CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';

interface RequestRow {
    id: number;
    brand_name: string;
    generic_name?: string | null;
    type: string;
    strength?: string | null;
    manufacturer?: string | null;
    created_at: string;
    submitted_by?: { id: number; name: string; email: string; hospital_id?: number | null } | null;
}

type Props = PageProps<{
    requests: PaginatedData<RequestRow>;
    filters: { q: string };
}>;

export default function MedicineRequestsIndex({ requests, filters }: Props) {
    const [q, setQ] = useState(filters.q ?? '');

    function search() {
        router.get('/admin/medicine-requests', { q }, { preserveState: true, preserveScroll: true });
    }

    function approve(id: number) {
        router.post(`/admin/medicine-requests/${id}/approve`, {}, { preserveScroll: true });
    }

    function reject(id: number) {
        router.delete(`/admin/medicine-requests/${id}`, { preserveScroll: true });
    }

    function goPage(p: number) {
        router.get('/admin/medicine-requests', { q, page: p }, { preserveState: true, preserveScroll: true });
    }

    const columns: ColumnsType<RequestRow> = [
        { title: 'Brand', dataIndex: 'brand_name' },
        { title: 'Generic', dataIndex: 'generic_name' },
        { title: 'Type', dataIndex: 'type', width: 110 },
        { title: 'Strength', dataIndex: 'strength', width: 140 },
        { title: 'Manufacturer', dataIndex: 'manufacturer' },
        {
            title: 'Submitted By',
            width: 220,
            render: (_, r) => (r.submitted_by ? `${r.submitted_by.name} (${r.submitted_by.email})` : '—'),
        },
        {
            title: 'When',
            dataIndex: 'created_at',
            width: 170,
            render: (v: string) => new Date(v).toLocaleString(),
        },
        {
            title: 'Actions',
            width: 200,
            render: (_, r) => (
                <Space>
                    <Popconfirm title="Approve this medicine?" okText="Approve" onConfirm={() => approve(r.id)}>
                        <Button type="primary" size="small" icon={<CheckOutlined />}>
                            Approve
                        </Button>
                    </Popconfirm>
                    <Popconfirm
                        title="Reject and delete?"
                        okText="Reject"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => reject(r.id)}
                    >
                        <Button danger size="small" icon={<CloseOutlined />}>
                            Reject
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <AdminLayout>
            <Head title="Medicine Requests" />
            <FlashMessage />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <Typography.Title level={4} className="!mb-0">
                    Pending Medicine Requests
                </Typography.Title>
                <Input
                    allowClear
                    prefix={<SearchOutlined />}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onPressEnter={search}
                    onBlur={search}
                    placeholder="Search brand/generic..."
                    style={{ width: 260 }}
                />
            </div>

            <Table<RequestRow>
                rowKey="id"
                size="small"
                columns={columns}
                dataSource={requests.data}
                pagination={false}
            />

            <div className="mt-4 flex justify-center">
                <Pagination
                    current={requests.meta.current_page}
                    total={requests.meta.total}
                    pageSize={requests.meta.per_page}
                    onChange={goPage}
                    showSizeChanger={false}
                />
            </div>
        </AdminLayout>
    );
}
