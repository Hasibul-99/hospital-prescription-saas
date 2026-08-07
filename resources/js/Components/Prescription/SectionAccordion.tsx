import { Badge, Button, Tooltip } from 'antd';
import { CloseOutlined, DownOutlined, PlusOutlined } from '@ant-design/icons';
import { PropsWithChildren, useState } from 'react';

interface Props {
    title: string;
    titleBn?: string;
    onAdd?: () => void;
    itemCount?: number;
    defaultOpen?: boolean;
    addLabel?: string;
    /** Present on optional sections the doctor added and can drop again. */
    onRemoveSection?: () => void;
}

export default function SectionAccordion({
    title,
    titleBn,
    onAdd,
    itemCount,
    defaultOpen = true,
    addLabel = 'Add',
    onRemoveSection,
    children,
}: PropsWithChildren<Props>) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <section className="mb-2.5 overflow-hidden rounded-lg border border-[#e3e7e3] bg-white">
            <header
                className="flex cursor-pointer select-none items-center gap-2 px-3.5 py-2.5"
                onClick={() => setOpen((o) => !o)}
            >
                <span className="text-[13.5px] font-semibold text-[#0f1a14]">{title}</span>
                {titleBn && (
                    <span
                        className="text-xs font-medium text-[#6a7a72]"
                        style={{ fontFamily: "'Noto Sans Bengali', 'Inter', sans-serif" }}
                    >
                        {titleBn}
                    </span>
                )}

                {!!itemCount && <Badge count={itemCount} color="#0a8754" size="small" />}

                <div className="ml-auto flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {onAdd && (
                        <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={onAdd}>
                            {addLabel}
                        </Button>
                    )}
                    {onRemoveSection && (
                        <Tooltip title="Remove this section">
                            <Button type="text" size="small" icon={<CloseOutlined />} onClick={onRemoveSection} />
                        </Tooltip>
                    )}
                    <DownOutlined
                        className="ml-1 cursor-pointer text-[10px] text-[#9aa8a0] transition-transform"
                        style={{ transform: open ? 'rotate(180deg)' : undefined }}
                        onClick={() => setOpen((o) => !o)}
                    />
                </div>
            </header>

            {open && <div className="border-t border-[#e3e7e3] px-3.5 py-3">{children}</div>}
        </section>
    );
}
