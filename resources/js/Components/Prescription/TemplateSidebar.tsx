import { DoctorTemplate } from '@/types';
import { Button, Empty, Input, List, Spin, Tag, Typography } from 'antd';
import { PlusOutlined, SearchOutlined, StarFilled } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';

interface Props {
    templates: DoctorTemplate[];
    activeId?: number | null;
    onSelect: (tpl: DoctorTemplate) => void;
    onNewRx?: () => void;
}

export default function TemplateSidebar({ templates, activeId, onSelect, onNewRx }: Props) {
    const [q, setQ] = useState('');
    const [loading, setLoading] = useState<number | null>(null);

    const filtered = useMemo(() => {
        const query = q.toLowerCase().trim();
        return query ? templates.filter((t) => t.disease_name.toLowerCase().includes(query)) : templates;
    }, [templates, q]);

    const mine = filtered.filter((t) => !t.is_global);
    const global = filtered.filter((t) => t.is_global);

    /** The list payload is trimmed; the full template body comes on demand. */
    async function load(tpl: DoctorTemplate) {
        setLoading(tpl.id);
        try {
            const res = await fetch(`/doctor/templates/${tpl.id}`, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error('Failed');
            onSelect(await res.json());
        } finally {
            setLoading(null);
        }
    }

    function renderGroup(label: string, items: DoctorTemplate[]) {
        if (items.length === 0) return null;

        return (
            <>
                <div className="px-2 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-wide text-[#6a7a72]">
                    {label}
                </div>
                <List
                    size="small"
                    dataSource={items}
                    split={false}
                    renderItem={(tpl) => (
                        <List.Item
                            className={`!cursor-pointer !rounded-lg !px-2.5 !py-2 transition-colors ${
                                activeId === tpl.id ? 'bg-[#e6f4ec]' : 'hover:bg-[#f6f7f5]'
                            }`}
                            onClick={() => loading == null && load(tpl)}
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 text-[13.5px] font-semibold text-[#0f1a14]">
                                    {tpl.is_global && <StarFilled className="text-[#0a8754]" />}
                                    <span className="truncate">{tpl.disease_name}</span>
                                    {loading === tpl.id && <Spin size="small" />}
                                </div>
                                <div className="text-[11.5px] text-[#6a7a72]">
                                    Updated {dayjs(tpl.updated_at).format('DD MMM YYYY')}
                                    {!!tpl.use_count && <Tag className="!ml-1.5 !mr-0">used {tpl.use_count}×</Tag>}
                                </div>
                            </div>
                        </List.Item>
                    )}
                />
            </>
        );
    }

    return (
        <aside className="flex h-full min-h-0 flex-col border-r border-[#e3e7e3] bg-white">
            <div className="border-b border-[#e3e7e3] px-4 pb-2.5 pt-3.5">
                <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-[#6a7a72]">
                    <span>Saved templates</span>
                    <span className="font-medium text-[#9aa8a0]">{filtered.length}</span>
                </div>
                <Input
                    allowClear
                    size="small"
                    prefix={<SearchOutlined />}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search templates…"
                />
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-3">
                {filtered.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        className="!mt-6"
                        description={
                            <Typography.Text type="secondary" className="text-xs">
                                {q ? `No templates match “${q}”` : 'No templates saved yet.'}
                            </Typography.Text>
                        }
                    />
                ) : (
                    <>
                        {renderGroup('My templates', mine)}
                        {renderGroup('Global templates', global)}
                    </>
                )}
            </div>

            <div className="border-t border-[#e3e7e3] p-3">
                <Button type="dashed" block icon={<PlusOutlined />} onClick={onNewRx}>
                    New blank Rx
                </Button>
            </div>
        </aside>
    );
}
