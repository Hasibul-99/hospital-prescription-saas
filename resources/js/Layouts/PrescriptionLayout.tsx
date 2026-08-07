import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import { PageProps } from '@/types';
import { Avatar, Button, Space, Tooltip, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

export default function PrescriptionLayout({ children }: PropsWithChildren) {
    const { auth } = usePage<PageProps>().props;
    const initials = auth.user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="grid h-screen grid-rows-[56px_1fr] overflow-hidden bg-[#f6f7f5]">
            <header className="flex items-center gap-4 border-b border-[#e3e7e3] bg-white px-4">
                <div className="flex items-center gap-2.5">
                    <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-[#0a8754] to-[#0d6e46] font-serif text-base font-bold italic text-white shadow-sm">
                        ℞
                    </span>
                    <span className="text-[15px] font-bold tracking-tight text-[#0f1a14]">Pulse Rx</span>
                    <Typography.Text type="secondary" className="!hidden text-[11px] uppercase tracking-widest sm:!inline">
                        Composer
                    </Typography.Text>
                </div>

                <Link href="/doctor/queue">
                    <Button type="text" size="small" icon={<ArrowLeftOutlined />}>
                        Queue
                    </Button>
                </Link>

                <div className="ml-auto flex items-center gap-4">
                    <Space size={12} className="!hidden lg:!flex">
                        <KbdHint k="⌘K" label="Add medicine" />
                        <KbdHint k="⌘P" label="Sign & print" />
                    </Space>

                    <span className="h-5 w-px bg-[#e3e7e3]" />

                    <div className="flex items-center gap-2">
                        <Avatar size={30} style={{ background: '#2b3a32' }}>
                            {initials}
                        </Avatar>
                        <div className="hidden text-[12.5px] leading-tight sm:block">
                            <div className="font-semibold text-[#0f1a14]">{auth.user.name}</div>
                            <div className="text-[11px] text-[#6a7a72]">Doctor</div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="min-h-0 overflow-hidden">{children}</div>
        </div>
    );
}

function KbdHint({ k, label }: { k: string; label: string }) {
    return (
        <Tooltip title={label}>
            <kbd className="rounded border border-b-2 border-[#e3e7e3] bg-[#eef0ec] px-1.5 py-0.5 font-mono text-[11px] text-[#2b3a32]">
                {k}
            </kbd>
        </Tooltip>
    );
}
