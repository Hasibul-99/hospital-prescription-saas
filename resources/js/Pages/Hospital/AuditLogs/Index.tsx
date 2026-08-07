import HospitalLayout from '@/Layouts/HospitalLayout';
import Pagination from '@/Components/UI/Pagination';
import { Head, router } from '@inertiajs/react';
import { Button, Card, DatePicker, Empty, Input, Select, Table, Typography } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
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
} from '@/Components/AuditLog/AuditLogUi';

type Filters = {
    search: string | null;
    action: string | null;
    user_id: string | null;
    date_from: string | null;
    date_to: string | null;
};

type Props = PageProps<{
    logs: {
        data: AuditLogRow[];
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
}>;

export default function HospitalAuditLogs({ logs, filters, stats, actions, users }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    function apply(next: Partial<Filters> & { page?: number }) {
        router.get(
            '/hospital/audit-logs',
            { ...filters, ...next, page: next.page ?? undefined },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    }

    function reset() {
        setSearch('');
        router.get('/hospital/audit-logs', {}, { preserveScroll: true });
    }

    const hasFilters = Object.entries(filters).some(([, v]) => v);

    const columns: ColumnsType<AuditLogRow> = [
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
            render: (user: AuditLogRow['user']) => <UserCell user={user} />,
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
            title: 'Details',
            dataIndex: 'meta',
            render: (meta: AuditLogRow['meta']) => <MetaChips meta={meta} />,
        },
        {
            title: 'IP',
            dataIndex: 'ip_address',
            width: 120,
            render: (ip: string | null) => <IpCell ip={ip} />,
        },
    ];

    return (
        <HospitalLayout>
            <Head title="Audit Logs" />

            <div className="mb-4">
                <Typography.Title level={4} className="!mb-0">
                    Audit Logs
                </Typography.Title>
                <Typography.Text type="secondary" className="text-xs">
                    Everything your staff has done in this hospital, newest first.
                </Typography.Text>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile
                    label={hasFilters ? 'Matching events' : 'Total events'}
                    value={stats.matching.toLocaleString()}
                    hint={hasFilters ? `of ${stats.total.toLocaleString()} total` : 'all time'}
                />
                <StatTile label="Today" value={stats.today.toLocaleString()} hint="in this hospital" />
                <StatTile label="Active staff" value={stats.actors.toLocaleString()} hint="in the current view" />
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
                        placeholder="Search staff, IP, subject…"
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
                        placeholder="Staff member"
                        style={{ minWidth: 200 }}
                        value={filters.user_id ?? undefined}
                        onChange={(v) => apply({ user_id: v ?? null })}
                        options={users.map((u) => ({ value: String(u.id), label: `${u.name} · ${titleCase(u.role)}` }))}
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

            <Table<AuditLogRow>
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={logs.data}
                columns={columns}
                scroll={{ x: 960 }}
                locale={{
                    emptyText: (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={hasFilters ? 'No events match these filters.' : 'No activity recorded yet.'}
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
        </HospitalLayout>
    );
}
