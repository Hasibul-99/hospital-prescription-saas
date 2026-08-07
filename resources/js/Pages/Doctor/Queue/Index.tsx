import DoctorLayout from '@/Layouts/DoctorLayout';
import FlashMessage from '@/Components/Common/FlashMessage';
import AppointmentModal from '@/Components/Scheduling/AppointmentModal';
import { Head, Link, router } from '@inertiajs/react';
import { Appointment, Chamber, HospitalHoliday, QueueStats } from '@/types';
import { ReactNode, useEffect, useState } from 'react';
import {
    Alert,
    Badge,
    Button,
    Card,
    DatePicker,
    Empty,
    Progress,
    Select,
    Space,
    Table,
    Tag,
    Tooltip,
    Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    CheckOutlined,
    CloseOutlined,
    CoffeeOutlined,
    FileTextOutlined,
    PlusOutlined,
    PrinterOutlined,
    ReloadOutlined,
    StepForwardOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useMoney } from '@/utils/currency';

interface Props {
    date: string;
    chamber_id: number | null;
    chambers: Chamber[];
    queue: Appointment[];
    stats: QueueStats;
    on_break: boolean;
    holiday: HospitalHoliday | null;
}

const REFRESH_MS = 10_000;

const STATUS_TAG: Record<string, { color: string; label: string }> = {
    waiting: { color: 'default', label: 'Waiting' },
    in_progress: { color: 'processing', label: 'In progress' },
    completed: { color: 'success', label: 'Completed' },
    absent: { color: 'error', label: 'Absent' },
    cancelled: { color: 'default', label: 'Cancelled' },
};

const TYPE_TAG: Record<string, { color: string; label: string }> = {
    new_visit: { color: 'blue', label: 'New visit' },
    follow_up: { color: 'gold', label: 'Follow-up' },
    emergency: { color: 'red', label: 'Emergency' },
};

function ageStr(p?: Appointment['patient']): string {
    const parts: string[] = [];
    if (p?.age_years) parts.push(`${p.age_years}y`);
    if (p?.age_months) parts.push(`${p.age_months}m`);
    if (p?.age_days) parts.push(`${p.age_days}d`);
    return parts.join(' ') || '—';
}

function patientMeta(a: Appointment): string {
    return [ageStr(a.patient), a.patient?.gender?.charAt(0).toUpperCase(), a.patient?.patient_uid]
        .filter(Boolean)
        .join(' · ');
}

/**
 * The patient in the room and the one after them.
 *
 * A queue screen is read at a glance between consultations, so who is being
 * seen now must not require scanning the table for a tinted row.
 */
function NowServing({
    current,
    next,
    onComplete,
    onStart,
}: {
    current?: Appointment;
    next?: Appointment;
    onComplete: (a: Appointment) => void;
    onStart: (a: Appointment) => void;
}) {
    if (!current && !next) return null;

    return (
        <div className="mb-4 grid gap-3 lg:grid-cols-3">
            <Card
                className="lg:col-span-2"
                styles={{ body: { padding: 20 } }}
                style={{ borderColor: current ? '#5eead4' : undefined, background: current ? '#f0fdfa' : undefined }}
            >
                {current ? (
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="grid h-14 w-14 flex-none place-items-center rounded-xl bg-teal-600 font-mono text-xl font-bold text-white">
                            {current.serial_number}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <Badge status="processing" />
                                <Typography.Text type="secondary" className="text-[11px] uppercase tracking-wide">
                                    Now serving
                                </Typography.Text>
                            </div>
                            <div className="truncate text-lg font-semibold text-gray-900">{current.patient?.name}</div>
                            <Typography.Text type="secondary" className="text-xs">
                                {patientMeta(current)} · {current.patient?.phone}
                            </Typography.Text>
                        </div>
                        <Space wrap>
                            <Link
                                href={`/doctor/prescriptions/create?patient_id=${current.patient_id}&appointment_id=${current.id}`}
                            >
                                <Button type="primary" icon={<FileTextOutlined />}>
                                    Write prescription
                                </Button>
                            </Link>
                            <Button icon={<CheckOutlined />} onClick={() => onComplete(current)}>
                                Complete
                            </Button>
                        </Space>
                    </div>
                ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <Typography.Text type="secondary" className="text-[11px] uppercase tracking-wide">
                                Now serving
                            </Typography.Text>
                            <div className="text-base text-gray-500">Nobody is in the room.</div>
                        </div>
                        {next && (
                            <Button type="primary" icon={<StepForwardOutlined />} onClick={() => onStart(next)}>
                                Call serial {next.serial_number}
                            </Button>
                        )}
                    </div>
                )}
            </Card>

            <Card styles={{ body: { padding: 20 } }}>
                <Typography.Text type="secondary" className="text-[11px] uppercase tracking-wide">
                    Up next
                </Typography.Text>
                {next ? (
                    <div className="mt-2 flex items-center gap-3">
                        <div className="grid h-10 w-10 flex-none place-items-center rounded-lg bg-slate-100 font-mono text-base font-bold text-slate-700">
                            {next.serial_number}
                        </div>
                        <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-gray-900">{next.patient?.name}</div>
                            <Typography.Text type="secondary" className="text-xs">
                                {patientMeta(next)}
                            </Typography.Text>
                        </div>
                    </div>
                ) : (
                    <div className="mt-2 text-sm text-gray-400">No one waiting.</div>
                )}
            </Card>
        </div>
    );
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: string }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
            <div className={`mt-0.5 text-xl font-bold tabular-nums ${tone ?? 'text-slate-900'}`}>{value}</div>
        </div>
    );
}

export default function Index({ date, chamber_id, chambers, queue, stats, on_break, holiday }: Props) {
    const money = useMoney();
    const [showModal, setShowModal] = useState(false);
    const [selectedRx, setSelectedRx] = useState<number[]>([]);

    const current = queue.find((a) => a.status === 'in_progress');
    const next = queue.find((a) => a.status === 'waiting');
    const done = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

    // Polling keeps the queue live while the doctor works from another tab.
    useEffect(() => {
        const t = setInterval(() => router.reload({ only: ['queue', 'stats', 'on_break'] }), REFRESH_MS);
        return () => clearInterval(t);
    }, []);

    function reload(params: Record<string, unknown>) {
        router.get('/doctor/queue', { date, chamber_id: chamber_id ?? undefined, ...params }, { preserveState: false });
    }

    const updateStatus = (a: Appointment, status: string) =>
        router.patch(`/doctor/queue/appointments/${a.id}/status`, { status }, { preserveScroll: true });

    function bulkPrint() {
        if (selectedRx.length === 0) return;

        // A normal POST in a new tab — the endpoint streams a merged PDF, which
        // an Inertia visit cannot handle.
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/doctor/prescriptions/bulk-pdf';
        form.target = '_blank';

        const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '';
        const csrf = document.createElement('input');
        csrf.type = 'hidden';
        csrf.name = '_token';
        csrf.value = token;
        form.appendChild(csrf);

        selectedRx.forEach((id) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'ids[]';
            input.value = String(id);
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    }

    const columns: ColumnsType<Appointment> = [
        {
            title: '#',
            dataIndex: 'serial_number',
            width: 64,
            align: 'center',
            render: (n: number, a) => (
                <span
                    className={`inline-grid h-8 w-8 place-items-center rounded-lg font-mono text-sm font-bold ${
                        a.status === 'in_progress'
                            ? 'bg-teal-600 text-white'
                            : a.status === 'completed'
                              ? 'bg-slate-100 text-slate-400'
                              : 'bg-slate-100 text-slate-700'
                    }`}
                >
                    {n}
                </span>
            ),
        },
        {
            title: 'Patient',
            render: (_, a) => (
                <div className="min-w-0">
                    <div className="truncate font-medium text-gray-900">{a.patient?.name}</div>
                    <Typography.Text type="secondary" className="text-xs">
                        {patientMeta(a)} · {a.patient?.phone}
                    </Typography.Text>
                </div>
            ),
        },
        {
            title: 'Type',
            dataIndex: 'type',
            width: 120,
            render: (t: string) => {
                const tag = TYPE_TAG[t] ?? { color: 'default', label: t };
                return <Tag color={tag.color}>{tag.label}</Tag>;
            },
        },
        {
            title: 'Status',
            dataIndex: 'status',
            width: 130,
            render: (s: string) => {
                const tag = STATUS_TAG[s] ?? { color: 'default', label: s };
                return <Tag color={tag.color}>{tag.label}</Tag>;
            },
        },
        {
            title: 'Fee',
            dataIndex: 'fee_amount',
            width: 130,
            align: 'right',
            render: (fee, a) => (
                <Space direction="vertical" size={0} className="items-end">
                    <span className="tabular-nums">{money(fee, { decimals: 0 })}</span>
                    {a.fee_paid ? (
                        <Tag color="green" className="!mr-0 !text-[10px]">Paid</Tag>
                    ) : (
                        <Tag color="red" className="!mr-0 !text-[10px]">Unpaid</Tag>
                    )}
                </Space>
            ),
        },
        {
            title: 'Actions',
            width: 230,
            render: (_, a) => (
                <Space size={4} wrap>
                    <Tooltip title={a.prescription ? 'Open prescription' : 'Write prescription'}>
                        <Link href={`/doctor/prescriptions/create?patient_id=${a.patient_id}&appointment_id=${a.id}`}>
                            <Button size="small" type="primary" ghost icon={<FileTextOutlined />} />
                        </Link>
                    </Tooltip>

                    {a.prescription && (
                        <Tooltip title="Print">
                            <Link href={`/doctor/prescriptions/${a.prescription.id}/preview`}>
                                <Button size="small" icon={<PrinterOutlined />} />
                            </Link>
                        </Tooltip>
                    )}

                    {a.status === 'waiting' && (
                        <Tooltip title="Call this patient in">
                            <Button
                                size="small"
                                icon={<StepForwardOutlined />}
                                onClick={() => updateStatus(a, 'in_progress')}
                            >
                                Start
                            </Button>
                        </Tooltip>
                    )}

                    {a.status !== 'completed' && (
                        <Tooltip title="Mark completed">
                            <Button size="small" icon={<CheckOutlined />} onClick={() => updateStatus(a, 'completed')} />
                        </Tooltip>
                    )}

                    {a.status !== 'absent' && a.status !== 'completed' && (
                        <Tooltip title="Mark absent">
                            <Button size="small" danger icon={<CloseOutlined />} onClick={() => updateStatus(a, 'absent')} />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div className="p-5">
            <Head title="Serial Queue" />
            <FlashMessage />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <Typography.Title level={4} className="!mb-0">
                        Serial queue
                    </Typography.Title>
                    <Typography.Text type="secondary" className="text-xs">
                        {dayjs(date).format('dddd, D MMMM YYYY')} · refreshes automatically
                    </Typography.Text>
                </div>

                <Space wrap>
                    <DatePicker
                        value={dayjs(date)}
                        allowClear={false}
                        onChange={(d) => d && reload({ date: d.format('YYYY-MM-DD') })}
                        format="DD MMM YYYY"
                    />
                    {chambers.length > 0 && (
                        <Select
                            allowClear
                            placeholder="All chambers"
                            style={{ minWidth: 180 }}
                            value={chamber_id ?? undefined}
                            onChange={(v) => reload({ chamber_id: v ?? undefined })}
                            options={chambers.map((c) => ({ value: c.id, label: c.name }))}
                        />
                    )}
                    <Tooltip title="Refresh now">
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={() => router.reload({ only: ['queue', 'stats', 'on_break'] })}
                        />
                    </Tooltip>
                </Space>
            </div>

            {holiday && (
                <Alert
                    type="error"
                    showIcon
                    className="mb-3"
                    title={`Holiday — ${holiday.title}`}
                    description="New bookings are blocked for this date."
                />
            )}

            {on_break && (
                <Alert
                    type="warning"
                    showIcon
                    className="mb-3"
                    title="You are on break."
                    description="Patients are not being called while the break is active."
                    action={
                        <Button
                            size="small"
                            onClick={() =>
                                router.post(
                                    '/doctor/queue/break',
                                    { date, chamber_id: chamber_id ?? undefined, on: false },
                                    { preserveScroll: true },
                                )
                            }
                        >
                            End break
                        </Button>
                    }
                />
            )}

            <NowServing
                current={current}
                next={next}
                onComplete={(a) => updateStatus(a, 'completed')}
                onStart={(a) => updateStatus(a, 'in_progress')}
            />

            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                <Stat label="Total" value={stats.total} />
                <Stat label="Completed" value={stats.completed} tone="text-green-600" />
                <Stat label="Waiting" value={stats.waiting} tone="text-amber-600" />
                <Stat label="Follow-ups" value={stats.follow_ups} />
                <Stat label="Absent" value={stats.absent} tone="text-red-600" />
                <Stat label="Earned" value={money(stats.total_earned, { decimals: 0 })} tone="text-teal-700" />
            </div>

            {stats.total > 0 && (
                <div className="mb-4 flex items-center gap-3">
                    <Progress percent={done} size="small" strokeColor="#0f766e" className="!mb-0 max-w-xs" />
                    <Typography.Text type="secondary" className="text-xs">
                        {stats.completed} of {stats.total} seen
                    </Typography.Text>
                </div>
            )}

            <div className="mb-3 flex flex-wrap items-center gap-2">
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    disabled={!!holiday}
                    onClick={() => setShowModal(true)}
                >
                    New appointment
                </Button>

                <Button
                    icon={<StepForwardOutlined />}
                    disabled={!next}
                    onClick={() =>
                        router.post(
                            '/doctor/queue/next',
                            { date, chamber_id: chamber_id ?? undefined },
                            { preserveScroll: true },
                        )
                    }
                >
                    Next patient
                </Button>

                <Button
                    icon={<CoffeeOutlined />}
                    danger={on_break}
                    onClick={() =>
                        router.post(
                            '/doctor/queue/break',
                            { date, chamber_id: chamber_id ?? undefined, on: !on_break },
                            { preserveScroll: true },
                        )
                    }
                >
                    {on_break ? 'End break' : 'Take a break'}
                </Button>

                {/* Only offered once something is selected — an always-visible
                    disabled button gave no hint that selection was the trigger. */}
                {selectedRx.length > 0 && (
                    <Button type="primary" ghost icon={<PrinterOutlined />} onClick={bulkPrint}>
                        Print {selectedRx.length} prescription{selectedRx.length > 1 ? 's' : ''}
                    </Button>
                )}
            </div>

            <Table<Appointment>
                rowKey="id"
                size="small"
                columns={columns}
                dataSource={queue}
                pagination={false}
                scroll={{ x: 900 }}
                rowClassName={(a) => (a.status === 'in_progress' ? 'bg-teal-50/60' : '')}
                rowSelection={{
                    selectedRowKeys: queue
                        .filter((a) => a.prescription && selectedRx.includes(a.prescription.id))
                        .map((a) => a.id),
                    // Only rows that have a prescription can be printed.
                    getCheckboxProps: (a) => ({ disabled: !a.prescription }),
                    onChange: (keys) =>
                        setSelectedRx(
                            queue
                                .filter((a) => keys.includes(a.id) && a.prescription)
                                .map((a) => a.prescription!.id),
                        ),
                }}
                locale={{
                    emptyText: (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={holiday ? 'Closed for the holiday.' : 'No appointments for this day.'}
                        >
                            {!holiday && (
                                <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowModal(true)}>
                                    New appointment
                                </Button>
                            )}
                        </Empty>
                    ),
                }}
            />

            {showModal && (
                <AppointmentModal
                    onClose={() => setShowModal(false)}
                    defaultDate={date}
                    chambers={chambers}
                    defaultChamberId={chamber_id ?? undefined}
                    submitUrl="/doctor/appointments"
                    context="doctor"
                />
            )}
        </div>
    );
}

Index.layout = (page: ReactNode) => <DoctorLayout>{page}</DoctorLayout>;
