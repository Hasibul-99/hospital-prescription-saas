import { useForm } from '@inertiajs/react';
import { Alert, Button, Card, Form, Input, Modal, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { FormEventHandler, useState } from 'react';

/**
 * Self-service account deletion.
 *
 * Requires the current password because the action is irreversible and logs the
 * user straight out — see ProfileController::destroy().
 */
export default function DeleteUserForm() {
    const [open, setOpen] = useState(false);

    const { data, setData, delete: destroy, processing, reset, errors, clearErrors } = useForm({
        password: '',
    });

    function close() {
        setOpen(false);
        clearErrors();
        reset();
    }

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => close(),
        });
    };

    return (
        <Card
            title={<span className="text-red-700">Danger zone</span>}
            styles={{ header: { borderColor: '#fecaca' } }}
            style={{ borderColor: '#fecaca' }}
        >
            <Typography.Paragraph type="secondary" className="!mb-4 text-sm">
                Deleting your account removes it permanently and signs you out immediately. Anything you
                created that belongs to the hospital — prescriptions, appointments, patient records — is kept.
            </Typography.Paragraph>

            <Button danger icon={<DeleteOutlined />} onClick={() => setOpen(true)}>
                Delete account
            </Button>

            <Modal
                open={open}
                onCancel={close}
                title="Delete your account?"
                footer={null}
                destroyOnHidden
                width={460}
            >
                <form onSubmit={submit}>
                    <Alert
                        type="error"
                        showIcon
                        className="mb-4"
                        message="This cannot be undone."
                        description="Enter your password to confirm you want to permanently delete your account."
                    />

                    <Form.Item
                        label="Password"
                        required
                        layout="vertical"
                        validateStatus={errors.password ? 'error' : undefined}
                        help={errors.password}
                    >
                        <Input.Password
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            autoComplete="current-password"
                            autoFocus
                        />
                    </Form.Item>

                    <div className="flex justify-end gap-2">
                        <Button onClick={close}>Cancel</Button>
                        <Button danger type="primary" htmlType="submit" loading={processing} disabled={!data.password}>
                            Delete account
                        </Button>
                    </div>
                </form>
            </Modal>
        </Card>
    );
}
