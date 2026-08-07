import DoctorLayout from '@/Layouts/DoctorLayout';
import FlashMessage from '@/Components/Common/FlashMessage';
import { Head, Link, router } from '@inertiajs/react';
import { Patient } from '@/types';
import { Alert, Button, Card, DatePicker, Empty, Space, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircleOutlined, MessageOutlined, PhoneOutlined, PlusOutlined, StopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useState } from 'react';

type RecallStatus = 'pending' | 'contacted' | 'unreachable' | 'completed';

interface FollowUpRow {
    id: number;
    prescription_uid: string;
    original_date: string;
    follow_up_date: string;
    patient: Patient;
    status: 'overdue' | 'due' | 'upcoming';
    has_booking: boolean;
    contact_attempts: number;
    last_contact_at: string | null;
    recall_status: RecallStatus;
}

interface Props {
    follow_ups: FollowUpRow[];
    filters: { date_from: string; date_to: string };
}

const DUE_COLOR: Record<string, string> = { overdue: 'red', due: 'gold', upcoming: 'default' };

const RECALL_COLOR: Record<RecallStatus, string> = {
    pending: 'default',
    contacted: 'green',
    unreachable: 'orange',
    completed: 'blue',
};

function titleCase(value: string): string {
    return value.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Index({ follow_ups, filters }: Props) {
    const [selected, setSelected] = useState<number[]>([]);

    function apply(from: string, to: string) {
        router.get(
            '/doctor/follow-ups',
            { date_from: from, date_to: to },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function bulkMark(status: 'contacted' | 'unreachable' | 'completed') {
        if (selected.length === 0) return;

        router.post(
            '/doctor/follow-ups/bulk-mark',
            { ids: selected, status },
            { preserveScroll: true, onSuccess: () => setSelected([]) },
        );
    }

    const overdue = follow_ups.filter((f) => f.status === 'overdue').length;

    const columns: ColumnsType<FollowUpRow> = [
        {
            title: 'Patient',
            dataIndex: ['patient', 'name'],
            render: (name: string, row) => (
                <div className="min-w-0">
                    <div className="truncate font-medium text-gray-800">{name}</div>
                    <div className="truncate text-xs text-gray-500">
                        <span className="font-mono">{row.patient.patient_uid}</span> · {row.patient.phone}
                    </div>
                </div>
            ),
        },
        {
            title: 'Original Rx',
            dataIndex: 'prescription_uid',
            width: 180,
            render: (uid: string, row) => (
                <div className="min-w-0">
                    <div className="truncate font-mono text-xs text-blue-600">{uid}</div>
                    <div className="text-xs text-gray-500">{dayjs(row.original_date).format('DD MMM YYYY')}</div>
                </div>
            ),
        },
        {
            title: 'Due',
            dataIndex: 'follow_up_date',
            width: 130,
            render: (date: string) => (
                <span className="whitespace-nowrap text-gray-700">{dayjs(date).format('DD MMM YYYY')}</span>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            width: 110,
            render: (status: string) => (
                <Tag color={DUE_COLOR[status] ?? 'default'} className="!mr-0">
                    {titleCase(status)}
                </Tag>
            ),
        },
        {
            title: 'Recall',
            dataIndex: 'recall_status',
            width: 150,
            render: (status: RecallStatus, row) => (
                <div>
                    <Tag color={RECALL_COLOR[status]} className="!mr-0">
                        {titleCase(status)}
                    </Tag>
                    {row.contact_attempts > 0 && (
                        <Tooltip
                            title={
                                row.last_contact_at
                                    ? `Last contacted ${dayjs(row.last_contact_at).format('DD MMM YYYY')}`
                                    : undefined
                            }
                        >
                            <div className="mt-1 text-[10px] text-gray-500">
                                {row.contact_attempts} attempt{row.contact_attempts === 1 ? '' : 's'}
                            </div>
                        </Tooltip>
                    )}
                </div>
            ),
        },
        {
            title: 'Booked',
            dataIndex: 'has_booking',
            width: 90,
            render: (booked: boolean) =>
                booked ? <Tag color="green">Yes</Tag> : <span className="text-gray-300">—</span>,
        },
        {
            title: 'Actions',
            width: 190,
            render: (_, row) => (
                <Space>
                    <Link href={`/doctor/patients/${row.patient.id}`}>
                        <Button size="small">View patient</Button>
                    </Link>
                    <Tooltip title="Write a new prescription for this patient">
                        <Link href={`/doctor/prescriptions/create?patient_id=${row.patient.id}`}>
                            <Button size="small" type="primary" icon={<PlusOutlined />} />
                        </Link>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <DoctorLayout>
            <Head title="Follow-ups" />
            <FlashMessage />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <Typography.Title level={4} className="!mb-0">
                        Follow-ups
                    </Typography.Title>
                    <Typography.Text type="secondary" className="text-xs">
                        {follow_ups.length} due in this range
                    </Typography.Text>
                </div>
                <DatePicker.RangePicker
                    allowClear={false}
                    value={[dayjs(filters.date_from), dayjs(filters.date_to)]}
                    onChange={(_, [from, to]) => from && to && apply(from, to)}
                />
            </div>

            {overdue > 0 && (
                <Alert
                    className="mb-4"
                    type="warning"
                    showIcon
                    message={`${overdue} follow-up${overdue === 1 ? ' is' : 's are'} overdue`}
                    description="Overdue recalls have passed their due date without a booking."
                />
            )}

            {selected.length > 0 && (
                <Card className="mb-3" size="small">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{selected.length} selected</span>
                        <div className="ml-auto flex flex-wrap gap-2">
                            <Button size="small" icon={<PhoneOutlined />} onClick={() => bulkMark('contacted')}>
                                Mark contacted
                            </Button>
                            <Button size="small" icon={<StopOutlined />} onClick={() => bulkMark('unreachable')}>
                                Mark unreachable
                            </Button>
                            <Button
                                size="small"
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                onClick={() => bulkMark('completed')}
                            >
                                Mark completed
                            </Button>
                            <Tooltip title="Requires SMS gateway configuration">
                                <Button size="small" disabled icon={<MessageOutlined />}>
                                    Send SMS reminder
                                </Button>
                            </Tooltip>
                        </div>
                    </div>
                </Card>
            )}

            <Table<FollowUpRow>
                rowKey="id"
                size="small"
                columns={columns}
                dataSource={follow_ups}
                pagination={false}
                scroll={{ x: 1100 }}
                rowSelection={{ selectedRowKeys: selected, onChange: (keys) => setSelected(keys as number[]) }}
                rowClassName={(row) => (row.status === 'overdue' ? 'bg-red-50/40' : '')}
                locale={{
                    emptyText: (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No follow-ups in this range." />
                    ),
                }}
            />
        </DoctorLayout>
    );
}
