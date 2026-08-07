import PatientSearch from '@/Components/Patient/PatientSearch';
import { Chamber, Patient, User } from '@/types';
import { router } from '@inertiajs/react';
import {
    Alert,
    Button,
    Checkbox,
    DatePicker,
    Form,
    Input,
    InputNumber,
    Modal,
    Segmented,
    Select,
    Space,
    Typography,
} from 'antd';
import { CalendarOutlined, UserSwitchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useCurrency } from '@/utils/currency';

interface Props {
    onClose: () => void;
    defaultDate: string;
    chambers: Chamber[];
    defaultChamberId?: number;
    doctors?: Pick<User, 'id' | 'name'>[];
    defaultDoctorId?: number;
    submitUrl: string;
    context: 'doctor' | 'receptionist';
}

type VisitType = 'new_visit' | 'follow_up' | 'emergency';

const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash' },
    { value: 'bkash', label: 'bKash' },
    { value: 'nagad', label: 'Nagad' },
    { value: 'rocket', label: 'Rocket' },
    { value: 'card', label: 'Card' },
];

/** The chosen patient, shown instead of the search box once one is picked. */
function SelectedPatient({ patient, onChange }: { patient: Patient; onChange: () => void }) {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-teal-200 bg-teal-50/60 px-3 py-2">
            <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-teal-600 text-sm font-semibold text-white">
                {patient.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-gray-900">{patient.name}</div>
                <Typography.Text type="secondary" className="text-xs">
                    {patient.patient_uid} · {patient.phone}
                </Typography.Text>
            </div>
            <Button size="small" type="text" icon={<UserSwitchOutlined />} onClick={onChange}>
                Change
            </Button>
        </div>
    );
}

export default function AppointmentModal({
    onClose,
    defaultDate,
    chambers,
    defaultChamberId,
    doctors,
    defaultDoctorId,
    submitUrl,
    context,
}: Props) {
    const currency = useCurrency();

    const [patient, setPatient] = useState<Patient | null>(null);
    const [date, setDate] = useState(defaultDate);
    const [chamberId, setChamberId] = useState<number | undefined>(defaultChamberId);
    const [doctorId, setDoctorId] = useState<number | undefined>(defaultDoctorId ?? doctors?.[0]?.id);
    const [type, setType] = useState<VisitType>('new_visit');
    const [feeAmount, setFeeAmount] = useState<number | null>(null);
    const [feePaid, setFeePaid] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const needsDoctor = context === 'receptionist' && !!doctors;

    function submit() {
        if (!patient) {
            setError('Select a patient first.');
            return;
        }
        if (needsDoctor && !doctorId) {
            setError('Select a doctor.');
            return;
        }

        setError(null);
        setSubmitting(true);

        const payload: Record<string, unknown> = {
            patient_id: patient.id,
            appointment_date: date,
            type,
            chamber_id: chamberId ?? null,
            // Blank means "use the doctor's configured consultation fee".
            fee_amount: feeAmount,
            fee_paid: feePaid,
            payment_method: feePaid ? paymentMethod : null,
            notes: notes || null,
        };

        if (needsDoctor) {
            payload.doctor_id = doctorId;
        }

        router.post(submitUrl, payload as never, {
            preserveScroll: true,
            onSuccess: () => onClose(),
            onError: (errs) => setError((Object.values(errs)[0] as string) ?? 'Could not book the appointment.'),
            onFinish: () => setSubmitting(false),
        });
    }

    return (
        <Modal
            open
            onCancel={onClose}
            title="New appointment"
            width={560}
            destroyOnHidden
            footer={
                <Space>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button
                        type="primary"
                        icon={<CalendarOutlined />}
                        loading={submitting}
                        disabled={!patient}
                        onClick={submit}
                    >
                        Book appointment
                    </Button>
                </Space>
            }
        >
            {error && (
                <Alert
                    type="error"
                    showIcon
                    className="mb-4"
                    title={error}
                    closable={{ onClose: () => setError(null) }}
                />
            )}

            <Form layout="vertical" className="!mt-2">
                <Form.Item label="Patient" required className="!mb-4">
                    {patient ? (
                        <SelectedPatient patient={patient} onChange={() => setPatient(null)} />
                    ) : (
                        <>
                            <PatientSearch onSelect={setPatient} placeholder="Search by name, phone or UID…" />
                            <Typography.Text type="secondary" className="mt-1 block text-xs">
                                Not registered yet?{' '}
                                <a href={`/${context}/patients/create`} className="text-teal-700 hover:underline">
                                    Register a new patient
                                </a>
                            </Typography.Text>
                        </>
                    )}
                </Form.Item>

                <Form.Item label="Visit type" className="!mb-4">
                    {/* Three mutually exclusive options read better as a segmented
                        control than a dropdown that hides two of them. */}
                    <Segmented
                        block
                        value={type}
                        onChange={(v) => setType(v as VisitType)}
                        options={[
                            { value: 'new_visit', label: 'New visit' },
                            { value: 'follow_up', label: 'Follow-up' },
                            { value: 'emergency', label: 'Emergency' },
                        ]}
                    />
                </Form.Item>

                <div className="grid gap-x-4 sm:grid-cols-2">
                    <Form.Item label="Date" required>
                        <DatePicker
                            className="w-full"
                            allowClear={false}
                            value={dayjs(date)}
                            minDate={dayjs().startOf('day')}
                            format="DD MMM YYYY"
                            onChange={(d) => d && setDate(d.format('YYYY-MM-DD'))}
                        />
                    </Form.Item>

                    {needsDoctor && (
                        <Form.Item label="Doctor" required>
                            <Select
                                showSearch={{ optionFilterProp: 'label' }}
                                placeholder="Select a doctor"
                                value={doctorId}
                                onChange={setDoctorId}
                                options={doctors!.map((d) => ({ value: d.id, label: d.name }))}
                            />
                        </Form.Item>
                    )}

                    {chambers.length > 0 && (
                        <Form.Item label="Chamber">
                            <Select
                                allowClear
                                placeholder="None"
                                value={chamberId}
                                onChange={setChamberId}
                                options={chambers.map((c) => ({ value: c.id, label: c.name }))}
                            />
                        </Form.Item>
                    )}

                    <Form.Item
                        label={`Fee (${currency.symbol})`}
                        tooltip="Leave blank to use the doctor's configured consultation fee."
                    >
                        <InputNumber
                            className="w-full"
                            min={0}
                            step={50}
                            value={feeAmount}
                            onChange={setFeeAmount}
                            placeholder="Auto"
                        />
                    </Form.Item>
                </div>

                <Form.Item label="Payment" className="!mb-4">
                    <Space wrap>
                        <Checkbox checked={feePaid} onChange={(e) => setFeePaid(e.target.checked)}>
                            Paid now
                        </Checkbox>
                        {feePaid && (
                            <Select
                                value={paymentMethod}
                                onChange={setPaymentMethod}
                                style={{ width: 140 }}
                                options={PAYMENT_METHODS}
                            />
                        )}
                    </Space>
                </Form.Item>

                <Form.Item label="Notes" className="!mb-0">
                    <Input.TextArea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        maxLength={500}
                        showCount
                        placeholder="Optional"
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}
