import { LabelHTMLAttributes } from 'react';

export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}: LabelHTMLAttributes<HTMLLabelElement> & { value?: string }) {
    return (
        <label
            {...props}
            className={`inline-block mb-1 text-sm font-medium ${className}`}
            style={{ color: 'rgba(0,0,0,0.88)' }}
        >
            {value ?? children}
        </label>
    );
}
