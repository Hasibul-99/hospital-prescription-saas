import AdminLayout from '@/Layouts/AdminLayout';
import FlashMessage from '@/Components/FlashMessage';
import { Head, Link, router } from '@inertiajs/react';
import { PageProps, PaginatedData } from '@/types';
import {
    Badge,
    Button,
    Input,
    Pagination,
    Popconfirm,
    Select,
    Space,
    Table,
    Tag,
    Typography,
    Upload,
    App as AntApp,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import type { UploadProps } from 'antd';
import {
    EditOutlined,
    PlusOutlined,
    SearchOutlined,
    StopOutlined,
    CheckCircleOutlined,
    UploadOutlined,
} from '@ant-design/icons';
import { useState } from 'react';

interface MedicineRow {
    id: number;
    brand_name: string;
    generic_name?: string;
    type: string;
    strength?: string;
    manufacturer?: string;
    price?: number;
    is_active: boolean;
}

type Props = PageProps<{
    medicines: PaginatedData<MedicineRow>;
    filters: {
        q: string;
        type: string;
        manufacturer: string;
        status: 'all' | 'active' | 'inactive' | '';
        sort: string;
        dir: 'asc' | 'desc';
    };
    types: string[];
    manufacturers: string[];
    pending_count: number;
}>;

export default function AdminMedicineIndex({ medicines, filters, types, manufacturers, pending_count }: Props) {
    const { message } = AntApp.useApp();
    const [q, setQ] = useState(filters.q ?? '');

    const uploadProps: UploadProps = {
        name: 'file',
        action: '/admin/medicines/bulk-import',
        headers: {
            'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '',
            'X-Requested-With': 'XMLHttpRequest',
        },
        accept: '.csv,.json',
        showUploadList: false,
        withCredentials: true,
        onChange(info) {
            if (info.file.status === 'done') {
                message.success(`Imported "${info.file.name}".`);
                router.reload({ only: ['medicines'] });
            } else if (info.file.status === 'error') {
                message.error('Import failed.');
            }
        },
    };

    function apply(next: Partial<Props['filters']> & { page?: number }) {
        router.get('/admin/medicines', { ...filters, ...next }, { preserveState: true, preserveScroll: true });
    }

    function deactivate(id: number) {
        router.delete(`/admin/medicines/${id}`, { preserveScroll: true });
    }

    function activate(id: number) {
        router.post(`/admin/medicines/${id}/activate`, {}, { preserveScroll: true });
    }

    const columns: ColumnsType<MedicineRow> = [
        { title: 'Brand', dataIndex: 'brand_name', sorter: true, showSorterTooltip: false },
        { title: 'Generic', dataIndex: 'generic_name', sorter: true, showSorterTooltip: false },
        { title: 'Type', dataIndex: 'type', width: 100, sorter: true, showSorterTooltip: false },
        { title: 'Strength', dataIndex: 'strength', width: 140 },
        { title: 'Manufacturer', dataIndex: 'manufacturer', sorter: true, showSorterTooltip: false },
        {
            title: 'Price',
            dataIndex: 'price',
            width: 90,
            align: 'right',
            sorter: true,
            showSorterTooltip: false,
            render: (v: number | null) => (v != null ? Number(v).toFixed(2) : '—'),
        },
        {
            title: 'Status',
            dataIndex: 'is_active',
            width: 100,
            render: (v: boolean) => (v ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>),
        },
        {
            title: 'Actions',
            width: 180,
            render: (_, r) => (
                <Space>
                    <Link href={`/admin/medicines/${r.id}/edit`}>
                        <Button size="small" icon={<EditOutlined />}>
                            Edit
                        </Button>
                    </Link>
                    {r.is_active ? (
                        <Popconfirm
                            title="Deactivate this medicine?"
                            okText="Deactivate"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => deactivate(r.id)}
                        >
                            <Button size="small" danger icon={<StopOutlined />}>
                                Deactivate
                            </Button>
                        </Popconfirm>
                    ) : (
                        <Button size="small" icon={<CheckCircleOutlined />} onClick={() => activate(r.id)}>
                            Activate
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    function handleTableChange(
        _pg: TablePaginationConfig,
        _f: Record<string, FilterValue | null>,
        sorter: SorterResult<MedicineRow> | SorterResult<MedicineRow>[],
    ) {
        const s = Array.isArray(sorter) ? sorter[0] : sorter;
        if (s.field && s.order) {
            apply({ sort: String(s.field), dir: s.order === 'ascend' ? 'asc' : 'desc' });
        }
    }

    return (
        <AdminLayout>
            <Head title="Medicines" />
            <FlashMessage />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <Typography.Title level={4} className="!mb-0">
                    Medicines
                </Typography.Title>
                <Space>
                    <Link href="/admin/medicine-requests">
                        <Badge count={pending_count} offset={[6, -2]}>
                            <Button>Pending Requests</Button>
                        </Badge>
                    </Link>
                    <Upload {...uploadProps}>
                        <Button icon={<UploadOutlined />}>Bulk Import (CSV/JSON)</Button>
                    </Upload>
                    <Link href="/admin/medicines/create">
                        <Button type="primary" icon={<PlusOutlined />}>
                            Add Medicine
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
                    placeholder="Search brand or generic..."
                    style={{ width: 260 }}
                />
                <Select
                    allowClear
                    placeholder="Type"
                    value={filters.type || undefined}
                    onChange={(v) => apply({ type: v ?? '' })}
                    style={{ width: 140 }}
                    options={types.map((t) => ({ label: t, value: t }))}
                />
                <Select
                    allowClear
                    showSearch
                    placeholder="Manufacturer"
                    value={filters.manufacturer || undefined}
                    onChange={(v) => apply({ manufacturer: v ?? '' })}
                    style={{ width: 240 }}
                    options={manufacturers.map((m) => ({ label: m, value: m }))}
                />
                <Select
                    value={filters.status || 'active'}
                    onChange={(v) => apply({ status: v })}
                    style={{ width: 130 }}
                    options={[
                        { label: 'Active', value: 'active' },
                        { label: 'Inactive', value: 'inactive' },
                        { label: 'All', value: 'all' },
                    ]}
                />
            </div>

            <Table<MedicineRow>
                rowKey="id"
                columns={columns}
                dataSource={medicines.data}
                pagination={false}
                size="small"
                onChange={handleTableChange}
            />

            <div className="mt-4 flex justify-center">
                <Pagination
                    current={medicines.meta.current_page}
                    total={medicines.meta.total}
                    pageSize={medicines.meta.per_page}
                    onChange={(p) => apply({ page: p })}
                    showSizeChanger={false}
                />
            </div>
        </AdminLayout>
    );
}
