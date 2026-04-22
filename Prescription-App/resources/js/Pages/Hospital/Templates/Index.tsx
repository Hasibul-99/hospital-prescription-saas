import HospitalLayout from '@/Layouts/HospitalLayout';
import FlashMessage from '@/Components/FlashMessage';
import { Head, Link, router } from '@inertiajs/react';
import { PageProps, PaginatedData } from '@/types';
import { Button, Card, Col, Empty, Input, Pagination, Popconfirm, Row, Tag } from 'antd';
import { DeleteOutlined, EditOutlined, FileAddOutlined, SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';

interface TemplateRow {
    id: number;
    disease_name: string;
    medicine_count: number;
    complaint_count: number;
    last_used_at?: string | null;
    use_count: number;
    updated_at: string;
}

type Props = PageProps<{
    templates: PaginatedData<TemplateRow>;
    filters: { q: string };
}>;

export default function HospitalTemplateIndex({ templates, filters }: Props) {
    const [q, setQ] = useState(filters.q ?? '');

    function search() {
        router.get('/hospital/templates', { q }, { preserveState: true, preserveScroll: true });
    }

    function destroy(id: number) {
        router.delete(`/hospital/templates/${id}`, { preserveScroll: true });
    }

    function goPage(p: number) {
        router.get('/hospital/templates', { q, page: p }, { preserveState: true, preserveScroll: true });
    }

    return (
        <HospitalLayout>
            <Head title="Global Templates" />
            <FlashMessage />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-semibold text-gray-800">Global Templates</h2>
                <div className="flex gap-2">
                    <Input
                        allowClear
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        onPressEnter={search}
                        onBlur={search}
                        prefix={<SearchOutlined />}
                        placeholder="Search disease name..."
                        style={{ width: 260 }}
                    />
                    <Link href="/hospital/templates/create">
                        <Button type="primary" icon={<FileAddOutlined />}>
                            New Global Template
                        </Button>
                    </Link>
                </div>
            </div>

            {templates.data.length === 0 ? (
                <Empty description="No global templates yet." />
            ) : (
                <Row gutter={[16, 16]}>
                    {templates.data.map((t) => (
                        <Col key={t.id} xs={24} sm={12} md={8} lg={6}>
                            <Card
                                size="small"
                                title={
                                    <div className="flex items-center gap-2">
                                        <span className="truncate font-semibold">{t.disease_name}</span>
                                        <Tag color="gold">Global</Tag>
                                    </div>
                                }
                                actions={[
                                    <Link key="edit" href={`/hospital/templates/${t.id}/edit`}>
                                        <EditOutlined /> Edit
                                    </Link>,
                                    <Popconfirm
                                        key="del"
                                        title="Delete this global template?"
                                        okText="Delete"
                                        okButtonProps={{ danger: true }}
                                        onConfirm={() => destroy(t.id)}
                                    >
                                        <span className="cursor-pointer text-red-600">
                                            <DeleteOutlined /> Delete
                                        </span>
                                    </Popconfirm>,
                                ]}
                            >
                                <div className="text-xs text-gray-600">
                                    <div>
                                        💊 {t.medicine_count} medicines · 🩺 {t.complaint_count} complaints
                                    </div>
                                    <div className="mt-1">
                                        Used {t.use_count}× {t.last_used_at ? `(last: ${new Date(t.last_used_at).toLocaleDateString()})` : ''}
                                    </div>
                                    <div className="mt-1 text-gray-400">
                                        Updated: {new Date(t.updated_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            <div className="mt-6 flex justify-center">
                <Pagination
                    current={templates.meta.current_page}
                    total={templates.meta.total}
                    pageSize={templates.meta.per_page}
                    onChange={goPage}
                    showSizeChanger={false}
                />
            </div>
        </HospitalLayout>
    );
}
