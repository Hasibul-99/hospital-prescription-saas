import AdminLayout from '@/Layouts/AdminLayout';
import FlashMessage from '@/Components/FlashMessage';
import { Head, router } from '@inertiajs/react';
import { CurrencyConfig, PageProps, Plan } from '@/types';
import {
    Button,
    Card,
    Checkbox,
    Form,
    Input,
    InputNumber,
    Space,
    Switch,
    Tooltip,
    Typography,
    App as AntApp,
} from 'antd';
import { DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { formatMoney } from '@/utils/currency';

type Props = PageProps<{
    plan: Plan | null;
    currency: CurrencyConfig;
    nextSortOrder: number;
}>;

/** The three limits that treat NULL as "unlimited" rather than zero. */
const LIMIT_FIELDS = ['max_doctors', 'max_patients_per_month', 'max_prescriptions'] as const;
type LimitField = (typeof LIMIT_FIELDS)[number];

export default function AdminPlanForm({ plan, currency, nextSortOrder }: Props) {
    const { message } = AntApp.useApp();
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);

    // A limit is "unlimited" exactly when it is null. Track it as checkbox state
    // so the number input can be cleared and disabled together.
    const [unlimited, setUnlimited] = useState<Record<LimitField, boolean>>({
        max_doctors: plan ? plan.max_doctors === null : false,
        max_patients_per_month: plan ? plan.max_patients_per_month === null : false,
        max_prescriptions: plan ? plan.max_prescriptions === null : true,
    });

    const initial = useMemo(
        () =>
            plan ?? {
                code: '',
                name: '',
                name_bn: '',
                tagline: '',
                tagline_bn: '',
                price_monthly: 0,
                price_yearly: null,
                max_doctors: 5,
                max_patients_per_month: 500,
                max_prescriptions: null,
                trial_days: 30,
                features: [{ en: '', bn: '' }],
                cta_label: 'Start free trial',
                cta_label_bn: '',
                is_public: true,
                is_featured: false,
                is_active: true,
                sort_order: nextSortOrder,
            },
        [plan, nextSortOrder],
    );

    const monthly = Form.useWatch('price_monthly', form);
    const yearly = Form.useWatch('price_yearly', form);

    // Mirrors Plan::yearlyDiscountPercent() so the admin sees the saving as typed.
    const discount = useMemo(() => {
        const m = Number(monthly ?? 0);
        const y = yearly == null || yearly === '' ? null : Number(yearly);
        if (y === null || m <= 0 || y >= m * 12) return null;
        return Math.round(((m * 12 - y) / (m * 12)) * 100);
    }, [monthly, yearly]);

    function toggleUnlimited(field: LimitField, checked: boolean) {
        setUnlimited((prev) => ({ ...prev, [field]: checked }));
        if (checked) {
            form.setFieldValue(field, null);
        }
    }

    function save() {
        form.validateFields().then((values) => {
            setSaving(true);

            // Blank the limits the admin marked unlimited — the server reads
            // NULL as "no cap", so an empty string would be a validation error.
            LIMIT_FIELDS.forEach((field) => {
                if (unlimited[field]) values[field] = null;
            });
            if (values.price_yearly === '' || values.price_yearly === undefined) {
                values.price_yearly = null;
            }

            const onError = (errors: Record<string, string>) => {
                setSaving(false);
                // Surface Laravel's messages on the matching fields, including
                // nested feature rows (`features.0.en` -> ['features', 0, 'en']).
                form.setFields(
                    Object.entries(errors).map(([key, error]) => ({
                        name: key.split('.').map((part) => (/^\d+$/.test(part) ? Number(part) : part)),
                        errors: [error],
                    })),
                );
                message.error('Please fix the highlighted fields.');
            };

            if (plan) {
                router.put(`/admin/plans/${plan.id}`, values, { onError });
            } else {
                router.post('/admin/plans', values, { onError });
            }
        });
    }

    return (
        <AdminLayout>
            <Head title={plan ? `Edit ${plan.name}` : 'New Plan'} />
            <FlashMessage />

            <div className="mb-4 flex items-center justify-between">
                <Typography.Title level={4} className="!mb-0">
                    {plan ? `Edit Plan — ${plan.name}` : 'New Plan'}
                </Typography.Title>
                <Space>
                    <Button onClick={() => router.visit('/admin/plans')}>Cancel</Button>
                    <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={save}>
                        Save
                    </Button>
                </Space>
            </div>

            <Form layout="vertical" form={form} initialValues={initial} className="flex flex-col gap-4">
                <Card title="Identity" size="small">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Form.Item
                            label="Code"
                            name="code"
                            tooltip={
                                plan
                                    ? 'The code is fixed after creation — seeders and reports reference it.'
                                    : 'Lowercase machine key, e.g. "starter". Cannot be changed later.'
                            }
                            rules={plan ? [] : [{ required: true, message: 'Code required' }]}
                        >
                            <Input maxLength={50} disabled={!!plan} placeholder="starter" />
                        </Form.Item>

                        <Form.Item label="Sort order" name="sort_order" tooltip="Lower numbers appear first on the pricing page.">
                            <InputNumber min={0} max={9999} style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item label="Name (English)" name="name" rules={[{ required: true, message: 'Name required' }]}>
                            <Input maxLength={100} placeholder="Starter" />
                        </Form.Item>

                        <Form.Item label="Name (Bangla)" name="name_bn">
                            <Input maxLength={100} placeholder="স্টার্টার" />
                        </Form.Item>

                        <Form.Item label="Tagline (English)" name="tagline">
                            <Input maxLength={255} placeholder="For single-doctor chambers." />
                        </Form.Item>

                        <Form.Item label="Tagline (Bangla)" name="tagline_bn">
                            <Input maxLength={255} />
                        </Form.Item>
                    </div>
                </Card>

                <Card
                    title="Pricing"
                    size="small"
                    extra={
                        <Typography.Text type="secondary" className="text-xs">
                            Platform currency: {currency.code} ({currency.symbol})
                        </Typography.Text>
                    }
                >
                    <div className="grid gap-4 md:grid-cols-3">
                        <Form.Item
                            label={`Monthly price (${currency.code})`}
                            name="price_monthly"
                            rules={[{ required: true, message: 'Monthly price required' }]}
                        >
                            <InputNumber min={0} step={100} style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item
                            label={`Yearly price (${currency.code})`}
                            name="price_yearly"
                            tooltip="Leave blank to offer this plan monthly only."
                        >
                            <InputNumber min={0} step={100} style={{ width: '100%' }} placeholder="Optional" />
                        </Form.Item>

                        <Form.Item label="Trial days" name="trial_days" tooltip="Applied when a hospital is first put on this plan. 0 = no trial.">
                            <InputNumber min={0} max={365} style={{ width: '100%' }} />
                        </Form.Item>
                    </div>

                    <Typography.Text type="secondary" className="text-xs">
                        {discount !== null
                            ? `Yearly saves ${discount}% versus 12 × ${formatMoney(monthly, currency)}.`
                            : 'Set a yearly price below 12× the monthly price to show a discount badge on the landing page.'}
                    </Typography.Text>
                </Card>

                <Card title="Limits" size="small">
                    <Typography.Paragraph type="secondary" className="!mb-4 text-xs">
                        These are the plan's limits. A hospital can be given a per-hospital override on its own
                        edit page for a special deal; without one it follows the plan.
                    </Typography.Paragraph>

                    <div className="grid gap-4 md:grid-cols-3">
                        {(
                            [
                                ['max_doctors', 'Max doctors', 'Blocks adding or reactivating doctors past this count.'],
                                ['max_patients_per_month', 'Max patients / month', 'Advisory limit shown to the hospital.'],
                                ['max_prescriptions', 'Prescription cap (total)', 'Hard block on new prescriptions. Set unlimited for paid plans.'],
                            ] as [LimitField, string, string][]
                        ).map(([field, label, help]) => (
                            <div key={field}>
                                <Form.Item label={label} name={field} tooltip={help} className="!mb-1">
                                    <InputNumber min={1} style={{ width: '100%' }} disabled={unlimited[field]} placeholder={unlimited[field] ? 'Unlimited' : undefined} />
                                </Form.Item>
                                <Checkbox
                                    checked={unlimited[field]}
                                    onChange={(e) => toggleUnlimited(field, e.target.checked)}
                                >
                                    <span className="text-xs">Unlimited</span>
                                </Checkbox>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card title="Landing page" size="small">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Form.Item label="Button label (English)" name="cta_label">
                            <Input maxLength={50} placeholder="Start free trial" />
                        </Form.Item>
                        <Form.Item label="Button label (Bangla)" name="cta_label_bn">
                            <Input maxLength={50} />
                        </Form.Item>
                    </div>

                    <Typography.Text strong className="mb-2 block text-sm">
                        Feature bullets
                    </Typography.Text>

                    <Form.List name="features">
                        {(fields, { add, remove }) => (
                            <div className="flex flex-col gap-2">
                                {fields.map((field) => (
                                    <Space key={field.key} align="baseline" className="w-full">
                                        <Form.Item
                                            {...field}
                                            name={[field.name, 'en']}
                                            className="!mb-0"
                                            rules={[{ required: true, message: 'English text required' }]}
                                        >
                                            <Input placeholder="Up to 5 doctors" style={{ width: 320 }} maxLength={150} />
                                        </Form.Item>
                                        <Form.Item {...field} name={[field.name, 'bn']} className="!mb-0">
                                            <Input placeholder="৫ জন ডাক্তার পর্যন্ত" style={{ width: 320 }} maxLength={150} />
                                        </Form.Item>
                                        <Tooltip title="Remove bullet">
                                            <Button danger type="text" icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                                        </Tooltip>
                                    </Space>
                                ))}
                                <div>
                                    <Button
                                        type="dashed"
                                        icon={<PlusOutlined />}
                                        onClick={() => add({ en: '', bn: '' })}
                                        disabled={fields.length >= 20}
                                    >
                                        Add bullet
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Form.List>
                </Card>

                <Card title="Visibility" size="small">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Form.Item
                            label="Show on pricing page"
                            name="is_public"
                            valuePropName="checked"
                            tooltip="Hidden plans can still be assigned by you — they just don't appear publicly."
                        >
                            <Switch />
                        </Form.Item>
                        <Form.Item
                            label="Highlight as most popular"
                            name="is_featured"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>
                        <Form.Item
                            label="Active"
                            name="is_active"
                            valuePropName="checked"
                            tooltip="Inactive plans cannot be assigned to new hospitals. Hospitals already on the plan keep it."
                        >
                            <Switch />
                        </Form.Item>
                    </div>
                </Card>
            </Form>
        </AdminLayout>
    );
}
