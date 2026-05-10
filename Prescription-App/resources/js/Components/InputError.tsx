import { Typography } from 'antd';
import { HTMLAttributes } from 'react';

export default function InputError({
    message,
    className = '',
}: HTMLAttributes<HTMLParagraphElement> & { message?: string }) {
    if (!message) return null;

    return (
        <div className={`mt-1 ${className}`}>
            <Typography.Text type="danger" style={{ fontSize: 13 }}>
                {message}
            </Typography.Text>
        </div>
    );
}
