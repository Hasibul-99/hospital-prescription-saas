import { Chamber, ChamberScheduleDay, ChamberShareModel, User } from '@/types';
import { router } from '@inertiajs/react';
import {
    Alert,
    App as AntApp,
    Button,
    Card,
    Col,
    Form,
    Input,
    InputNumber,
    Row,
    Select,
    Space,
    Switch,
    TimePicker,
    Typography,
} from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';
import { useCurrency } from '@/utils/currency';

interface Props {
    doctors: Pick<User, 'id' | 'name'>[];
    submitUrl: string;
    method: 'post' | 'put';
    initial?: Chamber;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const TIME_FORMAT = 'HH:mm';

type Schedule = Record<string, ChamberScheduleDay>;

const SHARE_MODELS: { value: ChamberShareModel; label: string; hint: string }[] = [
    { value: 'full', label: 'Full — doctor keeps 100%', hint: 'The hospital takes no cut of this chamber’s consultation fees.' },
    { value: 'split', label: 'Split — % to doctor, rest to hospital', hint: 'Set the doctor’s percentage; the remainder goes to the hospital.' },
    { value: 'rent', label: 'Rent — doctor pays flat monthly rent', hint: 'The doctor keeps all fees and pays the hospital a fixed monthly amount.' },
];

/** "HH:mm" ⇄ dayjs, so the stored shape stays a plain string. */
function toTime(value: string): Dayjs | null {
    return value ? dayjs(value, TIME_FORMAT) : null;
}

export default function ChamberForm({ doctors, submitUrl, method, initial }: Props) {
    const currency = useCurrency();
    const { message } = AntApp.useApp();
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);

    // The weekly schedule is a nested object rather than a flat field, so it is
    // kept in local state and merged in on submit instead of fighting antd's
    // nested-name handling for seven rows of paired times.
    const [schedule, setSchedule] = useState<Schedule>(() =>
        DAYS.reduce<Schedule>((acc, day) => {
            acc[day] = initial?.schedule?.[day] ?? { start: '', end: '', active: false };
            return acc;
        }, {}),
    );

    const shareModel = Form.useWatch<ChamberShareModel>('share_model', form) ?? 'full';

    const initialValues = {
        doctor_id: initial?.doctor_id ?? doctors[0]?.id,
        name: initial?.name ?? '',
        room_number: initial?.room_number ?? '',
        floor: initial?.floor ?? '',
        building: initial?.building ?? '',
        is_active: initial?.is_active ?? true,
        daily_slot_cap: initial?.daily_slot_cap ?? null,
        share_model: initial?.share_model ?? 'full',
        share_percent_doctor: initial?.share_percent_doctor != null ? Number(initial.share_percent_doctor) : null,
        rent_amount_monthly: initial?.rent_amount_monthly != null ? Number(initial.rent_amount_monthly) : null,
        share_notes: initial?.share_notes ?? '',
    };

    function updateDay(day: string, patch: Partial<ChamberScheduleDay>) {
        setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
    }

    function submit(values: Record<string, unknown>) {
        setSaving(true);

        const payload = {
            ...values,
            schedule,
            // The unused settlement field is cleared so a chamber switched from
            // split to rent does not keep a stale percentage on record.
            share_percent_doctor: values.share_model === 'split' ? values.share_percent_doctor : null,
            rent_amount_monthly: values.share_model === 'rent' ? values.rent_amount_monthly : null,
        };

        const options = {
            onError: () => message.error('Please fix the highlighted fields.'),
            onFinish: () => setSaving(false),
        };

        if (method === 'put') {
            router.put(submitUrl, payload as never, options);
        } else {
            router.post(submitUrl, payload as never, options);
        }
    }

    const activeDays = DAYS.filter((d) => schedule[d].active);
    const incompleteDays = activeDays.filter((d) => !schedule[d].start || !schedule[d].end);

    return (
        <Form
            form={form}
            layout="vertical"
            initialValues={initialValues}
            onFinish={submit}
            style={{ maxWidth: 860 }}
            requiredMark
        >
            <Card title="Chamber details" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item name="doctor_id" label="Doctor" rules={[{ required: true, message: 'Pick a doctor' }]}>
                            <Select
                                showSearch={{ optionFilterProp: 'label' }}
                                placeholder="Select a doctor"
                                options={doctors.map((d) => ({ value: d.id, label: d.name }))}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item name="name" label="Chamber name" rules={[{ required: true, message: 'Name is required' }]}>
                            <Input maxLength={100} placeholder="e.g. Chamber 1" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item name="room_number" label="Room">
                            <Input maxLength={50} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item name="floor" label="Floor">
                            <Input maxLength={50} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item name="building" label="Building">
                            <Input maxLength={100} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="daily_slot_cap"
                            label="Daily slot cap"
                            tooltip="Maximum appointments bookable per day. Leave blank for no cap."
                        >
                            <InputNumber min={1} max={500} style={{ width: '100%' }} placeholder="No cap" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="is_active"
                            label="Active"
                            valuePropName="checked"
                            tooltip="Inactive chambers cannot be booked."
                        >
                            <Switch />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            <Card
                title="Weekly schedule"
                style={{ marginBottom: 16 }}
                extra={
                    <Typography.Text type="secondary" className="text-xs">
                        {activeDays.length === 0 ? 'No days open' : `${activeDays.length} day${activeDays.length > 1 ? 's' : ''} open`}
                    </Typography.Text>
                }
            >
                {incompleteDays.length > 0 && (
                    <Alert
                        type="warning"
                        showIcon
                        className="mb-3"
                        title={`Set both a start and end time for: ${incompleteDays.join(', ')}.`}
                    />
                )}

                <div className="divide-y divide-gray-100 rounded-md border border-gray-200">
                    {DAYS.map((day) => {
                        const row = schedule[day];
                        return (
                            <div key={day} className="flex flex-wrap items-center gap-3 px-3 py-2">
                                <div className="flex w-28 flex-none items-center gap-2">
                                    <Switch
                                        size="small"
                                        checked={row.active}
                                        onChange={(active) => updateDay(day, { active })}
                                    />
                                    <span className={row.active ? 'text-sm font-medium text-gray-800' : 'text-sm text-gray-400'}>
                                        {day}
                                    </span>
                                </div>

                                <TimePicker
                                    format={TIME_FORMAT}
                                    minuteStep={5}
                                    disabled={!row.active}
                                    value={toTime(row.start)}
                                    onChange={(t) => updateDay(day, { start: t ? t.format(TIME_FORMAT) : '' })}
                                    placeholder="Start"
                                    style={{ width: 120 }}
                                />
                                <span className="text-gray-400">–</span>
                                <TimePicker
                                    format={TIME_FORMAT}
                                    minuteStep={5}
                                    disabled={!row.active}
                                    value={toTime(row.end)}
                                    onChange={(t) => updateDay(day, { end: t ? t.format(TIME_FORMAT) : '' })}
                                    placeholder="End"
                                    style={{ width: 120 }}
                                />

                                {row.active && !!row.start && !!row.end && (
                                    <Typography.Text type="secondary" className="text-xs">
                                        {row.start} – {row.end}
                                    </Typography.Text>
                                )}
                            </div>
                        );
                    })}
                </div>
            </Card>

            <Card title="Settlement" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item name="share_model" label="Share model">
                            <Select options={SHARE_MODELS.map(({ value, label }) => ({ value, label }))} />
                        </Form.Item>
                    </Col>

                    {shareModel === 'split' && (
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="share_percent_doctor"
                                label="Doctor share (%)"
                                rules={[{ required: true, message: 'Enter the doctor’s percentage' }]}
                            >
                                <InputNumber min={0} max={100} step={0.5} style={{ width: '100%' }} placeholder="e.g. 60" />
                            </Form.Item>
                        </Col>
                    )}

                    {shareModel === 'rent' && (
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="rent_amount_monthly"
                                label={`Monthly rent (${currency.symbol})`}
                                rules={[{ required: true, message: 'Enter the monthly rent' }]}
                            >
                                <InputNumber min={0} step={100} style={{ width: '100%' }} placeholder="e.g. 15000" />
                            </Form.Item>
                        </Col>
                    )}

                    <Col xs={24}>
                        <Typography.Text type="secondary" className="text-xs">
                            {SHARE_MODELS.find((m) => m.value === shareModel)?.hint}
                        </Typography.Text>
                    </Col>

                    <Col xs={24} className="mt-4">
                        <Form.Item
                            name="share_notes"
                            label="Notes"
                            tooltip="Visible only to hospital admins — never shown to the doctor or on a prescription."
                        >
                            <Input maxLength={255} placeholder="Optional" />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            <Space>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                    {method === 'put' ? 'Update chamber' : 'Create chamber'}
                </Button>
                <Button onClick={() => router.visit('/hospital/chambers')}>Cancel</Button>
            </Space>
        </Form>
    );
}
