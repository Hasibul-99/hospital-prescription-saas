import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/Pagination';
import { Head, router } from '@inertiajs/react';
import { Button, Card, DatePicker, Empty, Input, Select, Table, Tooltip, Typography } from 'antd';
import { DownloadOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageProps } from '@/types';
import { useState } from 'react';
import {
    ActionTag,
    AuditLogRow,
    IpCell,
    MetaChips,
    MetaExpansion,
    StatTile,
    SubjectCell,
    TimeCell,
    UserCell,
    groupActionOptions,
    humanAction,
    titleCase,
} from '@/Components/AuditLogUi';

type LogRow = AuditLogRow & {
    hospital: { id: number; name: string } | null;
};

type Filters = {
    search: string | null;
    action: string | null;
    user_id: string | null;
    hospital_id: string | null;
    date_from: string | null;
    date_to: string | null;
};

type Props = PageProps<{
    logs: {
        data: LogRow[];
        meta: { current_page: number; last_page: number; per_page: number; total: number };
    };
    filters: Filters;
    stats: {
        matching: number;
        total: number;
        today: number;
        actors: number;
        top_action: string | null;
        top_action_count: number;
    };
    actions: { value: string; group: string; count: number }[];
    users: { id: number; name: string; role: string }[];
    hospitals: { id: number; name: string }[];
}>;

export default function AdminAuditLogs({ logs, filters, stats, actions, users, hospitals }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    function apply(next: Partial<Filters> & { page?: number }) {
        router.get(
            '/admin/audit-logs',
            { ...filters, ...next, page: next.page ?? undefined },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    }

    function reset() {
        setSearch('');
        router.get('/admin/audit-logs', {}, { preserveScroll: true });
    }

    const hasFilters = Object.entries(filters).some(([, v]) => v);

    const columns: ColumnsType<LogRow> = [
        {
            title: 'When',
            dataIndex: 'created_at',
            width: 150,
            render: (iso: string | null) => <TimeCell iso={iso} />,
        },
        {
            title: 'Who',
            dataIndex: 'user',
            width: 210,
            render: (user: LogRow['user']) => <UserCell user={user} />,
        },
        {
            title: 'Action',
            dataIndex: 'action',
            width: 200,
            render: (action: string) => <ActionTag action={action} />,
        },
        {
            title: 'Subject',
            width: 160,
            render: (_, row) => <SubjectCell type={row.subject_type} id={row.subject_id} />,
        },
        {
            title: 'Hospital',
            dataIndex: 'hospital',
            width: 170,
            render: (hospital: LogRow['hospital']) =>
                hospital ? (
                    <span className="truncate text-sm text-gray-700">{hospital.name}</span>
                ) : (
                    <Tooltip title="Platform-level event, not tied to a tenant">
                        <span className="text-gray-400">Platform</span>
                    </Tooltip>
                ),
        },
        {
            title: 'Details',
            dataIndex: 'meta',
            render: (meta: LogRow['meta']) => <MetaChips meta={meta} />,
        },
        {
            title: 'IP',
            dataIndex: 'ip_address',
            width: 120,
            render: (ip: string | null) => <IpCell ip={ip} />,
        },
    ];

    return (
        <AdminLayout>
            <Head title="Audit Logs" />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <Typography.Title level={4} className="!mb-0">
                        Audit Logs
                    </Typography.Title>
                    <Typography.Text type="secondary" className="text-xs">
                        Every recorded action across all hospitals, newest first.
                    </Typography.Text>
                </div>
                <Button
                    icon={<DownloadOutlined />}
                    href={`/admin/audit-logs/export?${new URLSearchParams(
                        Object.entries(filters).filter(([, v]) => v) as [string, string][],
                    ).toString()}`}
                >
                    Export CSV
                </Button>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile
                    label={hasFilters ? 'Matching events' : 'Total events'}
                    value={stats.matching.toLocaleString()}
                    hint={hasFilters ? `of ${stats.total.toLocaleString()} total` : 'all time'}
                />
                <StatTile label="Today" value={stats.today.toLocaleString()} hint="across the platform" />
                <StatTile
                    label="Distinct users"
                    value={stats.actors.toLocaleString()}
                    hint="in the current view"
                />
                <StatTile
                    label="Most common"
                    value={stats.top_action ? humanAction(stats.top_action) : '—'}
                    hint={stats.top_action ? `${stats.top_action_count.toLocaleString()} events` : undefined}
                />
            </div>

            <Card className="mb-4" size="small">
                <div className="flex flex-wrap items-center gap-2">
                    <Input
                        allowClear
                        prefix={<SearchOutlined />}
                        placeholder="Search user, IP, subject…"
                        style={{ width: 240 }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onPressEnter={() => apply({ search })}
                        onBlur={() => search !== (filters.search ?? '') && apply({ search })}
                    />

                    <Select
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        placeholder="Action"
                        style={{ minWidth: 220 }}
                        value={filters.action ?? undefined}
                        onChange={(v) => apply({ action: v ?? null })}
                        options={groupActionOptions(actions)}
                    />

                    <Select
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        placeholder="User"
                        style={{ minWidth: 180 }}
                        value={filters.user_id ?? undefined}
                        onChange={(v) => apply({ user_id: v ?? null })}
                        options={users.map((u) => ({ value: String(u.id), label: `${u.name} · ${titleCase(u.role)}` }))}
                    />

                    <Select
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        placeholder="Hospital"
                        style={{ minWidth: 180 }}
                        value={filters.hospital_id ?? undefined}
                        onChange={(v) => apply({ hospital_id: v ?? null })}
                        options={hospitals.map((h) => ({ value: String(h.id), label: h.name }))}
                    />

                    <DatePicker.RangePicker
                        allowEmpty={[true, true]}
                        onChange={(_, [from, to]) => apply({ date_from: from || null, date_to: to || null })}
                    />

                    {hasFilters && (
                        <Button icon={<ReloadOutlined />} onClick={reset}>
                            Reset
                        </Button>
                    )}
                </div>
            </Card>

            <Table<LogRow>
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={logs.data}
                columns={columns}
                scroll={{ x: 1100 }}
                locale={{
                    emptyText: (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={hasFilters ? 'No events match these filters.' : 'No audit events recorded yet.'}
                        />
                    ),
                }}
                expandable={{
                    // Only rows that actually carry meta are expandable, so the
                    // caret is a reliable signal that there is more to see.
                    rowExpandable: (row) => Object.keys(row.meta ?? {}).length > 0,
                    expandedRowRender: (row) => <MetaExpansion row={row} />,
                }}
            />

            <div className="mt-4 flex justify-center">
                <Pagination meta={logs.meta} onChange={(page) => apply({ page })} />
            </div>
        </AdminLayout>
    );
}
