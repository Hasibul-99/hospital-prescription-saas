import { Checkbox as AntCheckbox } from 'antd';
import { InputHTMLAttributes } from 'react';

export default function Checkbox({
    checked,
    onChange,
    name,
    id,
    className = '',
    disabled,
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <AntCheckbox
            checked={checked}
            onChange={onChange as any}
            name={name}
            id={id}
            className={className}
            disabled={disabled}
        />
    );
}
