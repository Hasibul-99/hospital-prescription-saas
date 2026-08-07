import HospitalLayout from '@/Layouts/HospitalLayout';
import Pagination from '@/Components/Pagination';
import FlashMessage from '@/Components/FlashMessage';
import { Head, Link, router } from '@inertiajs/react';
import { Patient } from '@/types';
import {
    Button,
    Card,
    DatePicker,
    Empty,
    Input,
    InputNumber,
    Select,
    Space,
    Table,
    Tag,
    Tooltip,
    Typography,
} from 'antd';
import type { ColumnsType, SorterResult } from 'antd/es/table/interface';
import { DownloadOutlined, EditOutlined, EyeOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useState } from 'react';

type PatientRow = Patient & {
    appointments_count?: number;
    prescriptions_count?: number;
    last_visit?: string | null;
};

type Filters = {
    search?: string;
    gender?: string;
    blood_group?: string;
    date_from?: string;
    date_to?: string;
    age_from?: string;
    age_to?: string;
    sort_by?: string;
    sort_dir?: string;
};

interface Props {
    patients: {
        data: PatientRow[];
        meta: { current_page: number; last_page: number; per_page: number; total: number };
    };
    filters: Filters;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const GENDER_COLOR: Record<string, string> = { male: 'blue', female: 'magenta', other: 'default' };

function ageDisplay(p: Patient): string {
    const parts = [];
    if (p.age_years) parts.push(`${p.age_years}y`);
    if (p.age_months) parts.push(`${p.age_months}m`);
    if (p.age_days) parts.push(`${p.age_days}d`);
    return parts.join(' ') || '—';
}

export default function Index({ patients, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [ageFrom, setAgeFrom] = useState<number | null>(filters.age_from ? Number(filters.age_from) : null);
    const [ageTo, setAgeTo] = useState<number | null>(filters.age_to ? Number(filters.age_to) : null);

    function apply(next: Partial<Filters> & { page?: number }) {
        router.get(
            '/hospital/patients',
            { ...filters, ...next, page: next.page ?? undefined },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function reset() {
        setSearch('');
        setAgeFrom(null);
        setAgeTo(null);
        router.get('/hospital/patients', {}, { preserveScroll: true });
    }

    function exportCsv() {
        const params = new URLSearchParams(
            Object.entries(filters).filter(([, v]) => v) as [string, string][],
        );
        window.location.href = `/hospital/patients-export?${params.toString()}`;
    }

    const hasFilters = Object.entries(filters).some(([k, v]) => v && k !== 'sort_by' && k !== 'sort_dir');

    // Sorting is done server-side, so each sortable column echoes back the
    // current `sort_by` / `sort_dir` rather than letting antd sort locally.
    function sortOrderFor(column: string) {
        if (filters.sort_by !== column) return null;
        return filters.sort_dir === 'asc' ? ('ascend' as const) : ('descend' as const);
    }

    function handleTableChange(_p: unknown, _f: unknown, sorter: SorterResult<PatientRow> | SorterResult<PatientRow>[]) {
        const active = Array.isArray(sorter) ? sorter[0] : sorter;

        if (!active?.order) {
            apply({ sort_by: undefined, sort_dir: undefined });
            return;
        }

        apply({ sort_by: String(active.field), sort_dir: active.order === 'ascend' ? 'asc' : 'desc' });
    }

    const columns: ColumnsType<PatientRow> = [
        {
            title: 'Patient UID',
            dataIndex: 'patient_uid',
            width: 160,
            sorter: true,
            sortOrder: sortOrderFor('patient_uid'),
            render: (uid: string, row) => (
                <Link href={`/hospital/patients/${row.id}`} className="font-mono text-xs">
                    {uid}
                </Link>
            ),
        },
        {
            title: 'Name',
            dataIndex: 'name',
            sorter: true,
            sortOrder: sortOrderFor('name'),
            render: (name: string, row) => (
                <div className="min-w-0">
                    <div className="truncate font-medium text-gray-800">{name}</div>
                    {row.blood_group && (
                        <Tag color="red" className="!mr-0 !text-[10px]">
                            {row.blood_group}
                        </Tag>
                    )}
                </div>
            ),
        },
        {
            title: 'Age / Gender',
            dataIndex: 'age_years',
            width: 150,
            sorter: true,
            sortOrder: sortOrderFor('age_years'),
            render: (_, row) => (
                <Space size={4}>
                    <span className="text-gray-700">{ageDisplay(row)}</span>
                    <Tag color={GENDER_COLOR[row.gender] ?? 'default'} className="!mr-0 capitalize">
                        {row.gender}
                    </Tag>
                </Space>
            ),
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            width: 150,
            sorter: true,
            sortOrder: sortOrderFor('phone'),
            render: (phone: string) => <span className="whitespace-nowrap text-gray-700">{phone}</span>,
        },
        {
            title: 'Last visit',
            dataIndex: 'last_visit',
            width: 140,
            render: (date: string | null) =>
                date ? (
                    <span className="whitespace-nowrap text-gray-600">{dayjs(date).format('DD MMM YYYY')}</span>
                ) : (
                    <span className="text-gray-300">Never</span>
                ),
        },
        {
            title: 'Visits',
            dataIndex: 'appointments_count',
            width: 90,
            align: 'right',
            render: (count: number | undefined) => <span className="tabular-nums">{count ?? 0}</span>,
        },
        {
            title: 'Actions',
            width: 150,
            render: (_, row) => (
                <Space>
                    <Link href={`/hospital/patients/${row.id}`}>
                        <Button size="small" icon={<EyeOutlined />}>
                            View
                        </Button>
                    </Link>
                    <Link href={`/hospital/patients/${row.id}/edit`}>
                        <Button size="small" icon={<EditOutlined />} />
                    </Link>
                </Space>
            ),
        },
    ];

    return (
        <HospitalLayout>
            <Head title="Patients" />
            <FlashMessage />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <Typography.Title level={4} className="!mb-0">
                        Patients
                    </Typography.Title>
                    <Typography.Text type="secondary" className="text-xs">
                        {patients.meta.total.toLocaleString()} registered
                        {hasFilters && ' matching these filters'}
                    </Typography.Text>
                </div>
                <Space>
                    <Button icon={<DownloadOutlined />} onClick={exportCsv}>
                        Export CSV
                    </Button>
                    <Link href="/hospital/patients/create">
                        <Button type="primary" icon={<PlusOutlined />}>
                            Register Patient
                        </Button>
                    </Link>
                </Space>
            </div>

            <Card className="mb-4" size="small">
                <div className="flex flex-wrap items-center gap-2">
                    <Input
                        allowClear
                        prefix={<SearchOutlined />}
                        placeholder="Name, phone, or UID…"
                        style={{ width: 260 }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onPressEnter={() => apply({ search })}
                        onBlur={() => search !== (filters.search ?? '') && apply({ search })}
                    />

                    <Select
                        allowClear
                        placeholder="Gender"
                        style={{ width: 130 }}
                        value={filters.gender || undefined}
                        onChange={(v) => apply({ gender: v })}
                        options={[
                            { label: 'Male', value: 'male' },
                            { label: 'Female', value: 'female' },
                            { label: 'Other', value: 'other' },
                        ]}
                    />

                    <Select
                        allowClear
                        placeholder="Blood group"
                        style={{ width: 140 }}
                        value={filters.blood_group || undefined}
                        onChange={(v) => apply({ blood_group: v })}
                        options={BLOOD_GROUPS.map((bg) => ({ label: bg, value: bg }))}
                    />

                    <DatePicker.RangePicker
                        allowEmpty={[true, true]}
                        placeholder={['Registered from', 'Registered to']}
                        value={[
                            filters.date_from ? dayjs(filters.date_from) : null,
                            filters.date_to ? dayjs(filters.date_to) : null,
                        ]}
                        onChange={(_, [from, to]) => apply({ date_from: from || undefined, date_to: to || undefined })}
                    />

                    <Space.Compact>
                        <InputNumber
                            min={0}
                            max={150}
                            placeholder="Age from"
                            style={{ width: 100 }}
                            value={ageFrom}
                            onChange={setAgeFrom}
                            onPressEnter={() => apply({ age_from: ageFrom?.toString(), age_to: ageTo?.toString() })}
                            onBlur={() => apply({ age_from: ageFrom?.toString(), age_to: ageTo?.toString() })}
                        />
                        <InputNumber
                            min={0}
                            max={150}
                            placeholder="Age to"
                            style={{ width: 100 }}
                            value={ageTo}
                            onChange={setAgeTo}
                            onPressEnter={() => apply({ age_from: ageFrom?.toString(), age_to: ageTo?.toString() })}
                            onBlur={() => apply({ age_from: ageFrom?.toString(), age_to: ageTo?.toString() })}
                        />
                    </Space.Compact>

                    {hasFilters && (
                        <Button icon={<ReloadOutlined />} onClick={reset}>
                            Reset
                        </Button>
                    )}
                </div>
            </Card>

            <Table<PatientRow>
                rowKey="id"
                size="small"
                columns={columns}
                dataSource={patients.data}
                pagination={false}
                onChange={handleTableChange}
                scroll={{ x: 1000 }}
                locale={{
                    emptyText: (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={hasFilters ? 'No patients match these filters.' : 'No patients registered yet.'}
                        />
                    ),
                }}
            />

            <div className="mt-4 flex justify-center">
                <Pagination meta={patients.meta} onChange={(page) => apply({ page })} />
            </div>
        </HospitalLayout>
    );
}
