import DoctorLayout from '@/Layouts/DoctorLayout';
import FlashMessage from '@/Components/Common/FlashMessage';
import Pagination from '@/Components/UI/Pagination';
import AppointmentModal from '@/Components/Scheduling/AppointmentModal';
import { Appointment, Chamber, PaginatedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useMoney } from '@/utils/currency';
import { Button, Card, DatePicker, Empty, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircleTwoTone, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useState } from 'react';

interface Filters {
    date_from?: string;
    date_to?: string;
    status?: string;
    type?: string;
    chamber_id?: string;
}

interface Props {
    appointments: PaginatedData<Appointment>;
    filters: Filters;
    chambers: Chamber[];
}

const STATUS_COLOR: Record<string, string> = {
    waiting: 'default',
    in_progress: 'processing',
    completed: 'green',
    absent: 'orange',
    cancelled: 'red',
};

const TYPE_COLOR: Record<string, string> = {
    new_visit: 'blue',
    follow_up: 'purple',
    emergency: 'red',
};

function titleCase(value: string): string {
    return value.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Index({ appointments, filters, chambers }: Props) {
    const money = useMoney();
    const [showModal, setShowModal] = useState(false);

    function apply(next: Partial<Filters> & { page?: number }) {
        router.get(
            '/doctor/appointments',
            { ...filters, ...next, page: next.page ?? undefined },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function reset() {
        router.get('/doctor/appointments', {}, { preserveScroll: true });
    }

    const hasFilters = Object.values(filters).some(Boolean);

    const columns: ColumnsType<Appointment> = [
        {
            title: 'Date',
            dataIndex: 'appointment_date',
            width: 130,
            render: (date: string) => (
                <span className="whitespace-nowrap text-gray-700">{dayjs(date).format('DD MMM YYYY')}</span>
            ),
        },
        {
            title: '#',
            dataIndex: 'serial_number',
            width: 70,
            align: 'center',
            render: (serial: number) => (
                <span className="font-mono font-semibold tabular-nums">{serial}</span>
            ),
        },
        {
            title: 'Patient',
            dataIndex: ['patient', 'name'],
            render: (name: string, row) => (
                <div className="min-w-0">
                    <div className="truncate font-medium text-gray-800">{name}</div>
                    <div className="truncate text-xs text-gray-500">
                        <span className="font-mono">{row.patient?.patient_uid}</span> · {row.patient?.phone}
                    </div>
                </div>
            ),
        },
        {
            title: 'Type',
            dataIndex: 'type',
            width: 130,
            render: (type: string) => (
                <Tag color={TYPE_COLOR[type] ?? 'default'} className="!mr-0">
                    {titleCase(type)}
                </Tag>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            width: 130,
            render: (status: string) => (
                <Tag color={STATUS_COLOR[status] ?? 'default'} className="!mr-0">
                    {titleCase(status)}
                </Tag>
            ),
        },
        {
            title: 'Fee',
            dataIndex: 'fee_amount',
            width: 130,
            align: 'right',
            render: (amount: number, row) => (
                <Space size={4}>
                    <span className="tabular-nums">{money(amount, { decimals: 0 })}</span>
                    {row.fee_paid ? (
                        <CheckCircleTwoTone twoToneColor="#52c41a" title="Paid" />
                    ) : (
                        <span className="text-xs text-gray-400">unpaid</span>
                    )}
                </Space>
            ),
        },
        {
            title: 'Chamber',
            dataIndex: ['chamber', 'name'],
            width: 160,
            render: (name?: string) => name ?? <span className="text-gray-300">—</span>,
        },
    ];

    return (
        <DoctorLayout>
            <Head title="Appointments" />
            <FlashMessage />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <Typography.Title level={4} className="!mb-0">
                        Appointments
                    </Typography.Title>
                    <Typography.Text type="secondary" className="text-xs">
                        {appointments.meta.total.toLocaleString()} total
                        {hasFilters && ' matching these filters'}
                    </Typography.Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowModal(true)}>
                    New Appointment
                </Button>
            </div>

            <Card className="mb-4" size="small">
                <div className="flex flex-wrap items-center gap-2">
                    <DatePicker.RangePicker
                        allowEmpty={[true, true]}
                        placeholder={['From', 'To']}
                        value={[
                            filters.date_from ? dayjs(filters.date_from) : null,
                            filters.date_to ? dayjs(filters.date_to) : null,
                        ]}
                        onChange={(_, [from, to]) => apply({ date_from: from || undefined, date_to: to || undefined })}
                    />

                    <Select
                        allowClear
                        placeholder="Status"
                        style={{ width: 150 }}
                        value={filters.status || undefined}
                        onChange={(v) => apply({ status: v })}
                        options={[
                            { label: 'Waiting', value: 'waiting' },
                            { label: 'In Progress', value: 'in_progress' },
                            { label: 'Completed', value: 'completed' },
                            { label: 'Absent', value: 'absent' },
                            { label: 'Cancelled', value: 'cancelled' },
                        ]}
                    />

                    <Select
                        allowClear
                        placeholder="Type"
                        style={{ width: 150 }}
                        value={filters.type || undefined}
                        onChange={(v) => apply({ type: v })}
                        options={[
                            { label: 'New Visit', value: 'new_visit' },
                            { label: 'Follow-up', value: 'follow_up' },
                            { label: 'Emergency', value: 'emergency' },
                        ]}
                    />

                    {chambers.length > 0 && (
                        <Select
                            allowClear
                            placeholder="Chamber"
                            style={{ width: 180 }}
                            value={filters.chamber_id || undefined}
                            onChange={(v) => apply({ chamber_id: v })}
                            options={chambers.map((c) => ({ label: c.name, value: String(c.id) }))}
                        />
                    )}

                    {hasFilters && (
                        <Button icon={<ReloadOutlined />} onClick={reset}>
                            Reset
                        </Button>
                    )}
                </div>
            </Card>

            <Table<Appointment>
                rowKey="id"
                size="small"
                columns={columns}
                dataSource={appointments.data}
                pagination={false}
                scroll={{ x: 1000 }}
                locale={{
                    emptyText: (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={hasFilters ? 'No appointments match these filters.' : 'No appointments yet.'}
                        />
                    ),
                }}
            />

            <div className="mt-4 flex justify-center">
                <Pagination meta={appointments.meta} onChange={(page) => apply({ page })} />
            </div>

            {showModal && (
                <AppointmentModal
                    onClose={() => setShowModal(false)}
                    defaultDate={dayjs().format('YYYY-MM-DD')}
                    chambers={chambers}
                    submitUrl="/doctor/appointments"
                    context="doctor"
                />
            )}
        </DoctorLayout>
    );
}
