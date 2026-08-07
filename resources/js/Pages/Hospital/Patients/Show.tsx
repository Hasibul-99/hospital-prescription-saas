import HospitalLayout from '@/Layouts/HospitalLayout';
import FlashMessage from '@/Components/Common/FlashMessage';
import { Head, Link } from '@inertiajs/react';
import { Patient, Appointment, Prescription } from '@/types';
import { Avatar, Button, Card, Descriptions, Empty, Statistic, Table, Tabs, Tag, Timeline, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, FileTextOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface Props {
    patient: Patient & {
        appointments: Appointment[];
        prescriptions: Prescription[];
    };
}

const APPOINTMENT_STATUS_COLOR: Record<string, string> = {
    waiting: 'default',
    in_progress: 'processing',
    completed: 'green',
    absent: 'orange',
    cancelled: 'red',
};

const GENDER_COLOR: Record<string, string> = { male: 'blue', female: 'magenta', other: 'default' };

function ageDisplay(p: Patient): string {
    const parts = [];
    if (p.age_years) parts.push(`${p.age_years}y`);
    if (p.age_months) parts.push(`${p.age_months}m`);
    if (p.age_days) parts.push(`${p.age_days}d`);
    return parts.join(' ') || '—';
}

function titleCase(value: string): string {
    return value.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Show({ patient }: Props) {
    const appointments = patient.appointments ?? [];
    const prescriptions = patient.prescriptions ?? [];

    // Visits and prescriptions interleaved into one reverse-chronological feed.
    const timeline = [
        ...appointments.map((a) => ({ type: 'appointment' as const, date: a.appointment_date, data: a })),
        ...prescriptions.map((rx) => ({ type: 'prescription' as const, date: rx.date, data: rx })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const prescriptionColumns: ColumnsType<Prescription> = [
        {
            title: 'Prescription',
            dataIndex: 'prescription_uid',
            render: (uid: string) => <span className="font-mono text-xs text-blue-600">{uid}</span>,
        },
        {
            title: 'Date',
            dataIndex: 'date',
            width: 140,
            render: (date: string) => dayjs(date).format('DD MMM YYYY'),
        },
        {
            title: 'Doctor',
            dataIndex: ['doctor', 'name'],
            render: (name?: string) => (name ? `Dr. ${name}` : '—'),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            width: 120,
            render: (status: string) => (
                <Tag color={status === 'finalized' ? 'green' : 'default'}>{titleCase(status)}</Tag>
            ),
        },
    ];

    return (
        <HospitalLayout>
            <Head title={patient.name} />
            <FlashMessage />

            <Card
                className="mb-4"
                size="small"
                extra={
                    <Link href={`/hospital/patients/${patient.id}/edit`}>
                        <Button icon={<EditOutlined />}>Edit info</Button>
                    </Link>
                }
                title={
                    <div className="flex items-center gap-3 py-2">
                        <Avatar
                            size={56}
                            src={patient.profile_image ? `/storage/${patient.profile_image}` : undefined}
                            icon={<UserOutlined />}
                        >
                            {patient.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <div className="min-w-0">
                            <Typography.Title level={5} className="!mb-0 truncate">
                                {patient.name}
                            </Typography.Title>
                            <div className="flex flex-wrap items-center gap-1 text-xs font-normal text-gray-500">
                                <span className="font-mono">{patient.patient_uid}</span>
                                <span>·</span>
                                <span>{ageDisplay(patient)}</span>
                                <Tag color={GENDER_COLOR[patient.gender] ?? 'default'} className="!mr-0 capitalize">
                                    {patient.gender}
                                </Tag>
                                {patient.blood_group && (
                                    <Tag color="red" className="!mr-0">
                                        {patient.blood_group}
                                    </Tag>
                                )}
                            </div>
                        </div>
                    </div>
                }
            >
                <Descriptions size="small" column={{ xs: 1, sm: 2, lg: 3 }} bordered>
                    <Descriptions.Item label="Phone">{patient.phone}</Descriptions.Item>
                    <Descriptions.Item label="Email">{patient.email || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Registered">
                        {dayjs(patient.created_at).format('DD MMM YYYY')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Address" span={2}>
                        {patient.address || '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Emergency contact">
                        {patient.emergency_contact_name
                            ? `${patient.emergency_contact_name}${patient.emergency_contact_phone ? ` · ${patient.emergency_contact_phone}` : ''}`
                            : '—'}
                    </Descriptions.Item>
                    {patient.notes && (
                        <Descriptions.Item label="Notes" span={3}>
                            {patient.notes}
                        </Descriptions.Item>
                    )}
                </Descriptions>
            </Card>

            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Card size="small">
                    <Statistic title="Total visits" value={appointments.length} />
                </Card>
                <Card size="small">
                    <Statistic title="Prescriptions" value={prescriptions.length} />
                </Card>
                <Card size="small">
                    <Statistic
                        title="Last visit"
                        valueStyle={{ fontSize: 18 }}
                        value={timeline.length ? dayjs(timeline[0].date).format('DD MMM YYYY') : '—'}
                    />
                </Card>
                <Card size="small">
                    <Statistic
                        title="Completed visits"
                        value={appointments.filter((a) => a.status === 'completed').length}
                    />
                </Card>
            </div>

            <Card size="small">
                <Tabs
                    items={[
                        {
                            key: 'visits',
                            label: `Visit history (${timeline.length})`,
                            children: timeline.length === 0 ? (
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No visit history yet." />
                            ) : (
                                <Timeline
                                    className="pt-2"
                                    items={timeline.map((entry) => {
                                        const isRx = entry.type === 'prescription';
                                        const doctor = (entry.data as { doctor?: { name: string } }).doctor;

                                        return {
                                            color: isRx ? 'blue' : 'green',
                                            dot: isRx ? <FileTextOutlined /> : undefined,
                                            children: (
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-800">
                                                            {isRx
                                                                ? `Prescription ${(entry.data as Prescription).prescription_uid}`
                                                                : `Appointment #${(entry.data as Appointment).serial_number}`}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {dayjs(entry.date).format('DD MMM YYYY')}
                                                            {doctor && ` · Dr. ${doctor.name}`}
                                                        </div>
                                                    </div>
                                                    {!isRx && (
                                                        <Tag
                                                            color={
                                                                APPOINTMENT_STATUS_COLOR[
                                                                    (entry.data as Appointment).status
                                                                ] ?? 'default'
                                                            }
                                                            className="!mr-0"
                                                        >
                                                            {titleCase((entry.data as Appointment).status)}
                                                        </Tag>
                                                    )}
                                                </div>
                                            ),
                                        };
                                    })}
                                />
                            ),
                        },
                        {
                            key: 'prescriptions',
                            label: `Prescriptions (${prescriptions.length})`,
                            children: (
                                <Table<Prescription>
                                    rowKey="id"
                                    size="small"
                                    pagination={false}
                                    columns={prescriptionColumns}
                                    dataSource={prescriptions}
                                    locale={{
                                        emptyText: (
                                            <Empty
                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                description="No prescriptions yet."
                                            />
                                        ),
                                    }}
                                />
                            ),
                        },
                    ]}
                />
            </Card>
        </HospitalLayout>
    );
}
