import DoctorLayout from '@/Layouts/DoctorLayout';
import Pagination from '@/Components/UI/Pagination';
import FlashMessage from '@/Components/Common/FlashMessage';
import { Head, Link, router } from '@inertiajs/react';
import { PaginatedData, Patient } from '@/types';
import { ReactNode, useState } from 'react';
import { Button, Card, Empty, Input, Select, Space, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import {
    DownloadOutlined,
    EditOutlined,
    EyeOutlined,
    FilterOutlined,
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

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
    patients: PaginatedData<PatientRow>;
    filters: Filters;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const GENDER_TAG: Record<string, { color: string; label: string }> = {
    male: { color: 'blue', label: 'Male' },
    female: { color: 'magenta', label: 'Female' },
    other: { color: 'default', label: 'Other' },
};

/** Years/months/days collapse to the largest meaningful unit for a table cell. */
function ageDisplay(p: Patient): string {
    const parts: string[] = [];
    if (p.age_years) parts.push(`${p.age_years}y`);
    if (p.age_months) parts.push(`${p.age_months}m`);
    if (p.age_days) parts.push(`${p.age_days}d`);
    return parts.join(' ') || '—';
}

function relativeDay(iso: string): string {
    const days = dayjs().startOf('day').diff(dayjs(iso).startOf('day'), 'day');
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days} days ago`;
    return dayjs(iso).format('DD MMM YYYY');
}

export default function Index({ patients, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [showMore, setShowMore] = useState(
        !!(filters.date_from || filters.date_to || filters.age_from || filters.age_to),
    );

    /** Every filter change is a fresh server query; unset keys are dropped. */
    function apply(next: Partial<Filters> & { page?: number }) {
        const merged: Record<string, string | number> = {};
        Object.entries({ ...filters, ...next }).forEach(([key, value]) => {
            if (value !== '' && value != null) merged[key] = value as string | number;
        });
        router.get('/doctor/patients', merged, { preserveState: true, preserveScroll: true, replace: true });
    }

    function reset() {
        setSearch('');
        setShowMore(false);
        router.get('/doctor/patients', {}, { preserveScroll: true });
    }

    function exportCsv() {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => {
            if (v && k !== 'sort_by' && k !== 'sort_dir') params.set(k, String(v));
        });
        window.location.href = `/doctor/patients-export?${params.toString()}`;
    }

    const activeFilterCount = ['gender', 'blood_group', 'date_from', 'date_to', 'age_from', 'age_to', 'search'].filter(
        (k) => filters[k as keyof Filters],
    ).length;

    /** antd wants `ascend`/`descend`; the server speaks `asc`/`desc`. */
    const sortOrderFor = (column: string) =>
        filters.sort_by === column ? (filters.sort_dir === 'asc' ? 'ascend' : 'descend') : null;

    const columns: ColumnsType<PatientRow> = [
        {
            title: 'Patient',
            dataIndex: 'name',
            sorter: true,
            sortOrder: sortOrderFor('name'),
            showSorterTooltip: false,
            render: (name: string, p) => (
                <Link href={`/doctor/patients/${p.id}`} className="flex items-center gap-3">
                    <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                        {name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                        <span className="block truncate font-medium text-gray-900">{name}</span>
                        <span className="block font-mono text-[11px] text-slate-400">{p.patient_uid}</span>
                    </span>
                </Link>
            ),
        },
        {
            title: 'Age / Gender',
            dataIndex: 'age_years',
            width: 150,
            sorter: true,
            sortOrder: sortOrderFor('age_years'),
            showSorterTooltip: false,
            render: (_, p) => {
                const tag = GENDER_TAG[p.gender] ?? GENDER_TAG.other;
                return (
                    <Space size={4}>
                        <span className="text-sm text-slate-700">{ageDisplay(p)}</span>
                        <Tag color={tag.color} className="!mr-0 !text-[10px]">
                            {tag.label}
                        </Tag>
                    </Space>
                );
            },
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            width: 150,
            sorter: true,
            sortOrder: sortOrderFor('phone'),
            showSorterTooltip: false,
            render: (phone: string) => <span className="tabular-nums text-slate-700">{phone}</span>,
        },
        {
            title: 'Blood',
            dataIndex: 'blood_group',
            width: 90,
            align: 'center',
            render: (bg: string | null) =>
                bg ? (
                    <Tag color="red" className="!mr-0">
                        {bg}
                    </Tag>
                ) : (
                    <span className="text-slate-300">—</span>
                ),
        },
        {
            title: 'Visits',
            dataIndex: 'appointments_count',
            width: 110,
            align: 'right',
            render: (visits: number | undefined, p) => (
                <Tooltip title={`${p.prescriptions_count ?? 0} prescription(s)`}>
                    <span className="tabular-nums text-slate-700">{visits ?? 0}</span>
                </Tooltip>
            ),
        },
        {
            title: 'Last visit',
            dataIndex: 'last_visit',
            width: 140,
            render: (iso: string | null) =>
                iso ? (
                    <Tooltip title={dayjs(iso).format('DD MMM YYYY')}>
                        <span className="text-sm text-slate-600">{relativeDay(iso)}</span>
                    </Tooltip>
                ) : (
                    <Tooltip title="Registered but never seen">
                        <span className="text-slate-300">Never</span>
                    </Tooltip>
                ),
        },
        {
            title: 'Actions',
            width: 110,
            render: (_, p) => (
                <Space size={4}>
                    <Tooltip title="View record">
                        <Link href={`/doctor/patients/${p.id}`}>
                            <Button size="small" type="primary" ghost icon={<EyeOutlined />} />
                        </Link>
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Link href={`/doctor/patients/${p.id}/edit`}>
                            <Button size="small" icon={<EditOutlined />} />
                        </Link>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    function handleTableChange(
        _pagination: TablePaginationConfig,
        _tableFilters: Record<string, FilterValue | null>,
        sorter: SorterResult<PatientRow> | SorterResult<PatientRow>[],
    ) {
        const s = Array.isArray(sorter) ? sorter[0] : sorter;

        if (!s?.order) {
            apply({ sort_by: undefined, sort_dir: undefined });
            return;
        }

        apply({ sort_by: String(s.field), sort_dir: s.order === 'ascend' ? 'asc' : 'desc' });
    }

    return (
        <div className="p-5">
            <Head title="Patients" />
            <FlashMessage />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <Typography.Title level={4} className="!mb-0">
                        Patients
                    </Typography.Title>
                    <Typography.Text type="secondary" className="text-xs">
                        {patients.meta.total.toLocaleString()} registered
                        {activeFilterCount > 0 ? ' · filtered' : ''}
                    </Typography.Text>
                </div>

                <Space wrap>
                    <Button icon={<DownloadOutlined />} onClick={exportCsv}>
                        Export CSV
                    </Button>
                    <Link href="/doctor/patients/create">
                        <Button type="primary" icon={<PlusOutlined />}>
                            Register patient
                        </Button>
                    </Link>
                </Space>
            </div>

            <Card size="small" className="mb-4">
                <div className="flex flex-wrap items-center gap-2">
                    <Input
                        allowClear
                        prefix={<SearchOutlined />}
                        placeholder="Name, phone, or patient UID…"
                        style={{ width: 280 }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onPressEnter={() => apply({ search, page: undefined })}
                        onBlur={() => search !== (filters.search ?? '') && apply({ search, page: undefined })}
                    />

                    <Select
                        allowClear
                        placeholder="Gender"
                        style={{ width: 130 }}
                        value={filters.gender ?? undefined}
                        onChange={(v) => apply({ gender: v, page: undefined })}
                        options={[
                            { value: 'male', label: 'Male' },
                            { value: 'female', label: 'Female' },
                            { value: 'other', label: 'Other' },
                        ]}
                    />

                    <Select
                        allowClear
                        placeholder="Blood group"
                        style={{ width: 140 }}
                        value={filters.blood_group ?? undefined}
                        onChange={(v) => apply({ blood_group: v, page: undefined })}
                        options={BLOOD_GROUPS.map((bg) => ({ value: bg, label: bg }))}
                    />

                    <Button
                        icon={<FilterOutlined />}
                        type={showMore ? 'primary' : 'default'}
                        ghost={showMore}
                        onClick={() => setShowMore(!showMore)}
                    >
                        More filters
                    </Button>

                    {activeFilterCount > 0 && (
                        <Button icon={<ReloadOutlined />} onClick={reset}>
                            Reset
                        </Button>
                    )}
                </div>

                {showMore && (
                    <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-3">
                        <label className="text-xs text-slate-500">
                            Registered from
                            <Input
                                type="date"
                                className="mt-1 block"
                                style={{ width: 160 }}
                                value={filters.date_from ?? ''}
                                onChange={(e) => apply({ date_from: e.target.value, page: undefined })}
                            />
                        </label>
                        <label className="text-xs text-slate-500">
                            Registered to
                            <Input
                                type="date"
                                className="mt-1 block"
                                style={{ width: 160 }}
                                value={filters.date_to ?? ''}
                                onChange={(e) => apply({ date_to: e.target.value, page: undefined })}
                            />
                        </label>
                        <label className="text-xs text-slate-500">
                            Age from
                            <Input
                                type="number"
                                min={0}
                                max={150}
                                className="mt-1 block"
                                style={{ width: 90 }}
                                value={filters.age_from ?? ''}
                                onChange={(e) => apply({ age_from: e.target.value, page: undefined })}
                            />
                        </label>
                        <label className="text-xs text-slate-500">
                            Age to
                            <Input
                                type="number"
                                min={0}
                                max={150}
                                className="mt-1 block"
                                style={{ width: 90 }}
                                value={filters.age_to ?? ''}
                                onChange={(e) => apply({ age_to: e.target.value, page: undefined })}
                            />
                        </label>
                    </div>
                )}
            </Card>

            <Table<PatientRow>
                rowKey="id"
                size="small"
                columns={columns}
                dataSource={patients.data}
                pagination={false}
                scroll={{ x: 900 }}
                onChange={handleTableChange}
                locale={{
                    emptyText: (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={activeFilterCount > 0 ? 'No patients match these filters.' : 'No patients yet.'}
                        >
                            {activeFilterCount > 0 ? (
                                <Button onClick={reset}>Clear filters</Button>
                            ) : (
                                <Link href="/doctor/patients/create">
                                    <Button type="primary" icon={<PlusOutlined />}>
                                        Register patient
                                    </Button>
                                </Link>
                            )}
                        </Empty>
                    ),
                }}
            />

            <div className="mt-4 flex justify-center">
                <Pagination meta={patients.meta} onChange={(page) => apply({ page })} />
            </div>
        </div>
    );
}

Index.layout = (page: ReactNode) => <DoctorLayout>{page}</DoctorLayout>;
