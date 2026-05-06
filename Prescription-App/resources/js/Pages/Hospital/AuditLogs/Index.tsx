import HospitalLayout from '@/Layouts/HospitalLayout';
import { Head, router } from '@inertiajs/react';
import { Card, Pagination, Select, Table, Tag, Typography } from 'antd';
import { PageProps } from '@/types';

type LogRow = {
    id: number;
    action: string;
    subject_type: string;
    subject_id: number | null;
    meta: Record<string, unknown> | null;
    ip_address: string | null;
    created_at: string | null;
    user: { id: number; name: string; role: string } | null;
};

type Props = PageProps<{
    logs: {
        data: LogRow[];
        meta: { current_page: number; per_page: number; total: number };
    };
    filters: { action: string | null; user_id: string | null };
    actions: string[];
}>;

export default function HospitalAuditLogs({ logs, filters, actions }: Props) {
    function applyFilter(key: string, value: string | undefined) {
        router.get('/hospital/audit-logs', { ...filters, [key]: value }, { preserveScroll: true, preserveState: true });
    }

    return (
        <HospitalLayout>
            <Head title="Audit Logs" />
            <Typography.Title level={4} className="!mb-4">
                Audit Logs
            </Typography.Title>

            <Card className="mb-4">
                <div className="flex flex-wrap gap-3">
                    <Select
                        placeholder="Filter by action"
                        allowClear
                        style={{ minWidth: 240 }}
                        value={filters.action ?? undefined}
                        onChange={(v) => applyFilter('action', v)}
                        options={actions.map((a) => ({ value: a, label: a }))}
                    />
                </div>
            </Card>

            <Table<LogRow>
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={logs.data}
                columns={[
                    { title: 'When', dataIndex: 'created_at', width: 170 },
                    {
                        title: 'User',
                        dataIndex: 'user',
                        render: (u: LogRow['user']) => (u ? `${u.name} (${u.role})` : '—'),
                    },
                    {
                        title: 'Action',
                        dataIndex: 'action',
                        render: (a: string) => <Tag color="blue">{a}</Tag>,
                    },
                    {
                        title: 'Subject',
                        render: (_, row) => `${row.subject_type}#${row.subject_id ?? '—'}`,
                    },
                    {
                        title: 'Meta',
                        dataIndex: 'meta',
                        render: (m: LogRow['meta']) => (m ? <code className="text-xs">{JSON.stringify(m)}</code> : '—'),
                    },
                    { title: 'IP', dataIndex: 'ip_address', width: 130 },
                ]}
            />

            <div className="mt-4">
                <Pagination
                    current={logs.meta.current_page}
                    pageSize={logs.meta.per_page}
                    total={logs.meta.total}
                    showSizeChanger={false}
                    onChange={(page) =>
                        router.get('/hospital/audit-logs', { ...filters, page }, { preserveScroll: true, preserveState: true })
                    }
                />
            </div>
        </HospitalLayout>
    );
}
