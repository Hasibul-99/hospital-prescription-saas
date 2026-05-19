import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/Pagination';
import { Head, router } from '@inertiajs/react';
import { Card, Select, Table, Tag, Typography } from 'antd';
import { PageProps } from '@/types';

type LogRow = {
    id: number;
    action: string;
    subject_type: string;
    subject_id: number | null;
    hospital_id: number | null;
    meta: Record<string, unknown> | null;
    ip_address: string | null;
    created_at: string | null;
    user: { id: number; name: string; role: string } | null;
};

type Props = PageProps<{
    logs: {
        data: LogRow[];
        meta: { current_page: number; last_page: number; per_page: number; total: number };
    };
    filters: { action: string | null; hospital_id: string | null };
    actions: string[];
}>;

export default function AdminAuditLogs({ logs, filters, actions }: Props) {
    function applyFilter(key: string, value: string | undefined) {
        router.get('/admin/audit-logs', { ...filters, [key]: value }, { preserveScroll: true, preserveState: true });
    }

    return (
        <AdminLayout>
            <Head title="Audit Logs" />
            <Typography.Title level={4} className="!mb-4">
                Platform Audit Logs
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
                    { title: 'Hospital', dataIndex: 'hospital_id', width: 90 },
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
                    meta={logs.meta}
                    onChange={(page) =>
                        router.get('/admin/audit-logs', { ...filters, page }, { preserveScroll: true, preserveState: true })
                    }
                />
            </div>
        </AdminLayout>
    );
}
