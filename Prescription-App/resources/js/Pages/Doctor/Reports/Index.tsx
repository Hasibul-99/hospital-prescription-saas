import DoctorLayout from '@/Layouts/DoctorLayout';
import FlashMessage from '@/Components/FlashMessage';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Button, Card, Col, DatePicker, Row, Segmented, Statistic, Typography } from 'antd';
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

interface Series<T extends string, V extends string> {
    [k: string]: string | number;
}

type Props = PageProps<{
    filters: { bucket: Bucket; from: string; to: string };
    patient_count: { bucket: string; count: number }[];
    disease_breakdown: { label: string; value: number }[];
    top_medicines: { label: string; value: number }[];
    follow_up_compliance: { expected: number; returned: number; rate: number };
}>;

const PIE_COLORS = ['#0f4c81', '#2c7da0', '#61a5c2', '#89c2d9', '#a9d6e5', '#f6bd60', '#f7ede2', '#f5cac3', '#84a59d', '#f28482'];

export default function DoctorReports({ filters, patient_count, disease_breakdown, top_medicines, follow_up_compliance }: Props) {
    function apply(next: Partial<typeof filters>) {
        router.get('/doctor/reports', { ...filters, ...next }, { preserveState: true, preserveScroll: true });
    }

    function exportCsv(report: string) {
        const params = new URLSearchParams({ ...filters, report }).toString();
        window.location.href = `/doctor/reports/export?${params}`;
    }

    return (
        <DoctorLayout>
            <Head title="Reports" />
            <FlashMessage />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <Typography.Title level={4} className="!mb-0">
                    Reports
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
                </div>
            </div>

            <Row gutter={[12, 12]} className="mb-4">
                <Col xs={12} md={6}>
                    <Card>
                        <Statistic title="Follow-up Expected" value={follow_up_compliance.expected} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card>
                        <Statistic title="Returned" value={follow_up_compliance.returned} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card>
                        <Statistic title="Compliance Rate" value={follow_up_compliance.rate} suffix="%" />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card>
                        <Statistic title="Date Range (days)" value={dayjs(filters.to).diff(filters.from, 'day') + 1} />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[12, 12]}>
                <Col xs={24} lg={16}>
                    <Card
                        title="Patient Count"
                        extra={
                            <Button size="small" icon={<DownloadOutlined />} onClick={() => exportCsv('patient_count')}>
                                CSV
                            </Button>
                        }
                    >
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={patient_count}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="bucket" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" stroke="#0f4c81" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card
                        title="Diagnosis Breakdown"
                        extra={
                            <Button size="small" icon={<DownloadOutlined />} onClick={() => exportCsv('disease_breakdown')}>
                                CSV
                            </Button>
                        }
                    >
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={disease_breakdown} dataKey="value" nameKey="label" outerRadius={100} label>
                                    {disease_breakdown.map((_, i) => (
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
                        title="Top Prescribed Medicines"
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
        </DoctorLayout>
    );
}
