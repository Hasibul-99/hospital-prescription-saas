import HospitalLayout from '@/Layouts/HospitalLayout';
import FlashMessage from '@/Components/FlashMessage';
import { Chamber, ChamberShareModel, PageProps, User } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Button, Card, Empty, Popconfirm, Select, Space, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { ReactNode } from 'react';
import { formatMoney, useCurrency } from '@/utils/currency';

const { Title } = Typography;

type ChamberRow = Chamber & { doctor?: Pick<User, 'id' | 'name'> };

type Props = PageProps<{
    chambers: ChamberRow[];
    doctors: Pick<User, 'id' | 'name'>[];
    filters: { doctor_id?: string };
}>;

const DAY_ORDER = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SHARE_TAG: Record<ChamberShareModel, { color: string; label: string }> = {
    full: { color: 'green', label: 'Full' },
    split: { color: 'geekblue', label: 'Split' },
    rent: { color: 'gold', label: 'Rent' },
};

/** Compact location line — skips the parts that were left blank. */
function location(chamber: ChamberRow): string {
    const parts = [
        chamber.room_number && `Room ${chamber.room_number}`,
        chamber.floor && `Floor ${chamber.floor}`,
        chamber.building,
    ].filter(Boolean);

    return parts.length ? parts.join(' · ') : '—';
}

function OpenDays({ schedule }: { schedule: Chamber['schedule'] }) {
    const open = DAY_ORDER.filter((day) => schedule?.[day]?.active);

    if (open.length === 0) {
        return (
            <Tooltip title="No days are open, so this chamber cannot be booked">
                <Tag color="red">No schedule</Tag>
            </Tooltip>
        );
    }

    return (
        <Space size={2} wrap>
            {DAY_ORDER.map((day) => {
                const slot = schedule?.[day];
                return slot?.active ? (
                    <Tooltip key={day} title={slot.start && slot.end ? `${slot.start} – ${slot.end}` : 'No times set'}>
                        <Tag color={slot.start && slot.end ? 'cyan' : 'orange'} className="!mr-0">
                            {day}
                        </Tag>
                    </Tooltip>
                ) : (
                    <span key={day} className="px-1 text-xs text-gray-300">
                        {day}
                    </span>
                );
            })}
        </Space>
    );
}

export default function Index({ chambers, doctors, filters }: Props) {
    const currency = useCurrency();

    function applyFilter(doctorId?: string) {
        router.get(
            '/hospital/chambers',
            { doctor_id: doctorId || undefined },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    const columns: ColumnsType<ChamberRow> = [
        {
            title: 'Chamber',
            dataIndex: 'name',
            render: (name: string, row) => (
                <Space direction="vertical" size={0}>
                    <span className="font-medium text-gray-900">{name}</span>
                    <Typography.Text type="secondary" className="text-xs">
                        {location(row)}
                    </Typography.Text>
                </Space>
            ),
        },
        {
            title: 'Doctor',
            dataIndex: ['doctor', 'name'],
            width: 190,
            render: (_, row) =>
                row.doctor ? row.doctor.name : <Typography.Text type="secondary">Unassigned</Typography.Text>,
        },
        {
            title: 'Open days',
            width: 260,
            render: (_, row) => <OpenDays schedule={row.schedule} />,
        },
        {
            title: 'Slots / day',
            dataIndex: 'daily_slot_cap',
            width: 110,
            align: 'right',
            render: (cap: number | null) =>
                cap ?? <Tooltip title="No daily cap"><span className="text-gray-400">∞</span></Tooltip>,
        },
        {
            title: 'Settlement',
            width: 170,
            render: (_, row) => {
                const model = row.share_model ?? 'full';
                const tag = SHARE_TAG[model];
                const detail =
                    model === 'split' && row.share_percent_doctor != null
                        ? `${Number(row.share_percent_doctor)}% to doctor`
                        : model === 'rent' && row.rent_amount_monthly != null
                          ? `${formatMoney(row.rent_amount_monthly, currency, { decimals: 0 })} / mo`
                          : null;

                return (
                    <Space direction="vertical" size={0}>
                        <Tag color={tag.color} className="!mr-0">{tag.label}</Tag>
                        {detail && (
                            <Typography.Text type="secondary" className="text-xs">
                                {detail}
                            </Typography.Text>
                        )}
                    </Space>
                );
            },
        },
        {
            title: 'Status',
            dataIndex: 'is_active',
            width: 100,
            render: (active: boolean) =>
                active ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>,
        },
        {
            title: 'Actions',
            width: 130,
            render: (_, row) => (
                <Space size={4}>
                    <Link href={`/hospital/chambers/${row.id}/edit`}>
                        <Button size="small" icon={<EditOutlined />}>
                            Edit
                        </Button>
                    </Link>
                    <Popconfirm
                        title="Delete this chamber?"
                        description="Existing appointments keep their record."
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => router.delete(`/hospital/chambers/${row.id}`, { preserveScroll: true })}
                    >
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <>
            <Head title="Chambers" />
            <FlashMessage />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <Title level={4} style={{ marginBottom: 0 }}>
                        Chambers
                    </Title>
                    <Typography.Text type="secondary" className="text-xs">
                        Consultation rooms, their weekly hours, and how income is settled.
                    </Typography.Text>
                </div>
                <Link href="/hospital/chambers/create">
                    <Button type="primary" icon={<PlusOutlined />}>
                        New Chamber
                    </Button>
                </Link>
            </div>

            <Card size="small" className="mb-4">
                <Space wrap>
                    <Select
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        placeholder="Filter by doctor"
                        style={{ minWidth: 220 }}
                        value={filters.doctor_id ?? undefined}
                        onChange={(v) => applyFilter(v)}
                        options={doctors.map((d) => ({ value: String(d.id), label: d.name }))}
                    />
                </Space>
            </Card>

            <Table<ChamberRow>
                rowKey="id"
                size="small"
                columns={columns}
                dataSource={chambers}
                pagination={false}
                scroll={{ x: 1000 }}
                locale={{
                    emptyText: (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={filters.doctor_id ? 'No chambers for this doctor.' : 'No chambers yet.'}
                        />
                    ),
                }}
            />
        </>
    );
}

Index.layout = (page: ReactNode) => <HospitalLayout>{page}</HospitalLayout>;
