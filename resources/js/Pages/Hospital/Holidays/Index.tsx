import HospitalLayout from '@/Layouts/HospitalLayout';
import FlashMessage from '@/Components/FlashMessage';
import { HospitalHoliday } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Button, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CalendarOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface Props {
    holidays: HospitalHoliday[];
    year: number;
}

export default function Index({ holidays, year }: Props) {
    function apply(nextYear: number) {
        router.get('/hospital/holidays', { year: nextYear }, { preserveState: true, preserveScroll: true, replace: true });
    }

    function destroy(id: number) {
        router.delete(`/hospital/holidays/${id}`, { preserveScroll: true });
    }

    const years = Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 2 + i);

    const columns: ColumnsType<HospitalHoliday> = [
        {
            title: 'Date',
            dataIndex: 'date',
            width: 180,
            // Recurring holidays are stored on their original year, so show them
            // against the year being viewed rather than the year they were created.
            render: (v: string, r) =>
                r.is_recurring_yearly
                    ? dayjs(v).year(year).format('DD MMM YYYY')
                    : dayjs(v).format('DD MMM YYYY'),
        },
        { title: 'Title', dataIndex: 'title' },
        {
            title: 'Recurring',
            dataIndex: 'is_recurring_yearly',
            width: 120,
            render: (v: boolean) => (v ? <Tag color="blue">Yearly</Tag> : <Tag>One-off</Tag>),
        },
        {
            title: 'Actions',
            width: 180,
            render: (_, r) => (
                <Space>
                    <Link href={`/hospital/holidays/${r.id}/edit`}>
                        <Button size="small" icon={<EditOutlined />}>
                            Edit
                        </Button>
                    </Link>
                    <Popconfirm
                        title="Delete this holiday?"
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => destroy(r.id)}
                    >
                        <Button danger size="small" icon={<DeleteOutlined />}>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <HospitalLayout>
            <Head title="Holidays" />
            <FlashMessage />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <Typography.Title level={4} className="!mb-0">
                    Holidays
                </Typography.Title>
                <Space>
                    <Select
                        value={year}
                        onChange={apply}
                        style={{ width: 120 }}
                        prefix={<CalendarOutlined />}
                        options={years.map((y) => ({ label: String(y), value: y }))}
                    />
                    <Link href="/hospital/holidays/create">
                        <Button type="primary" icon={<PlusOutlined />}>
                            New Holiday
                        </Button>
                    </Link>
                </Space>
            </div>

            <Table<HospitalHoliday>
                rowKey="id"
                size="small"
                columns={columns}
                dataSource={holidays}
                pagination={false}
                locale={{ emptyText: 'No holidays for this year.' }}
            />
        </HospitalLayout>
    );
}
