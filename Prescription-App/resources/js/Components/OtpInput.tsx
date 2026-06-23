import { useEffect, useRef, useState, KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react';

interface Props {
    length?: number;
    value: string;
    onChange: (code: string) => void;
    onComplete?: (code: string) => void;
    error?: boolean;
    autoFocus?: boolean;
    disabled?: boolean;
}

export default function OtpInput({
    length = 4,
    value,
    onChange,
    onComplete,
    error,
    autoFocus = true,
    disabled,
}: Props) {
    const refs = useRef<Array<HTMLInputElement | null>>([]);
    const [digits, setDigits] = useState<string[]>(() => padOrTrim(value, length));

    useEffect(() => {
        setDigits(padOrTrim(value, length));
    }, [value, length]);

    useEffect(() => {
        if (autoFocus) refs.current[0]?.focus();
    }, [autoFocus]);

    function emit(next: string[]) {
        setDigits(next);
        const code = next.join('');
        onChange(code);
        if (code.length === length && next.every((d) => d !== '')) {
            onComplete?.(code);
        }
    }

    function handleChange(i: number, e: ChangeEvent<HTMLInputElement>) {
        const raw = e.target.value.replace(/\D/g, '');
        if (!raw) {
            const next = [...digits];
            next[i] = '';
            emit(next);
            return;
        }

        // Handle paste / multi-char into a single box
        if (raw.length > 1) {
            const next = [...digits];
            for (let k = 0; k < raw.length && i + k < length; k++) {
                next[i + k] = raw[k];
            }
            emit(next);
            const nextFocus = Math.min(i + raw.length, length - 1);
            refs.current[nextFocus]?.focus();
            return;
        }

        const next = [...digits];
        next[i] = raw;
        emit(next);
        if (i < length - 1) refs.current[i + 1]?.focus();
    }

    function handleKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Backspace') {
            if (digits[i] === '' && i > 0) {
                e.preventDefault();
                const next = [...digits];
                next[i - 1] = '';
                emit(next);
                refs.current[i - 1]?.focus();
            }
        } else if (e.key === 'ArrowLeft' && i > 0) {
            e.preventDefault();
            refs.current[i - 1]?.focus();
        } else if (e.key === 'ArrowRight' && i < length - 1) {
            e.preventDefault();
            refs.current[i + 1]?.focus();
        }
    }

    function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
        if (!pasted) return;
        e.preventDefault();
        const next = Array(length).fill('');
        for (let k = 0; k < pasted.length; k++) next[k] = pasted[k];
        emit(next);
        refs.current[Math.min(pasted.length, length - 1)]?.focus();
    }

    return (
        <div className="flex gap-3 justify-center">
            {digits.map((d, i) => (
                <input
                    key={i}
                    ref={(el) => { refs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={1}
                    value={d}
                    disabled={disabled}
                    onChange={(e) => handleChange(i, e)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    onFocus={(e) => e.target.select()}
                    className={
                        'w-14 h-14 text-center text-2xl font-semibold rounded-lg bg-gray-800 text-white outline-none transition-colors border ' +
                        (error
                            ? 'border-red-500 focus:border-red-400 focus:ring-2 focus:ring-red-500/30'
                            : 'border-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30')
                    }
                />
            ))}
        </div>
    );
}

function padOrTrim(s: string, len: number): string[] {
    const cleaned = (s ?? '').replace(/\D/g, '').slice(0, len);
    return Array.from({ length: len }, (_, i) => cleaned[i] ?? '');
}
