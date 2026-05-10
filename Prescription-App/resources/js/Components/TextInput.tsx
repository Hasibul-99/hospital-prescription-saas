import { forwardRef, useRef } from 'react';
import { Input } from 'antd';
import type { InputRef } from 'antd';

interface TextInputProps {
    type?: string;
    className?: string;
    isFocused?: boolean;
    id?: string;
    name?: string;
    value?: string | number;
    defaultValue?: string | number;
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
    maxLength?: number;
    autoComplete?: string;
    required?: boolean;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
    onFocus?: React.FocusEventHandler<HTMLInputElement>;
    onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
}

export default forwardRef<InputRef, TextInputProps>(function TextInput(
    { type = 'text', className = '', isFocused = false, ...props },
    ref,
) {
    if (type === 'password') {
        return (
            <Input.Password
                ref={ref}
                className={className}
                autoFocus={isFocused}
                {...props}
            />
        );
    }

    return (
        <Input
            ref={ref}
            type={type}
            className={className}
            autoFocus={isFocused}
            {...props}
        />
    );
});
