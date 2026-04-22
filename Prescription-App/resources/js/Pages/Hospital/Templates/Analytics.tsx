import HospitalLayout from '@/Layouts/HospitalLayout';
import FlashMessage from '@/Components/FlashMessage';
import { PageProps } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Card, Col, Row, Segmented, Statistic, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface TopRow {
    id: number;
    disease_name: string;
    is_global: boolean;
    use_count: number;
    last_used_at: string | null;
    doctor_name: string;
    medicine_count: number;
}

interface RecentRow {
    id: number;
    disease_name: string;
    doctor_name: string;
    last_used_at: string | null;
}

type Props = PageProps<{
    top: TopRow[];
    recent: RecentRow[];
    totals: {
        total_templates: number;
        global_templates: number;
        total_uses: number;
        active_last_period: number;
    };
    filters: { days: number };
}>;

const RANGE_OPTIONS = [
    { label: '7d', value: 7 },
    { label: '30d', value: 30 },
    { label: '90d', value: 90 },
    { label: '180d', value: 180 },
    { label: '365d', value: 365 },
];

export default function TemplateAnalytics({ top, recent, totals, filters }: Props) {
    function changeRange(days: number) {
        router.get('/hospital/templates/analytics', { days }, { preserveState: true, preserveScroll: true });
    }

    const topCols: ColumnsType<TopRow> = [
        {
            title: 'Disease',
            dataIndex: 'disease_name',
            render: (v, r) => (
                <span>
                    {v} {r.is_global && <Tag color="gold">Global</Tag>}
                </span>
            ),
        },
        { title: 'Doctor', dataIndex: 'doctor_name', width: 180 },
        {
            title: 'Uses',
            dataIndex: 'use_count',
            width: 90,
            sorter: (a, b) => a.use_count - b.use_count,
            defaultSortOrder: 'descend',
            render: (v) => <strong>{v}</strong>,
        },
        { title: 'Medicines', dataIndex: 'medicine_count', width: 110 },
        {
            title: 'Last Used',
            dataIndex: 'last_used_at',
            width: 170,
            render: (v: string | null) => (v ? new Date(v).toLocaleString() : '—'),
        },
    ];

    const recentCols: ColumnsType<RecentRow> = [
        { title: 'Disease', dataIndex: 'disease_name' },
        { title: 'Doctor', dataIndex: 'doctor_name', width: 180 },
        {
            title: 'When',
            dataIndex: 'last_used_at',
            width: 170,
            render: (v: string | null) => (v ? new Date(v).toLocaleString() : '—'),
        },
    ];

    return (
        <HospitalLayout>
            <Head title="Template Analytics" />
            <FlashMessage />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <Typography.Title level={4} className="!mb-0">
                    Template Analytics
                </Typography.Title>
                <Segmented
                    value={filters.days}
                    onChange={(v) => changeRange(Number(v))}
                    options={RANGE_OPTIONS}
                />
            </div>

            <Row gutter={[12, 12]} className="mb-4">
                <Col xs={12} md={6}>
                    <Card>
                        <Statistic title="Total Templates" value={totals.total_templates} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card>
                        <Statistic title="Global Templates" value={totals.global_templates} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card>
                        <Statistic title="Total Uses" value={totals.total_uses} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card>
                        <Statistic title={`Active last ${filters.days}d`} value={totals.active_last_period} />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[12, 12]}>
                <Col xs={24} lg={14}>
                    <Card title="Most Used Templates">
                        <Table<TopRow>
                            rowKey="id"
                            size="small"
                            columns={topCols}
                            dataSource={top}
                            pagination={{ pageSize: 15 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={10}>
                    <Card title={`Recent Activity (${filters.days}d)`}>
                        <Table<RecentRow>
                            rowKey="id"
                            size="small"
                            columns={recentCols}
                            dataSource={recent}
                            pagination={false}
                        />
                    </Card>
                </Col>
            </Row>
        </HospitalLayout>
    );
}
