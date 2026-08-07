import DoctorLayout from '@/Layouts/DoctorLayout';
import FlashMessage from '@/Components/Common/FlashMessage';
import { Appointment } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useMoney } from '@/utils/currency';
import { Button, Card, DatePicker, Empty, Statistic, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircleTwoTone, PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface Summary {
    total_patients: number;
    new_patients: number;
    follow_ups: number;
    emergency: number;
    total_earned: number;
    total_paid: number;
    total_unpaid: number;
}

interface Props {
    rows: Appointment[];
    summary: Summary;
    filters: { date_from: string; date_to: string };
}

const STATUS_COLOR: Record<string, string> = {
    waiting: 'default',
    in_progress: 'processing',
    completed: 'green',
    absent: 'orange',
    cancelled: 'red',
};

function titleCase(value: string): string {
    return value.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Index({ rows, summary, filters }: Props) {
    const money = useMoney();

    function apply(from: string, to: string) {
        router.get(
            '/doctor/statements',
            { date_from: from, date_to: to },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    const columns: ColumnsType<Appointment> = [
        {
            title: 'Date',
            dataIndex: 'appointment_date',
            width: 130,
            render: (date: string) => (
                <span className="whitespace-nowrap">{dayjs(date).format('DD MMM YYYY')}</span>
            ),
        },
        {
            title: '#',
            dataIndex: 'serial_number',
            width: 60,
            align: 'center',
            render: (serial: number) => <span className="font-mono tabular-nums">{serial}</span>,
        },
        {
            title: 'Patient',
            dataIndex: ['patient', 'name'],
            render: (name: string, row) => (
                <div className="min-w-0">
                    <div className="truncate">{name}</div>
                    <div className="truncate font-mono text-xs text-gray-500">{row.patient?.patient_uid}</div>
                </div>
            ),
        },
        {
            title: 'Type',
            dataIndex: 'type',
            width: 130,
            render: (type: string) => titleCase(type),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            width: 120,
            render: (status: string) => (
                <Tag color={STATUS_COLOR[status] ?? 'default'} className="!mr-0">
                    {titleCase(status)}
                </Tag>
            ),
        },
        {
            title: 'Fee',
            dataIndex: 'fee_amount',
            width: 120,
            align: 'right',
            render: (amount: number) => <span className="tabular-nums">{money(amount)}</span>,
        },
        {
            title: 'Paid',
            dataIndex: 'fee_paid',
            width: 70,
            align: 'center',
            render: (paid: boolean) =>
                paid ? <CheckCircleTwoTone twoToneColor="#52c41a" /> : <span className="text-gray-300">—</span>,
        },
    ];

    return (
        <DoctorLayout>
            <Head title="Daily Statement" />
            {/* Printing this page should yield the statement alone: drop the
                layout chrome and the filter bar. The tag unmounts with the
                page, so the `aside, header` rules never outlive it. */}
            <style>{`@media print {
                aside, header, .rx-statement-noprint { display: none !important; }
                main { padding: 0 !important; }
            }`}</style>
            <FlashMessage />

            <div className="rx-statement-noprint mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <Typography.Title level={4} className="!mb-0">
                        Daily Statement
                    </Typography.Title>
                    <Typography.Text type="secondary" className="text-xs">
                        {dayjs(filters.date_from).format('DD MMM YYYY')} – {dayjs(filters.date_to).format('DD MMM YYYY')}
                    </Typography.Text>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <DatePicker.RangePicker
                        allowClear={false}
                        value={[dayjs(filters.date_from), dayjs(filters.date_to)]}
                        onChange={(_, [from, to]) => from && to && apply(from, to)}
                    />
                    <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>
                        Print
                    </Button>
                </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Card size="small">
                    <Statistic title="Total patients" value={summary.total_patients} />
                </Card>
                <Card size="small">
                    <Statistic title="New" value={summary.new_patients} />
                </Card>
                <Card size="small">
                    <Statistic title="Follow-ups" value={summary.follow_ups} />
                </Card>
                <Card size="small">
                    <Statistic
                        title="Emergency"
                        value={summary.emergency}
                        valueStyle={summary.emergency > 0 ? { color: '#cf1322' } : undefined}
                    />
                </Card>
                <Card size="small">
                    <Statistic title="Total earned" value={money(summary.total_earned)} />
                </Card>
                <Card size="small">
                    <Statistic title="Paid" value={money(summary.total_paid)} valueStyle={{ color: '#389e0d' }} />
                </Card>
                <Card size="small">
                    <Statistic
                        title="Unpaid"
                        value={money(summary.total_unpaid)}
                        valueStyle={summary.total_unpaid > 0 ? { color: '#cf1322' } : undefined}
                    />
                </Card>
            </div>

            <Table<Appointment>
                rowKey="id"
                size="small"
                columns={columns}
                dataSource={rows}
                pagination={false}
                scroll={{ x: 900 }}
                locale={{
                    emptyText: (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No records in this range." />
                    ),
                }}
                summary={() =>
                    rows.length > 0 ? (
                        <Table.Summary fixed>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={5}>
                                    <span className="font-medium">Total</span>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={5} align="right">
                                    <span className="font-semibold tabular-nums">{money(summary.total_earned)}</span>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={6} />
                            </Table.Summary.Row>
                        </Table.Summary>
                    ) : null
                }
            />
        </DoctorLayout>
    );
}
