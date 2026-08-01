import { Modal as AntModal } from 'antd';
import { PropsWithChildren } from 'react';

const maxWidthToWidth: Record<string, number> = {
    sm: 400,
    md: 520,
    lg: 800,
    xl: 1000,
    '2xl': 1200,
    '3xl': 800,
};

export default function Modal({
    children,
    show = false,
    maxWidth = '2xl',
    closeable = true,
    onClose = () => {},
}: PropsWithChildren<{
    show: boolean;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
    closeable?: boolean;
    onClose: CallableFunction;
}>) {
    return (
        <AntModal
            open={show}
            onCancel={() => closeable && onClose()}
            footer={null}
            title={null}
            width={maxWidthToWidth[maxWidth]}
            maskClosable={closeable}
            closable={closeable}
            destroyOnClose
        >
            {children}
        </AntModal>
    );
}
