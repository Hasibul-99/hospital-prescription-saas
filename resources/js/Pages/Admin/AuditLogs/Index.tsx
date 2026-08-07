import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/Pagination';
import { Head, router } from '@inertiajs/react';
import {
    Button,
    Card,
    DatePicker,
    Empty,
    Input,
    Select,
    Space,
    Table,
    Tag,
    Tooltip,
    Typography,
} from 'antd';
import { DownloadOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageProps } from '@/types';
import { useState } from 'react';

type LogRow = {
    id: number;
    action: string;
    subject_type: string;
    subject_id: number | null;
    meta: Record<string, unknown> | null;
    ip_address: string | null;
    created_at: string | null;
    user: { id: number; name: string; role: string } | null;
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

// ─── Action vocabulary ────────────────────────────────────────────────
// Audit actions are `resource.verb` keys. Colour comes from the verb (what
// happened), the icon from the resource (what it happened to).

const VERB_STYLE: Record<string, { color: string; label: string }> = {
    create: { color: 'green', label: 'Created' },
    update: { color: 'gold', label: 'Updated' },
    delete: { color: 'red', label: 'Deleted' },
    login: { color: 'blue', label: 'Signed in' },
    logout: { color: 'default', label: 'Signed out' },
    approve: { color: 'cyan', label: 'Approved' },
    reject: { color: 'volcano', label: 'Rejected' },
    restore: { color: 'lime', label: 'Restored' },
};

const RESOURCE_ICON: Record<string, string> = {
    prescription: '℞',
    patient: '🧑',
    appointment: '📅',
    auth: '🔑',
    hospital: '🏥',
    user: '👤',
    medicine: '💊',
    plan: '💳',
    template: '📋',
};

function splitAction(action: string): { resource: string; verb: string } {
    const [resource, verb = ''] = action.split('.');
    return { resource, verb };
}

function titleCase(value: string): string {
    return value.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** "prescription.create" → "Prescription created". */
function humanAction(action: string): string {
    const { resource, verb } = splitAction(action);
    const label = VERB_STYLE[verb]?.label ?? titleCase(verb);
    return `${titleCase(resource)} ${label.toLowerCase()}`;
}

function ActionTag({ action }: { action: string }) {
    const { resource, verb } = splitAction(action);
    const style = VERB_STYLE[verb];

    return (
        <Tooltip title={action}>
            <Tag color={style?.color ?? 'default'} className="!mr-0">
                <span className="mr-1">{RESOURCE_ICON[resource] ?? '•'}</span>
                {humanAction(action)}
            </Tag>
        </Tooltip>
    );
}

const ROLE_COLOR: Record<string, string> = {
    super_admin: 'purple',
    hospital_admin: 'geekblue',
    doctor: 'green',
    receptionist: 'orange',
};

// ─── Time ─────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
    const then = new Date(iso).getTime();
    const seconds = Math.round((Date.now() - then) / 1000);

    if (seconds < 60) return 'just now';

    const units: [number, Intl.RelativeTimeFormatUnit][] = [
        [60, 'minute'],
        [3600, 'hour'],
        [86400, 'day'],
        [604800, 'week'],
        [2592000, 'month'],
        [31536000, 'year'],
    ];

    let chosen: [number, Intl.RelativeTimeFormatUnit] = units[0];
    for (const unit of units) {
        if (seconds >= unit[0]) chosen = unit;
    }

    const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    return formatter.format(-Math.floor(seconds / chosen[0]), chosen[1]);
}

function exactTime(iso: string): string {
    return new Date(iso).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

// ─── Meta ─────────────────────────────────────────────────────────────

function formatMetaValue(value: unknown): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
}

/**
 * Meta is free-form per action (`{medicines: 2, complaints: 3}`). Rendered as
 * compact chips instead of a raw JSON dump, which used to blow out the row.
 */
function MetaChips({ meta }: { meta: LogRow['meta'] }) {
    const entries = Object.entries(meta ?? {});

    if (entries.length === 0) {
        return <span className="text-gray-300">—</span>;
    }

    const shown = entries.slice(0, 3);
    const hidden = entries.length - shown.length;

    return (
        <Space size={4} wrap>
            {shown.map(([key, value]) => (
                <span
                    key={key}
                    className="inline-flex items-center gap-1 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-xs"
                >
                    <span className="text-gray-500">{titleCase(key)}</span>
                    <span className="font-medium text-gray-800">{formatMetaValue(value)}</span>
                </span>
            ))}
            {hidden > 0 && <span className="text-xs text-gray-400">+{hidden} more</span>}
        </Space>
    );
}

function StatTile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-1 truncate text-2xl font-bold tabular-nums text-gray-900">{value}</p>
            {hint && <p className="mt-0.5 truncate text-xs text-gray-400">{hint}</p>}
        </div>
    );
}

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

    // Grouped so the picker reads "Prescription › Prescription created" rather
    // than a flat list of dotted keys.
    const actionOptions = Object.entries(
        actions.reduce<Record<string, typeof actions>>((groups, option) => {
            (groups[option.group] ??= []).push(option);
            return groups;
        }, {}),
    ).map(([group, options]) => ({
        label: titleCase(group),
        options: options.map((o) => ({
            value: o.value,
            label: `${humanAction(o.value)} (${o.count})`,
        })),
    }));

    const columns: ColumnsType<LogRow> = [
        {
            title: 'When',
            dataIndex: 'created_at',
            width: 150,
            render: (iso: string | null) =>
                iso ? (
                    <Tooltip title={exactTime(iso)}>
                        <span className="whitespace-nowrap text-gray-700">{relativeTime(iso)}</span>
                    </Tooltip>
                ) : (
                    '—'
                ),
        },
        {
            title: 'Who',
            dataIndex: 'user',
            width: 210,
            render: (user: LogRow['user']) =>
                user ? (
                    <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                            {user.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                            <div className="truncate text-sm text-gray-900">{user.name}</div>
                            <Tag color={ROLE_COLOR[user.role] ?? 'default'} className="!mr-0 !text-[10px]">
                                {titleCase(user.role)}
                            </Tag>
                        </div>
                    </div>
                ) : (
                    // A null user means the event was not attributable to a
                    // signed-in account — a job, a console command, or a
                    // deleted user whose FK was nulled.
                    <span className="text-gray-400">System</span>
                ),
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
            render: (_, row) => (
                <span className="whitespace-nowrap text-sm text-gray-700">
                    {row.subject_type}
                    {row.subject_id !== null && <span className="text-gray-400"> #{row.subject_id}</span>}
                </span>
            ),
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
            render: (ip: string | null) =>
                ip ? <code className="text-xs text-gray-500">{ip}</code> : <span className="text-gray-300">—</span>,
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
                        options={actionOptions}
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
                    expandedRowRender: (row) => (
                        <div className="grid gap-4 px-2 py-1 md:grid-cols-2">
                            <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Details
                                </p>
                                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                    {Object.entries(row.meta ?? {}).map(([key, value]) => (
                                        <div key={key} className="contents">
                                            <dt className="text-gray-500">{titleCase(key)}</dt>
                                            <dd className="font-medium text-gray-900">{formatMetaValue(value)}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                            <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Raw
                                </p>
                                <pre className="max-h-40 overflow-auto rounded bg-gray-900 p-3 text-xs text-gray-100">
                                    {JSON.stringify(
                                        {
                                            action: row.action,
                                            subject: `${row.subject_type}#${row.subject_id ?? ''}`,
                                            at: row.created_at,
                                            ip: row.ip_address,
                                            meta: row.meta,
                                        },
                                        null,
                                        2,
                                    )}
                                </pre>
                            </div>
                        </div>
                    ),
                }}
            />

            <div className="mt-4 flex justify-center">
                <Pagination meta={logs.meta} onChange={(page) => apply({ page })} />
            </div>
        </AdminLayout>
    );
}
