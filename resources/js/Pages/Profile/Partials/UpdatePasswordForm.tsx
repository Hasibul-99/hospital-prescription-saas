import { useForm } from '@inertiajs/react';
import { App as AntApp, Button, Card, Form, Input, Progress, Typography } from 'antd';
import type { InputRef } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { FormEventHandler, useMemo, useRef } from 'react';

/**
 * Rough client-side strength hint. Advisory only — the server enforces the
 * actual rule (Laravel's Password::defaults()), and this never blocks submit.
 */
function scorePassword(value: string): { percent: number; label: string; status: 'exception' | 'normal' | 'success' } {
    if (!value) return { percent: 0, label: '', status: 'normal' };

    let score = 0;
    if (value.length >= 8) score += 1;
    if (value.length >= 12) score += 1;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;

    if (score <= 2) return { percent: 33, label: 'Weak', status: 'exception' };
    if (score <= 3) return { percent: 66, label: 'Fair', status: 'normal' };
    return { percent: 100, label: 'Strong', status: 'success' };
}

export default function UpdatePasswordForm() {
    const { message } = AntApp.useApp();
    const passwordInput = useRef<InputRef>(null);
    const currentPasswordInput = useRef<InputRef>(null);

    const { data, setData, errors, put, reset, processing } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const strength = useMemo(() => scorePassword(data.password), [data.password]);
    const mismatch =
        data.password_confirmation.length > 0 && data.password !== data.password_confirmation;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                message.success('Password updated.');
            },
            onError: (formErrors) => {
                // Clear whichever field was rejected and put the cursor back in
                // it, so a failed attempt does not leave a stale value behind.
                if (formErrors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }
                if (formErrors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <Card
            title="Password"
            extra={
                <Typography.Text type="secondary" className="text-xs">
                    Signs other devices out of nothing — only this password changes
                </Typography.Text>
            }
        >
            <form onSubmit={submit}>
                <Form.Item
                    label="Current password"
                    required
                    layout="vertical"
                    validateStatus={errors.current_password ? 'error' : undefined}
                    help={errors.current_password}
                >
                    <Input.Password
                        ref={currentPasswordInput}
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        autoComplete="current-password"
                        prefix={<LockOutlined className="text-gray-400" />}
                    />
                </Form.Item>

                <Form.Item
                    label="New password"
                    required
                    layout="vertical"
                    validateStatus={errors.password ? 'error' : undefined}
                    help={errors.password}
                    className="!mb-2"
                >
                    <Input.Password
                        ref={passwordInput}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoComplete="new-password"
                        prefix={<LockOutlined className="text-gray-400" />}
                    />
                </Form.Item>

                {data.password && (
                    <div className="mb-4 flex items-center gap-3">
                        <Progress
                            percent={strength.percent}
                            status={strength.status}
                            showInfo={false}
                            size="small"
                            className="!mb-0 max-w-[200px]"
                        />
                        <Typography.Text type="secondary" className="text-xs">
                            {strength.label}
                        </Typography.Text>
                    </div>
                )}

                <Form.Item
                    label="Confirm new password"
                    required
                    layout="vertical"
                    validateStatus={mismatch || errors.password_confirmation ? 'error' : undefined}
                    help={mismatch ? 'Passwords do not match.' : errors.password_confirmation}
                >
                    <Input.Password
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        autoComplete="new-password"
                        prefix={<LockOutlined className="text-gray-400" />}
                    />
                </Form.Item>

                <Button
                    type="primary"
                    htmlType="submit"
                    loading={processing}
                    disabled={!data.current_password || !data.password || mismatch}
                >
                    Update password
                </Button>
            </form>
        </Card>
    );
}
