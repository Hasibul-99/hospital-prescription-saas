import HospitalLayout from '@/Layouts/HospitalLayout';
import FlashMessage from '@/Components/FlashMessage';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Button, Card, Col, DatePicker, Row, Segmented, Statistic, Table, Typography } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import dayjs from 'dayjs';

type Bucket = 'daily' | 'weekly' | 'monthly';

type Props = PageProps<{
    filters: { bucket: Bucket; from: string; to: string };
    doctor_load: { doctor_id: number; doctor_name: string; visits: number; unique_patients: number }[];
    revenue: { bucket: string; total: number }[];
    revenue_by_doctor: { doctor_id: number; doctor_name: string; total: number }[];
    utilization: {
        total_appointments: number;
        completed: number;
        absent: number;
        completion_rate: number;
        absent_rate: number;
        active_doctors: number;
    };
    demographics: {
        by_gender: { gender: string; count: number }[];
        by_age: { bucket: string; count: number }[];
    };
    top_medicines: { label: string; value: number }[];
    new_vs_returning: { new: number; returning: number };
}>;

const PIE_COLORS = ['#0f4c81', '#2c7da0', '#61a5c2', '#89c2d9', '#a9d6e5', '#f6bd60', '#f7ede2', '#f5cac3', '#84a59d', '#f28482'];

export default function HospitalReports({
    filters,
    doctor_load,
    revenue,
    revenue_by_doctor,
    utilization,
    demographics,
    top_medicines,
    new_vs_returning,
}: Props) {
    function apply(next: Partial<typeof filters>) {
        router.get('/hospital/reports', { ...filters, ...next }, { preserveState: true, preserveScroll: true });
    }

    function exportCsv(report: string) {
        const params = new URLSearchParams({ ...filters, report }).toString();
        window.location.href = `/hospital/reports/export?${params}`;
    }

    function exportFullPdf() {
        const params = new URLSearchParams({ ...filters, report: 'full' }).toString();
        window.location.href = `/hospital/reports/export-pdf?${params}`;
    }

    const newRetData = [
        { name: 'New', value: new_vs_returning.new },
        { name: 'Returning', value: new_vs_returning.returning },
    ];

    return (
        <HospitalLayout>
            <Head title="Hospital Reports" />
            <FlashMessage />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <Typography.Title level={4} className="!mb-0">
                    Hospital Reports
                </Typography.Title>
                <div className="flex flex-wrap items-center gap-2">
                    <Segmented
                        value={filters.bucket}
                        onChange={(v) => apply({ bucket: v as Bucket })}
                        options={[
                            { label: 'Daily', value: 'daily' },
                            { label: 'Weekly', value: 'weekly' },
                            { label: 'Monthly', value: 'monthly' },
                        ]}
                    />
                    <DatePicker.RangePicker
                        value={[dayjs(filters.from), dayjs(filters.to)]}
                        onChange={(range) => {
                            if (!range || !range[0] || !range[1]) return;
                            apply({ from: range[0].format('YYYY-MM-DD'), to: range[1].format('YYYY-MM-DD') });
                        }}
                    />
                    <Button type="primary" icon={<DownloadOutlined />} onClick={exportFullPdf}>
                        Full PDF
                    </Button>
                </div>
            </div>

            <Row gutter={[12, 12]} className="mb-4">
                <Col xs={12} md={6}>
                    <Card>
                        <Statistic title="Total Appointments" value={utilization.total_appointments} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card>
                        <Statistic title="Completion Rate" value={utilization.completion_rate} suffix="%" />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card>
                        <Statistic title="Absent Rate" value={utilization.absent_rate} suffix="%" />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card>
                        <Statistic title="Active Doctors" value={utilization.active_doctors} />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[12, 12]}>
                <Col xs={24} lg={16}>
                    <Card
                        title="Revenue"
                        extra={
                            <Button size="small" icon={<DownloadOutlined />} onClick={() => exportCsv('revenue')}>
                                CSV
                            </Button>
                        }
                    >
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={revenue}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="bucket" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="total" stroke="#0f4c81" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card title="New vs Returning">
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie data={newRetData} dataKey="value" nameKey="name" outerRadius={90} label>
                                    {newRetData.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS[i]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>

                <Col xs={24} lg={12}>
                    <Card
                        title="Doctor Patient Load"
                        extra={
                            <Button size="small" icon={<DownloadOutlined />} onClick={() => exportCsv('doctor_load')}>
                                CSV
                            </Button>
                        }
                    >
                        <Table
                            rowKey="doctor_id"
                            size="small"
                            pagination={false}
                            dataSource={doctor_load}
                            columns={[
                                { title: 'Doctor', dataIndex: 'doctor_name' },
                                { title: 'Visits', dataIndex: 'visits', width: 90, align: 'right' },
                                { title: 'Unique Patients', dataIndex: 'unique_patients', width: 140, align: 'right' },
                            ]}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card
                        title="Revenue by Doctor"
                        extra={
                            <Button size="small" icon={<DownloadOutlined />} onClick={() => exportCsv('revenue_by_doctor')}>
                                CSV
                            </Button>
                        }
                    >
                        <Table
                            rowKey="doctor_id"
                            size="small"
                            pagination={false}
                            dataSource={revenue_by_doctor}
                            columns={[
                                { title: 'Doctor', dataIndex: 'doctor_name' },
                                {
                                    title: 'Revenue',
                                    dataIndex: 'total',
                                    align: 'right',
                                    render: (v: number) => Number(v).toFixed(2),
                                },
                            ]}
                        />
                    </Card>
                </Col>

                <Col xs={24} lg={12}>
                    <Card title="Patient Demographics — Age">
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={demographics.by_age}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="bucket" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#61a5c2" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title="Patient Demographics — Gender">
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie data={demographics.by_gender} dataKey="count" nameKey="gender" outerRadius={90} label>
                                    {demographics.by_gender.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>

                <Col xs={24}>
                    <Card
                        title="Top Prescribed Medicines (Hospital)"
                        extra={
                            <Button size="small" icon={<DownloadOutlined />} onClick={() => exportCsv('top_medicines')}>
                                CSV
                            </Button>
                        }
                    >
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={top_medicines}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="label" angle={-30} textAnchor="end" interval={0} height={80} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#2c7da0" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
            </Row>
        </HospitalLayout>
    );
}
