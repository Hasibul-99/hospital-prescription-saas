import AdminLayout from '@/Layouts/AdminLayout';
import FlashMessage from '@/Components/Common/FlashMessage';
import Pagination from '@/Components/UI/Pagination';
import { Head, Link, router } from '@inertiajs/react';
import { CurrencyConfig, PageProps, PaginatedData, Plan } from '@/types';
import {
    Alert,
    Button,
    Input,
    Popconfirm,
    Select,
    Space,
    Table,
    Tag,
    Tooltip,
    Typography,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import {
    DeleteOutlined,
    EditOutlined,
    EyeInvisibleOutlined,
    EyeOutlined,
    PlusOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { formatMoney } from '@/utils/currency';

type Filters = {
    search?: string;
    status?: 'active' | 'inactive' | '';
    sort?: string;
    direction?: 'asc' | 'desc';
};

type Props = PageProps<{
    plans: PaginatedData<Plan>;
    filters: Filters;
    /** Platform base currency — plan prices are always in this, not a hospital's. */
    currency: CurrencyConfig;
}>;

/** A NULL limit means unlimited, so it must never render as "0". */
function limit(value: number | null): React.ReactNode {
    return value === null ? <Tag color="blue">Unlimited</Tag> : value.toLocaleString();
}

export default function AdminPlansIndex({ plans, filters, currency }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    function apply(next: Filters & { page?: number }) {
        router.get('/admin/plans', { ...filters, ...next }, { preserveState: true, preserveScroll: true });
    }

    const columns: ColumnsType<Plan> = [
        {
            title: '#',
            dataIndex: 'sort_order',
            width: 60,
            align: 'center',
            sorter: true,
            showSorterTooltip: false,
        },
        {
            title: 'Plan',
            dataIndex: 'name',
            sorter: true,
            showSorterTooltip: false,
            render: (_, r) => (
                <Space direction="vertical" size={0}>
                    <Space size={6}>
                        <span className="font-medium">{r.name}</span>
                        {r.is_featured && <Tag color="gold">Most popular</Tag>}
                    </Space>
                    <Typography.Text type="secondary" className="text-xs">
                        <code>{r.code}</code>
                        {r.name_bn ? ` · ${r.name_bn}` : ''}
                    </Typography.Text>
                </Space>
            ),
        },
        {
            title: 'Monthly',
            dataIndex: 'price_monthly',
            align: 'right',
            width: 130,
            sorter: true,
            showSorterTooltip: false,
            render: (v) => formatMoney(v, currency),
        },
        {
            title: 'Yearly',
            dataIndex: 'price_yearly',
            align: 'right',
            width: 130,
            render: (v) => (v == null ? <Typography.Text type="secondary">—</Typography.Text> : formatMoney(v, currency)),
        },
        { title: 'Doctors', dataIndex: 'max_doctors', width: 110, align: 'right', render: limit },
        { title: 'Patients / mo', dataIndex: 'max_patients_per_month', width: 130, align: 'right', render: limit },
        {
            title: 'Rx cap',
            dataIndex: 'max_prescriptions',
            width: 110,
            align: 'right',
            render: limit,
        },
        {
            title: 'Hospitals',
            dataIndex: 'hospitals_count',
            width: 100,
            align: 'right',
            render: (v: number) => v ?? 0,
        },
        {
            title: 'Status',
            width: 190,
            render: (_, r) => (
                <Space size={4} wrap>
                    {r.is_active ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>}
                    {r.is_public ? <Tag color="geekblue">Public</Tag> : <Tag>Hidden</Tag>}
                </Space>
            ),
        },
        {
            title: 'Actions',
            width: 260,
            render: (_, r) => (
                <Space size={4}>
                    <Link href={`/admin/plans/${r.id}/edit`}>
                        <Button size="small" icon={<EditOutlined />}>
                            Edit
                        </Button>
                    </Link>

                    <Tooltip title={r.is_public ? 'Hide from the public pricing page' : 'Show on the public pricing page'}>
                        <Button
                            size="small"
                            icon={r.is_public ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                            onClick={() => router.post(`/admin/plans/${r.id}/toggle-public`, {}, { preserveScroll: true })}
                        >
                            {r.is_public ? 'Hide' : 'Show'}
                        </Button>
                    </Tooltip>

                    <Tooltip
                        title={
                            r.is_active
                                ? 'Stop offering this plan to new hospitals (existing ones keep it)'
                                : 'Allow this plan to be assigned again'
                        }
                    >
                        <Button
                            size="small"
                            onClick={() => router.post(`/admin/plans/${r.id}/toggle-status`, {}, { preserveScroll: true })}
                        >
                            {r.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                    </Tooltip>

                    <Popconfirm
                        title="Delete this plan?"
                        description="Only possible when no hospital is on it."
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => router.delete(`/admin/plans/${r.id}`, { preserveScroll: true })}
                    >
                        <Button size="small" danger icon={<DeleteOutlined />} disabled={(r.hospitals_count ?? 0) > 0} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    function handleTableChange(
        _pg: TablePaginationConfig,
        _f: Record<string, FilterValue | null>,
        sorter: SorterResult<Plan> | SorterResult<Plan>[],
    ) {
        const s = Array.isArray(sorter) ? sorter[0] : sorter;
        if (s.field && s.order) {
            apply({ sort: String(s.field), direction: s.order === 'ascend' ? 'asc' : 'desc' });
        }
    }

    return (
        <AdminLayout>
            <Head title="Subscription Plans" />
            <FlashMessage />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <Typography.Title level={4} className="!mb-0">
                    Subscription Plans
                </Typography.Title>
                <Link href="/admin/plans/create">
                    <Button type="primary" icon={<PlusOutlined />}>
                        Add Plan
                    </Button>
                </Link>
            </div>

            <Alert
                type="info"
                showIcon
                className="mb-4"
                title={`Prices are in the platform currency (${currency.code}). Public plans appear on the landing page pricing section, ordered by #.`}
                action={
                    <Link href="/admin/settings">
                        <Button size="small">Change currency</Button>
                    </Link>
                }
            />

            <div className="mb-3 flex flex-wrap gap-2">
                <Input
                    allowClear
                    prefix={<SearchOutlined />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onPressEnter={() => apply({ search })}
                    onBlur={() => apply({ search })}
                    placeholder="Search name or code..."
                    style={{ width: 260 }}
                />
                <Select
                    allowClear
                    placeholder="Status"
                    value={filters.status || undefined}
                    onChange={(v) => apply({ status: v ?? '' })}
                    style={{ width: 150 }}
                    options={[
                        { label: 'Active', value: 'active' },
                        { label: 'Inactive', value: 'inactive' },
                    ]}
                />
            </div>

            <Table<Plan>
                rowKey="id"
                columns={columns}
                dataSource={plans.data}
                pagination={false}
                size="small"
                scroll={{ x: 1200 }}
                onChange={handleTableChange}
            />

            <div className="mt-4 flex justify-center">
                <Pagination meta={plans.meta} onChange={(p) => apply({ page: p })} />
            </div>
        </AdminLayout>
    );
}
