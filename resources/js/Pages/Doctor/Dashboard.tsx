import { Head, Link, router } from '@inertiajs/react';
import DoctorLayout from '@/Layouts/DoctorLayout';
import { PageProps } from '@/types';
import { Button, Card, Empty, List, Segmented, Statistic, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    ArrowDownOutlined,
    ArrowUpOutlined,
    BellOutlined,
    FileTextOutlined,
    PlusOutlined,
    TeamOutlined,
    UnorderedListOutlined,
    UserAddOutlined,
} from '@ant-design/icons';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import dayjs from 'dayjs';

interface RecentPrescription {
    id: number;
    prescription_uid: string;
    patient_name: string;
    patient_uid: string;
    medicine_summary: string;
    freq_summary: string;
    status: string;
    date: string;
}

interface QueueItem {
    id: number;
    serial_number: number;
    patient_name: string;
    patient_uid: string | null;
    reason: string;
    status: string;
}

interface Props extends PageProps {
    stats: {
        active_prescriptions: number;
        patients_today: number;
        pending_drafts: number;
        total_patients: number;
        period_prescriptions: number;
        previous_period_prescriptions: number;
    };
    recent_prescriptions: RecentPrescription[];
    todays_queue: QueueItem[];
    volume: { date: string; label: string; count: number }[];
    days: number;
    today_label: string;
}

const RX_STATUS_COLOR: Record<string, string> = {
    draft: 'gold',
    finalized: 'green',
    signed: 'green',
    printed: 'blue',
};

const QUEUE_STATUS_COLOR: Record<string, string> = {
    waiting: 'default',
    in_progress: 'processing',
    completed: 'green',
    absent: 'orange',
    cancelled: 'red',
};

function titleCase(value: string): string {
    return value.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function initials(name: string): string {
    return name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

const QUICK_ACTIONS = [
    { href: '/doctor/prescriptions/create', icon: <PlusOutlined />, title: 'Write Rx', sub: 'New prescription' },
    { href: '/doctor/patients/create', icon: <UserAddOutlined />, title: 'Add patient', sub: 'Create record' },
    { href: '/doctor/queue', icon: <UnorderedListOutlined />, title: 'View queue', sub: "Today's patients" },
    { href: '/doctor/follow-ups', icon: <BellOutlined />, title: 'Follow-ups', sub: 'Scheduled recalls' },
];

export default function Dashboard({
    stats,
    recent_prescriptions,
    todays_queue,
    volume,
    days,
    today_label,
}: Props) {
    // Percentage change against the equally-sized preceding window. With no
    // history to compare against there is no honest number to show.
    const previous = stats.previous_period_prescriptions;
    const delta =
        previous > 0 ? Math.round(((stats.period_prescriptions - previous) / previous) * 100) : null;

    // A 90-day axis cannot carry 90 labels; thin them out instead of overlapping.
    const labelInterval = Math.max(0, Math.ceil(volume.length / 8) - 1);

    const columns: ColumnsType<RecentPrescription> = [
        {
            title: 'Rx ID',
            dataIndex: 'prescription_uid',
            width: 170,
            render: (uid: string, row) => (
                <Link href={`/doctor/prescriptions/${row.id}/preview`} className="font-mono text-xs">
                    {uid}
                </Link>
            ),
        },
        {
            title: 'Patient',
            dataIndex: 'patient_name',
            render: (name: string, row) => (
                <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-600">
                        {initials(name)}
                    </span>
                    <div className="min-w-0">
                        <div className="truncate text-sm text-gray-900">{name}</div>
                        <div className="truncate font-mono text-[10px] text-gray-400">{row.patient_uid}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Medication',
            dataIndex: 'medicine_summary',
            render: (summary: string, row) => (
                <div className="min-w-0">
                    <div className="truncate text-sm text-gray-800">{summary}</div>
                    {row.freq_summary && (
                        <div className="truncate font-mono text-[10px] text-gray-400">{row.freq_summary}</div>
                    )}
                </div>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            width: 110,
            render: (status: string) => (
                <Tag color={RX_STATUS_COLOR[status] ?? 'default'} className="!mr-0">
                    {titleCase(status)}
                </Tag>
            ),
        },
        {
            title: 'Date',
            dataIndex: 'date',
            width: 120,
            render: (date: string) => (
                <span className="whitespace-nowrap text-xs text-gray-500">{dayjs(date).format('DD MMM YYYY')}</span>
            ),
        },
    ];

    return (
        <DoctorLayout>
            <Head title="Dashboard" />

            <div className="mb-4">
                <Typography.Title level={4} className="!mb-0">
                    Dashboard
                </Typography.Title>
                <Typography.Text type="secondary" className="text-xs">
                    {today_label}
                </Typography.Text>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Card size="small">
                    <Statistic
                        title="Active prescriptions"
                        value={stats.active_prescriptions}
                        prefix={<FileTextOutlined className="text-gray-400" />}
                    />
                    <div className="mt-1 text-xs text-gray-400">excludes drafts</div>
                </Card>
                <Card size="small">
                    <Statistic
                        title="Patients today"
                        value={stats.patients_today}
                        prefix={<TeamOutlined className="text-gray-400" />}
                    />
                    <div className="mt-1 text-xs text-gray-400">appointments booked</div>
                </Card>
                <Card size="small">
                    <Statistic
                        title="Pending drafts"
                        value={stats.pending_drafts}
                        valueStyle={stats.pending_drafts > 0 ? { color: '#d48806' } : undefined}
                    />
                    <div className="mt-1 text-xs text-gray-400">awaiting sign-off</div>
                </Card>
                <Card size="small">
                    <Statistic
                        title={`Last ${days} days`}
                        value={stats.period_prescriptions}
                        suffix={
                            delta !== null && (
                                <span className={`text-sm ${delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {delta >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                    {Math.abs(delta)}%
                                </span>
                            )
                        }
                    />
                    <div className="mt-1 text-xs text-gray-400">
                        {delta !== null ? `vs ${previous} in the previous ${days} days` : 'no prior period to compare'}
                    </div>
                </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <Card
                    className="lg:col-span-2"
                    size="small"
                    title="Prescribing volume"
                    extra={
                        <Segmented
                            size="small"
                            value={days}
                            onChange={(v) => router.get('/doctor/dashboard', { days: v }, { preserveScroll: true })}
                            options={[
                                { label: '14d', value: 14 },
                                { label: '30d', value: 30 },
                                { label: '90d', value: 90 },
                            ]}
                        />
                    }
                >
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={volume} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                            <defs>
                                <linearGradient id="rxVolume" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#0f4c81" stopOpacity={0.25} />
                                    <stop offset="100%" stopColor="#0f4c81" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="#e5e7eb" />
                            <XAxis
                                dataKey="label"
                                interval={labelInterval}
                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                allowDecimals={false}
                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                labelFormatter={(_, payload) =>
                                    payload?.[0] ? dayjs(payload[0].payload.date).format('DD MMM YYYY') : ''
                                }
                                formatter={(value) => [Number(value ?? 0), 'Prescriptions']}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#0f4c81"
                                strokeWidth={2}
                                fill="url(#rxVolume)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>

                <Card size="small" title="Quick actions">
                    <div className="flex flex-col gap-2">
                        {QUICK_ACTIONS.map((action) => (
                            <Link key={action.href} href={action.href}>
                                <Button block size="large" icon={action.icon} className="!h-auto !py-2 !text-left">
                                    <span className="ml-1 inline-flex flex-col leading-tight">
                                        <span className="text-sm font-medium">{action.title}</span>
                                        <span className="text-xs text-gray-400">{action.sub}</span>
                                    </span>
                                </Button>
                            </Link>
                        ))}
                    </div>
                </Card>

                <Card className="lg:col-span-2" size="small" title="Recent prescriptions">
                    <Table<RecentPrescription>
                        rowKey="id"
                        size="small"
                        pagination={false}
                        columns={columns}
                        dataSource={recent_prescriptions}
                        scroll={{ x: 720 }}
                        locale={{
                            emptyText: (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="No prescriptions yet."
                                >
                                    <Link href="/doctor/prescriptions/create">
                                        <Button type="primary" icon={<PlusOutlined />}>
                                            Write your first Rx
                                        </Button>
                                    </Link>
                                </Empty>
                            ),
                        }}
                    />
                </Card>

                <Card size="small" title="Today's queue" extra={<Link href="/doctor/queue">Open queue</Link>}>
                    {todays_queue.length === 0 ? (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No appointments today." />
                    ) : (
                        <List
                            size="small"
                            dataSource={todays_queue}
                            renderItem={(item) => (
                                <List.Item className="!px-0">
                                    <div className="flex w-full items-center gap-3">
                                        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-md bg-gray-100 font-mono text-sm font-semibold text-gray-700">
                                            {item.serial_number}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-medium text-gray-800">
                                                {item.patient_name}
                                            </div>
                                            <div className="truncate text-xs text-gray-500">{item.reason}</div>
                                        </div>
                                        <Tag color={QUEUE_STATUS_COLOR[item.status] ?? 'default'} className="!mr-0">
                                            {titleCase(item.status)}
                                        </Tag>
                                    </div>
                                </List.Item>
                            )}
                        />
                    )}
                </Card>
            </div>
        </DoctorLayout>
    );
}
