import { HospitalHoliday } from '@/types';
import { router } from '@inertiajs/react';
import { App as AntApp, Button, Card, DatePicker, Form, Input, Space, Switch } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useState } from 'react';

interface Props {
    submitUrl: string;
    method: 'post' | 'put';
    initial?: HospitalHoliday;
}

interface FormValues {
    date: dayjs.Dayjs | null;
    title: string;
    is_recurring_yearly: boolean;
}

export default function HolidayForm({ submitUrl, method, initial }: Props) {
    const { message } = AntApp.useApp();
    const [form] = Form.useForm<FormValues>();
    const [saving, setSaving] = useState(false);

    function save() {
        form.validateFields().then((values) => {
            setSaving(true);

            const payload = {
                // The server expects a plain Y-m-d string, not the dayjs object.
                date: values.date ? values.date.format('YYYY-MM-DD') : null,
                title: values.title,
                is_recurring_yearly: !!values.is_recurring_yearly,
            };

            const onError = (errors: Record<string, string>) => {
                setSaving(false);
                form.setFields(
                    Object.entries(errors).map(([name, error]) => ({
                        name: name as keyof FormValues,
                        errors: [error],
                    })),
                );
                message.error('Please fix the highlighted fields.');
            };

            if (method === 'put') {
                router.put(submitUrl, payload, { onError });
            } else {
                router.post(submitUrl, payload, { onError });
            }
        });
    }

    return (
        <Card size="small">
            <Form<FormValues>
                form={form}
                layout="vertical"
                initialValues={{
                    date: initial?.date ? dayjs(initial.date) : null,
                    title: initial?.title ?? '',
                    is_recurring_yearly: initial?.is_recurring_yearly ?? false,
                }}
                onFinish={save}
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <Form.Item label="Date" name="date" rules={[{ required: true, message: 'Date required' }]}>
                        <DatePicker format="DD MMM YYYY" style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item label="Title" name="title" rules={[{ required: true, message: 'Title required' }]}>
                        <Input maxLength={150} placeholder="e.g., Independence Day" />
                    </Form.Item>
                </div>

                <Form.Item
                    label="Recurring yearly"
                    name="is_recurring_yearly"
                    valuePropName="checked"
                    tooltip="Repeats on the same month/day every year."
                >
                    <Switch />
                </Form.Item>

                <div className="flex justify-end">
                    <Space>
                        <Button onClick={() => router.visit('/hospital/holidays')}>Cancel</Button>
                        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={save}>
                            Save
                        </Button>
                    </Space>
                </div>
            </Form>
        </Card>
    );
}
