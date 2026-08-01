import { Button } from 'antd';
import { ButtonHTMLAttributes } from 'react';

export default function SecondaryButton({
    type,
    className = '',
    disabled,
    children,
    onClick,
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <Button
            htmlType={type ?? 'submit'}
            disabled={disabled}
            onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
            className={className}
        >
            {children}
        </Button>
    );
}
