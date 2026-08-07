import { Badge, Button, Dropdown, Input, Modal, Space, Tooltip } from 'antd';
import {
    CheckOutlined,
    CloudSyncOutlined,
    DownOutlined,
    EyeOutlined,
    FileAddOutlined,
    PlusOutlined,
    SaveOutlined,
} from '@ant-design/icons';
import { useState } from 'react';

interface Props {
    saving: boolean;
    dirty: boolean;
    lastSavedAt: string | null;
    medicineCount: number;
    onSave: () => void;
    onSavePrint: () => void;
    onSaveTemplate?: (name: string) => void;
    onNewRx?: () => void;
    onAddMedicine?: () => void;
    onPreview?: () => void;
    hasSavedRx?: boolean;
}

export default function BottomBar({
    saving,
    dirty,
    lastSavedAt,
    medicineCount,
    onSave,
    onSavePrint,
    onSaveTemplate,
    onNewRx,
    onAddMedicine,
    onPreview,
    hasSavedRx,
}: Props) {
    const [tplOpen, setTplOpen] = useState(false);
    const [tplName, setTplName] = useState('');

    function commitTemplate() {
        const name = tplName.trim();
        if (!name) return;

        onSaveTemplate?.(name);
        setTplName('');
        setTplOpen(false);
    }

    const status = saving
        ? { color: '#f59e0b', text: 'Saving…' }
        : dirty
          ? { color: '#f59e0b', text: 'Unsaved changes' }
          : lastSavedAt
            ? { color: '#0a8754', text: `Saved ${lastSavedAt}` }
            : { color: '#9aa8a0', text: 'Nothing saved yet' };

    const moreItems = [
        { key: 'draft', icon: <SaveOutlined />, label: 'Save as draft', onClick: onSave },
        ...(onSaveTemplate
            ? [{ key: 'template', icon: <FileAddOutlined />, label: 'Save as template…', onClick: () => setTplOpen(true) }]
            : []),
        ...(onNewRx ? [{ type: 'divider' as const }, { key: 'new', label: 'New blank Rx', onClick: onNewRx }] : []),
    ];

    return (
        <div className="flex h-14 items-center gap-2 border-t border-[#e3e7e3] bg-white px-4">
            <Tooltip title="Drafts autosave every 30 seconds">
                <span className="flex flex-none items-center gap-1.5 text-xs" style={{ color: status.color }}>
                    <CloudSyncOutlined spin={saving} />
                    {status.text}
                </span>
            </Tooltip>

            <div className="flex-1" />

            <Space size={8}>
                {onAddMedicine && (
                    <Badge count={medicineCount} size="small" color="#0a8754" offset={[-2, 2]}>
                        <Button icon={<PlusOutlined />} onClick={onAddMedicine}>
                            Medicine
                            <span className="ml-1 hidden text-[10px] text-gray-400 sm:inline">⌘K</span>
                        </Button>
                    </Badge>
                )}

                {onPreview && (
                    <Tooltip title={hasSavedRx ? undefined : 'Save the prescription first'}>
                        <Button icon={<EyeOutlined />} onClick={onPreview} disabled={!hasSavedRx}>
                            Preview
                        </Button>
                    </Tooltip>
                )}

                <Dropdown.Button
                    type="primary"
                    loading={saving}
                    icon={<DownOutlined />}
                    menu={{ items: moreItems }}
                    onClick={onSavePrint}
                >
                    <CheckOutlined /> Sign &amp; print
                </Dropdown.Button>
            </Space>

            <Modal
                open={tplOpen}
                title="Save as template"
                okText="Save template"
                okButtonProps={{ disabled: !tplName.trim() }}
                onOk={commitTemplate}
                onCancel={() => setTplOpen(false)}
                destroyOnHidden
            >
                <p className="mb-2 text-sm text-gray-500">
                    Saves the current complaints, examinations, medicines, advices and investigations for reuse.
                </p>
                <Input
                    autoFocus
                    value={tplName}
                    onChange={(e) => setTplName(e.target.value)}
                    onPressEnter={commitTemplate}
                    placeholder="e.g., Acute tonsillitis"
                    maxLength={100}
                />
            </Modal>
        </div>
    );
}
