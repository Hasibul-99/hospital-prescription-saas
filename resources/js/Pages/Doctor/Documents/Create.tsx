import DoctorLayout from '@/Layouts/DoctorLayout';
import { Head, router } from '@inertiajs/react';
import { Button, Card, DatePicker, Form, Input, Select, Space, Spin, Typography } from 'antd';
import { FilePdfOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { Patient } from '@/types';

type DocType = 'fitness' | 'sick_leave' | 'referral';

interface PatientLite {
    id: number;
    patient_uid: string;
    name: string;
    gender: string | null;
    age_years: number | null;
    age_months: number | null;
    phone: string;
}

interface Props {
    type: DocType;
    patient: PatientLite | null;
}

const TITLES: Record<DocType, string> = {
    fitness: 'Medical Fitness Certificate',
    sick_leave: 'Sick-Leave Certificate',
    referral: 'Referral Letter',
};

const PLACEHOLDERS: Record<DocType, string> = {
    fitness: 'e.g., This is to certify that the above-named person is medically fit to resume duties/travel/…',
    sick_leave: 'e.g., The above-named patient is advised bed rest / medical leave due to acute febrile illness.',
    referral: 'e.g., Kindly evaluate and manage the above-named patient for further investigation of persistent chest pain.',
};

const DURATION_LABELS: Record<DocType, string> = {
    fitness: 'Validity',
    sick_leave: 'Leave duration',
    referral: 'Duration (optional)',
};

interface FormValues {
    patient_id: number | undefined;
    date: dayjs.Dayjs;
    body_text: string;
    duration_text: string;
    referred_to: string;
}

function patientLabel(p: Pick<Patient, 'name' | 'patient_uid' | 'phone'>): string {
    return `${p.name} · ${p.patient_uid} · ${p.phone}`;
}

export default function Create({ type, patient }: Props) {
    const [form] = Form.useForm<FormValues>();

    const [options, setOptions] = useState<{ value: number; label: string }[]>(
        patient ? [{ value: patient.id, label: patientLabel(patient) }] : [],
    );
    const [searching, setSearching] = useState(false);
    const debounce = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => () => debounce.current && clearTimeout(debounce.current), []);

    function searchPatients(query: string) {
        if (debounce.current) clearTimeout(debounce.current);
        if (!query) return;

        debounce.current = setTimeout(async () => {
            setSearching(true);
            try {
                const { data } = await axios.get<Patient[]>('/api/patients/search', { params: { q: query } });
                setOptions(data.map((p) => ({ value: p.id, label: patientLabel(p) })));
            } catch {
                setOptions([]);
            } finally {
                setSearching(false);
            }
        }, 300);
    }

    /**
     * The renderer streams a PDF back rather than an Inertia response, so the
     * submission goes through a throwaway form aimed at a new tab.
     */
    function generate(values: FormValues) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/doctor/documents/${type}/render`;
        form.target = '_blank';

        const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
        const put = (name: string, value: string) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value = value;
            form.appendChild(input);
        };

        put('_token', csrf);
        put('patient_id', String(values.patient_id ?? ''));
        put('date', values.date.format('YYYY-MM-DD'));
        put('body_text', values.body_text ?? '');
        put('duration_text', values.duration_text ?? '');
        put('referred_to', values.referred_to ?? '');

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    }

    return (
        <DoctorLayout>
            <Head title={TITLES[type]} />

            <Typography.Title level={4} className="!mb-4">
                {TITLES[type]}
            </Typography.Title>

            <Card size="small" className="mx-auto max-w-3xl">
                <Form<FormValues>
                    form={form}
                    layout="vertical"
                    initialValues={{
                        patient_id: patient?.id,
                        date: dayjs(),
                        body_text: '',
                        duration_text: '',
                        referred_to: '',
                    }}
                    onFinish={generate}
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <Form.Item
                            label="Patient"
                            name="patient_id"
                            rules={[{ required: true, message: 'Select a patient' }]}
                        >
                            <Select
                                showSearch
                                allowClear
                                placeholder="Search by name, phone, or UID…"
                                filterOption={false}
                                onSearch={searchPatients}
                                notFoundContent={searching ? <Spin size="small" /> : null}
                                options={options}
                            />
                        </Form.Item>

                        <Form.Item label="Date" name="date" rules={[{ required: true, message: 'Date required' }]}>
                            <DatePicker format="DD MMM YYYY" style={{ width: '100%' }} />
                        </Form.Item>
                    </div>

                    {type === 'referral' && (
                        <Form.Item label="Referred to" name="referred_to">
                            <Input maxLength={255} placeholder="e.g., Dr. Kamal Ahmed, Cardiology, Square Hospital" />
                        </Form.Item>
                    )}

                    <Form.Item
                        label={type === 'referral' ? 'Reason for referral' : 'Certificate body'}
                        name="body_text"
                        rules={[{ required: true, message: 'This text appears on the document' }]}
                    >
                        <Input.TextArea rows={6} maxLength={2000} showCount placeholder={PLACEHOLDERS[type]} />
                    </Form.Item>

                    <Form.Item label={DURATION_LABELS[type]} name="duration_text">
                        <Input maxLength={100} placeholder="e.g., 3 days, 30 Jul 2026 to 1 Aug 2026" />
                    </Form.Item>

                    <div className="flex justify-end">
                        <Space>
                            <Button onClick={() => router.visit('/doctor/dashboard')}>Cancel</Button>
                            <Button type="primary" icon={<FilePdfOutlined />} htmlType="submit">
                                Generate PDF
                            </Button>
                        </Space>
                    </div>
                </Form>
            </Card>
        </DoctorLayout>
    );
}
