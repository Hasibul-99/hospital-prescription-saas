import AdminLayout from '@/Layouts/AdminLayout';
import FlashMessage from '@/Components/FlashMessage';
import { Head, Link, router } from '@inertiajs/react';
import { PageProps, PaginatedData } from '@/types';
import { Button, Input, Pagination, Popconfirm, Select, Space, Table, Tag, Typography, Upload, App as AntApp } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd';
import { EditOutlined, PlusOutlined, SearchOutlined, StopOutlined, UploadOutlined } from '@ant-design/icons';
import { useState } from 'react';

interface ComplaintRow {
    id: number;
    name_en: string;
    name_bn?: string | null;
    category?: string | null;
    sort_order: number;
    is_active: boolean;
    duration_presets: Array<{ id: number; duration_text_en: string; duration_text_bn?: string | null }>;
}

type Props = PageProps<{
    complaints: PaginatedData<ComplaintRow>;
    filters: { q: string; category: string; status: string };
    categories: string[];
}>;

export default function ComplaintsIndex({ complaints, filters, categories }: Props) {
    const { message } = AntApp.useApp();
    const [q, setQ] = useState(filters.q ?? '');

    const uploadProps: UploadProps = {
        name: 'file',
        action: '/admin/complaints/bulk-import',
        headers: {
            'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '',
            'X-Requested-With': 'XMLHttpRequest',
        },
        accept: '.json',
        showUploadList: false,
        withCredentials: true,
        onChange(info) {
            if (info.file.status === 'done') {
                message.success('Complaints imported.');
                router.reload({ only: ['complaints'] });
            } else if (info.file.status === 'error') {
                message.error('Import failed.');
            }
        },
    };

    function apply(next: Partial<Props['filters']> & { page?: number }) {
        router.get('/admin/complaints', { ...filters, ...next }, { preserveState: true, preserveScroll: true });
    }

    function deactivate(id: number) {
        router.delete(`/admin/complaints/${id}`, { preserveScroll: true });
    }

    const columns: ColumnsType<ComplaintRow> = [
        { title: 'English', dataIndex: 'name_en' },
        { title: 'Bangla', dataIndex: 'name_bn', render: (v) => v || '—' },
        {
            title: 'Category',
            dataIndex: 'category',
            width: 140,
            render: (v) => (v ? <Tag>{v}</Tag> : '—'),
        },
        { title: 'Sort', dataIndex: 'sort_order', width: 70 },
        {
            title: 'Presets',
            dataIndex: 'duration_presets',
            render: (v: ComplaintRow['duration_presets']) => (v?.length ? v.length : 0),
            width: 80,
        },
        {
            title: 'Status',
            dataIndex: 'is_active',
            width: 100,
            render: (v: boolean) => (v ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>),
        },
        {
            title: 'Actions',
            width: 200,
            render: (_, r) => (
                <Space>
                    <Link href={`/admin/complaints/${r.id}/edit`}>
                        <Button size="small" icon={<EditOutlined />}>
                            Edit
                        </Button>
                    </Link>
                    {r.is_active && (
                        <Popconfirm
                            title="Deactivate this complaint?"
                            okText="Deactivate"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => deactivate(r.id)}
                        >
                            <Button danger size="small" icon={<StopOutlined />}>
                                Deactivate
                            </Button>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <AdminLayout>
            <Head title="Complaint Masters" />
            <FlashMessage />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <Typography.Title level={4} className="!mb-0">
                    Complaint Masters
                </Typography.Title>
                <Space>
                    <Upload {...uploadProps}>
                        <Button icon={<UploadOutlined />}>Bulk Import (JSON)</Button>
                    </Upload>
                    <Link href="/admin/complaints/create">
                        <Button type="primary" icon={<PlusOutlined />}>
                            Add Complaint
                        </Button>
                    </Link>
                </Space>
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
                <Input
                    allowClear
                    prefix={<SearchOutlined />}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onPressEnter={() => apply({ q })}
                    onBlur={() => apply({ q })}
                    placeholder="Search EN/BN..."
                    style={{ width: 260 }}
                />
                <Select
                    allowClear
                    placeholder="Category"
                    value={filters.category || undefined}
                    onChange={(v) => apply({ category: v ?? '' })}
                    style={{ width: 180 }}
                    options={categories.map((c) => ({ label: c, value: c }))}
                />
                <Select
                    value={filters.status || 'all'}
                    onChange={(v) => apply({ status: v })}
                    style={{ width: 130 }}
                    options={[
                        { label: 'All', value: 'all' },
                        { label: 'Active', value: 'active' },
                        { label: 'Inactive', value: 'inactive' },
                    ]}
                />
            </div>

            <Table<ComplaintRow>
                rowKey="id"
                size="small"
                columns={columns}
                dataSource={complaints.data}
                pagination={false}
            />

            <div className="mt-4 flex justify-center">
                <Pagination
                    current={complaints.meta.current_page}
                    total={complaints.meta.total}
                    pageSize={complaints.meta.per_page}
                    onChange={(p) => apply({ page: p })}
                    showSizeChanger={false}
                />
            </div>
        </AdminLayout>
    );
}
