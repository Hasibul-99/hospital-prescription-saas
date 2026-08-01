import HospitalLayout from '@/Layouts/HospitalLayout';
import FlashMessage from '@/Components/FlashMessage';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Card, Col, Row, Statistic, Table, Tag, Typography } from 'antd';
import {
    CalendarOutlined,
    FileTextOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { ReactNode } from 'react';

const { Title, Text } = Typography;

type Stats = {
    total_doctors: number;
    total_patients: number;
    today_appointments: number;
    pending_appointments: number;
    total_prescriptions: number;
    today_prescriptions: number;
};

type RecentPatient = {
    id: number;
    patient_uid: string;
    name: string;
    phone: string;
    created_at: string;
};

type RecentPrescription = {
    id: number;
    prescription_uid: string;
    status: string;
    created_at: string;
    patient: { id: number; name: string; patient_uid: string } | null;
    doctor: { id: number; name: string } | null;
};

type Props = PageProps<{
    stats: Stats;
    recent_patients: RecentPatient[];
    recent_prescriptions: RecentPrescription[];
}>;

export default function Dashboard({ stats, recent_patients, recent_prescriptions }: Props) {
    const statCards = [
        { title: 'Total Doctors',        value: stats.total_doctors,        icon: <TeamOutlined />,     color: '#1677ff' },
        { title: 'Total Patients',       value: stats.total_patients,       icon: <UserOutlined />,     color: '#52c41a' },
        { title: "Today's Appointments", value: stats.today_appointments,   icon: <CalendarOutlined />, color: '#faad14' },
        { title: 'Pending Today',        value: stats.pending_appointments, icon: <CalendarOutlined />, color: '#ff4d4f' },
        { title: 'Total Prescriptions',  value: stats.total_prescriptions,  icon: <FileTextOutlined />, color: '#722ed1' },
        { title: "Today's Rx",           value: stats.today_prescriptions,  icon: <FileTextOutlined />, color: '#13c2c2' },
    ];

    const patientCols = [
        { title: 'UID',   dataIndex: 'patient_uid', key: 'uid',   render: (v: string, r: RecentPatient) => <Link href={`/hospital/patients/${r.id}`}>{v}</Link> },
        { title: 'Name',  dataIndex: 'name',        key: 'name'  },
        { title: 'Phone', dataIndex: 'phone',       key: 'phone' },
        { title: 'Joined', dataIndex: 'created_at', key: 'joined', render: (v: string) => new Date(v).toLocaleDateString() },
    ];

    const rxCols = [
        { title: 'Rx ID',   dataIndex: 'prescription_uid', key: 'uid',    render: (v: string, r: RecentPrescription) => <Link href={`/hospital/prescriptions/${r.id}`}>{v}</Link> },
        { title: 'Patient', key: 'patient',  render: (_: unknown, r: RecentPrescription) => r.patient?.name ?? '—' },
        { title: 'Doctor',  key: 'doctor',   render: (_: unknown, r: RecentPrescription) => r.doctor?.name ?? '—' },
        { title: 'Status',  dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={v === 'printed' ? 'green' : v === 'draft' ? 'default' : 'blue'}>{v}</Tag> },
        { title: 'Date',    dataIndex: 'created_at', key: 'date', render: (v: string) => new Date(v).toLocaleDateString() },
    ];

    return (
        <>
            <Head title="Dashboard" />
            <FlashMessage />

            <Title level={4} style={{ marginBottom: 24 }}>Hospital Dashboard</Title>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {statCards.map((s) => (
                    <Col xs={24} sm={12} lg={8} key={s.title}>
                        <Card>
                            <Statistic
                                title={s.title}
                                value={s.value}
                                prefix={<span style={{ color: s.color }}>{s.icon}</span>}
                                valueStyle={{ color: s.color }}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                    <Card title="Recent Patients" size="small">
                        <Table
                            dataSource={recent_patients}
                            columns={patientCols}
                            rowKey="id"
                            size="small"
                            pagination={false}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title="Recent Prescriptions" size="small">
                        <Table
                            dataSource={recent_prescriptions}
                            columns={rxCols}
                            rowKey="id"
                            size="small"
                            pagination={false}
                        />
                    </Card>
                </Col>
            </Row>
        </>
    );
}

Dashboard.layout = (page: ReactNode) => <HospitalLayout>{page}</HospitalLayout>;
