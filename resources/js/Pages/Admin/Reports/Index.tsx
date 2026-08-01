import AdminLayout from '@/Layouts/AdminLayout';
import FlashMessage from '@/Components/FlashMessage';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Button, Card, Col, Row, Segmented, Statistic, Table, Tag, Typography } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

type Props = PageProps<{
    filters: { months: number };
    totals: { hospitals: number; doctors: number; patients: number; prescriptions: number };
    subscription_breakdown: { status: string; count: number }[];
    hospital_growth: { bucket: string; count: number }[];
    revenue_per_hospital: {
        id: number;
        name: string;
        plan: string;
        monthly_fee: number;
        status: string;
        ends_at?: string | null;
    }[];
}>;

const PIE_COLORS = ['#0f4c81', '#2c7da0', '#61a5c2', '#89c2d9'];

export default function AdminReports({ filters, totals, subscription_breakdown, hospital_growth, revenue_per_hospital }: Props) {
    function changeMonths(months: number) {
        router.get('/admin/reports', { months }, { preserveState: true, preserveScroll: true });
    }

    function exportCsv(report: string) {
        const params = new URLSearchParams({ report }).toString();
        window.location.href = `/admin/reports/export?${params}`;
    }

    function exportFullPdf() {
        window.location.href = '/admin/reports/export-pdf?report=full';
    }

    const totalMonthlyRevenue = revenue_per_hospital.reduce((s, h) => s + h.monthly_fee, 0);

    return (
        <AdminLayout>
            <Head title="Platform Reports" />
            <FlashMessage />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <Typography.Title level={4} className="!mb-0">
                    Platform Reports
                </Typography.Title>
                <div className="flex flex-wrap items-center gap-2">
                    <Segmented
                        value={filters.months}
                        onChange={(v) => changeMonths(Number(v))}
                        options={[
                            { label: '3m', value: 3 },
                            { label: '6m', value: 6 },
                            { label: '12m', value: 12 },
                            { label: '24m', value: 24 },
                        ]}
                    />
                    <Button type="primary" icon={<DownloadOutlined />} onClick={exportFullPdf}>
                        Full PDF
                    </Button>
                </div>
            </div>

            <Row gutter={[12, 12]} className="mb-4">
                <Col xs={12} md={6}>
                    <Card>
                        <Statistic title="Hospitals" value={totals.hospitals} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card>
                        <Statistic title="Doctors" value={totals.doctors} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card>
                        <Statistic title="Patients" value={totals.patients} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card>
                        <Statistic title="Prescriptions" value={totals.prescriptions} />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[12, 12]}>
                <Col xs={24} lg={12}>
                    <Card
                        title="Subscription Status"
                        extra={
                            <Button size="small" icon={<DownloadOutlined />} onClick={() => exportCsv('subscription_breakdown')}>
                                CSV
                            </Button>
                        }
                    >
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie data={subscription_breakdown} dataKey="count" nameKey="status" outerRadius={100} label>
                                    {subscription_breakdown.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
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
                        title={`Hospital Growth (${filters.months} months)`}
                        extra={
                            <Button size="small" icon={<DownloadOutlined />} onClick={() => exportCsv('hospital_growth')}>
                                CSV
                            </Button>
                        }
                    >
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={hospital_growth}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="bucket" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#0f4c81" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>

                <Col xs={24}>
                    <Card
                        title={
                            <span>
                                Revenue per Hospital — total monthly:{' '}
                                <Tag color="green">{totalMonthlyRevenue.toFixed(2)} BDT</Tag>
                            </span>
                        }
                        extra={
                            <Button size="small" icon={<DownloadOutlined />} onClick={() => exportCsv('revenue_per_hospital')}>
                                CSV
                            </Button>
                        }
                    >
                        <Table
                            rowKey="id"
                            size="small"
                            pagination={{ pageSize: 15 }}
                            dataSource={revenue_per_hospital}
                            columns={[
                                { title: 'Hospital', dataIndex: 'name' },
                                { title: 'Plan', dataIndex: 'plan', width: 120 },
                                {
                                    title: 'Monthly Fee',
                                    dataIndex: 'monthly_fee',
                                    width: 130,
                                    align: 'right',
                                    render: (v: number) => v.toFixed(2),
                                },
                                {
                                    title: 'Status',
                                    dataIndex: 'status',
                                    width: 130,
                                    render: (v: string) => {
                                        const color = v === 'active' ? 'green' : v === 'trial' ? 'blue' : 'red';
                                        return <Tag color={color}>{v}</Tag>;
                                    },
                                },
                                { title: 'Ends', dataIndex: 'ends_at', width: 130 },
                            ]}
                        />
                    </Card>
                </Col>
            </Row>
        </AdminLayout>
    );
}
