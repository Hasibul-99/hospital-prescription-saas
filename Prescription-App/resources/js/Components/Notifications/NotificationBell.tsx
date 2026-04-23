import { Badge, Button, Dropdown, Empty, List, Typography } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useState } from 'react';

interface NotificationItem {
    id: number;
    type: string;
    data: Record<string, unknown>;
    created_at: string;
}

const POLL_MS = 60_000;

export default function NotificationBell() {
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [open, setOpen] = useState(false);

    const csrf = () =>
        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '';

    const load = useCallback(async () => {
        try {
            const res = await fetch('/doctor/notifications', {
                credentials: 'same-origin',
                headers: { Accept: 'application/json' },
            });
            if (!res.ok) return;
            const json = await res.json();
            setItems(json.items ?? []);
        } catch {
            // swallow; silent poll
        }
    }, []);

    useEffect(() => {
        load();
        const t = setInterval(load, POLL_MS);
        return () => clearInterval(t);
    }, [load]);

    async function ack(id: number) {
        const res = await fetch(`/doctor/notifications/${id}/ack`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'X-CSRF-TOKEN': csrf(),
            },
        });
        if (res.ok) {
            setItems((prev) => prev.filter((i) => i.id !== id));
        }
    }

    const dropdown = (
        <div className="w-[360px] rounded-md border bg-white p-2 shadow-lg">
            <div className="mb-2 px-2">
                <Typography.Text strong>Notifications</Typography.Text>
            </div>
            {items.length === 0 ? (
                <Empty description="No unread notifications." image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
                <List
                    dataSource={items}
                    renderItem={(n) => (
                        <List.Item
                            actions={[
                                <Button
                                    key="ack"
                                    size="small"
                                    type="text"
                                    icon={<CheckOutlined />}
                                    onClick={() => ack(n.id)}
                                >
                                    Mark read
                                </Button>,
                            ]}
                        >
                            <List.Item.Meta
                                title={
                                    <span className="text-sm">
                                        {(n.data.message as string) ?? n.type}
                                    </span>
                                }
                                description={
                                    <span className="text-xs text-gray-500">
                                        {new Date(n.created_at).toLocaleString()}
                                    </span>
                                }
                            />
                        </List.Item>
                    )}
                />
            )}
        </div>
    );

    return (
        <Dropdown
            open={open}
            onOpenChange={setOpen}
            trigger={['click']}
            placement="bottomRight"
            dropdownRender={() => dropdown}
        >
            <Badge count={items.length} size="small" offset={[-2, 4]}>
                <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
            </Badge>
        </Dropdown>
    );
}
