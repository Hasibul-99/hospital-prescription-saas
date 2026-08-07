import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
    Alert,
    App as AntApp,
    Avatar,
    Button,
    Card,
    DatePicker,
    Form,
    Input,
    InputNumber,
    Modal,
    Radio,
    Select,
    Space,
    Spin,
    Upload,
} from 'antd';
import type { UploadFile } from 'antd';
import { CameraOutlined, SaveOutlined, UploadOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Patient } from '@/types';

interface Props {
    patient?: Patient;
    submitUrl: string;
    method?: 'post' | 'put';
    cancelUrl: string;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

interface FormValues {
    name: string;
    date_of_birth: dayjs.Dayjs | null;
    age_years: number | null;
    age_months: number | null;
    age_days: number | null;
    gender: 'male' | 'female' | 'other';
    phone: string;
    email: string;
    address: string;
    blood_group: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    notes: string;
}

/** Split a birth date into whole years / months / days as of today. */
function ageFromDob(dob: dayjs.Dayjs): { years: number; months: number; days: number } {
    const now = dayjs();
    const years = now.diff(dob, 'year');
    const afterYears = dob.add(years, 'year');
    const months = now.diff(afterYears, 'month');
    const days = now.diff(afterYears.add(months, 'month'), 'day');

    return { years, months, days };
}

export default function PatientForm({ patient, submitUrl, method = 'post', cancelUrl }: Props) {
    const { message } = AntApp.useApp();
    const [form] = Form.useForm<FormValues>();
    const [saving, setSaving] = useState(false);

    // The photo lives outside the antd form: it is a File, not a form value,
    // and Inertia needs it on the payload verbatim to build multipart.
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(
        patient?.profile_image ? `/storage/${patient.profile_image}` : null,
    );

    const [duplicate, setDuplicate] = useState<Patient | null>(null);
    const [checkingDup, setCheckingDup] = useState(false);
    const [dupDismissed, setDupDismissed] = useState(false);
    const dupDebounce = useRef<ReturnType<typeof setTimeout>>();

    const [webcamOpen, setWebcamOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const phone = Form.useWatch('phone', form);

    // Duplicate detection on phone change — registration only; on edit the
    // patient's own number would always match.
    useEffect(() => {
        if (!phone || phone.length < 5 || patient) {
            setDuplicate(null);
            return;
        }

        if (dupDebounce.current) clearTimeout(dupDebounce.current);

        dupDebounce.current = setTimeout(async () => {
            setCheckingDup(true);
            try {
                const { data: res } = await axios.get('/api/patients/check-duplicate', {
                    params: { phone },
                });
                setDuplicate(res.exists ? res.patient : null);
                setDupDismissed(false);
            } catch {
                setDuplicate(null);
            } finally {
                setCheckingDup(false);
            }
        }, 500);

        return () => {
            if (dupDebounce.current) clearTimeout(dupDebounce.current);
        };
    }, [phone, patient]);

    const stopWebcam = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        setWebcamOpen(false);
    }, []);

    const startWebcam = useCallback(async () => {
        setWebcamOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 320, height: 240 },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch {
            setWebcamOpen(false);
            message.error('Could not access camera. Check browser permissions.');
        }
    }, [message]);

    const capturePhoto = useCallback(() => {
        if (!videoRef.current) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')!.drawImage(videoRef.current, 0, 0);

        canvas.toBlob(
            (blob) => {
                if (!blob) return;
                setPhoto(new File([blob], 'webcam-photo.jpg', { type: 'image/jpeg' }));
                setPhotoPreview(canvas.toDataURL('image/jpeg'));
            },
            'image/jpeg',
            0.85,
        );

        stopWebcam();
    }, [stopWebcam]);

    useEffect(() => stopWebcam, [stopWebcam]);

    function handleDobChange(dob: dayjs.Dayjs | null) {
        if (!dob) return;

        const { years, months, days } = ageFromDob(dob);
        form.setFieldsValue({ age_years: years, age_months: months, age_days: days });
    }

    function save() {
        form.validateFields().then((values) => {
            setSaving(true);

            const payload = {
                ...values,
                date_of_birth: values.date_of_birth ? values.date_of_birth.format('YYYY-MM-DD') : '',
                profile_image: photo,
                // PHP does not parse a multipart body on a real PUT, so an edit
                // that carries a new photo has to be POSTed with a spoofed
                // method. Sending it unconditionally keeps one code path.
                ...(method === 'put' ? { _method: 'put' } : {}),
            };

            router.post(submitUrl, payload, {
                forceFormData: true,
                onError: (errors: Record<string, string>) => {
                    setSaving(false);
                    form.setFields(
                        Object.entries(errors)
                            .filter(([name]) => name !== 'profile_image')
                            .map(([name, error]) => ({ name: name as keyof FormValues, errors: [error] })),
                    );
                    if (errors.profile_image) message.error(errors.profile_image);
                    else message.error('Please fix the highlighted fields.');
                },
            });
        });
    }

    const uploadFile: UploadFile[] = photo ? [{ uid: '-1', name: photo.name, status: 'done' }] : [];

    return (
        <Form<FormValues>
            form={form}
            layout="vertical"
            initialValues={{
                name: patient?.name ?? '',
                date_of_birth: patient?.date_of_birth ? dayjs(patient.date_of_birth) : null,
                age_years: patient?.age_years ?? null,
                age_months: patient?.age_months ?? null,
                age_days: patient?.age_days ?? null,
                gender: patient?.gender ?? 'male',
                phone: patient?.phone ?? '',
                email: patient?.email ?? '',
                address: patient?.address ?? '',
                blood_group: patient?.blood_group ?? '',
                emergency_contact_name: patient?.emergency_contact_name ?? '',
                emergency_contact_phone: patient?.emergency_contact_phone ?? '',
                notes: patient?.notes ?? '',
            }}
            onFinish={save}
            className="flex flex-col gap-4"
        >
            {duplicate && !dupDismissed && (
                <Alert
                    type="warning"
                    showIcon
                    title="This phone number is already registered"
                    description={
                        <>
                            <span>
                                Existing patient: <strong>{duplicate.name}</strong> ({duplicate.patient_uid})
                            </span>
                            <div className="mt-2">
                                <Space>
                                    <Button size="small" href={`${cancelUrl}/${duplicate.id}`}>
                                        View existing patient
                                    </Button>
                                    <Button size="small" type="text" onClick={() => setDupDismissed(true)}>
                                        Register anyway
                                    </Button>
                                </Space>
                            </div>
                        </>
                    }
                />
            )}

            <Card title="Identity" size="small">
                <div className="grid gap-4 md:grid-cols-2">
                    <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Name required' }]}>
                        <Input maxLength={255} placeholder="Full name" />
                    </Form.Item>

                    <Form.Item label="Gender" name="gender" rules={[{ required: true, message: 'Gender required' }]}>
                        <Radio.Group
                            optionType="button"
                            buttonStyle="solid"
                            options={[
                                { label: 'Male', value: 'male' },
                                { label: 'Female', value: 'female' },
                                { label: 'Other', value: 'other' },
                            ]}
                        />
                    </Form.Item>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Form.Item
                        label="Date of birth"
                        name="date_of_birth"
                        tooltip="Filling this fills the age boxes automatically."
                    >
                        <DatePicker
                            format="DD MMM YYYY"
                            style={{ width: '100%' }}
                            maxDate={dayjs().subtract(1, 'day')}
                            onChange={handleDobChange}
                        />
                    </Form.Item>
                    <Form.Item label="Years" name="age_years">
                        <InputNumber min={0} max={150} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item label="Months" name="age_months">
                        <InputNumber min={0} max={11} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item label="Days" name="age_days">
                        <InputNumber min={0} max={30} style={{ width: '100%' }} />
                    </Form.Item>
                </div>
            </Card>

            <Card title="Contact" size="small">
                <div className="grid gap-4 md:grid-cols-2">
                    <Form.Item label="Phone" name="phone" rules={[{ required: true, message: 'Phone required' }]}>
                        <Input maxLength={20} placeholder="01XXXXXXXXX" suffix={checkingDup ? <Spin size="small" /> : <span />} />
                    </Form.Item>

                    <Form.Item label="Email" name="email" rules={[{ type: 'email', message: 'Not a valid email' }]}>
                        <Input maxLength={255} placeholder="optional" />
                    </Form.Item>

                    <Form.Item label="Address" name="address">
                        <Input.TextArea rows={2} />
                    </Form.Item>

                    <Form.Item label="Blood group" name="blood_group">
                        <Select
                            allowClear
                            placeholder="Select…"
                            options={BLOOD_GROUPS.map((bg) => ({ label: bg, value: bg }))}
                        />
                    </Form.Item>

                    <Form.Item label="Emergency contact name" name="emergency_contact_name">
                        <Input maxLength={255} />
                    </Form.Item>

                    <Form.Item label="Emergency contact phone" name="emergency_contact_phone">
                        <Input maxLength={20} />
                    </Form.Item>
                </div>
            </Card>

            <Card title="Photo & notes" size="small">
                <div className="mb-4 flex flex-wrap items-center gap-4">
                    <Avatar size={64} src={photoPreview} icon={<UserOutlined />} />
                    <Space>
                        <Upload
                            accept="image/*"
                            maxCount={1}
                            fileList={uploadFile}
                            // Return false so antd keeps the File local instead of
                            // POSTing it itself — Inertia sends it with the form.
                            beforeUpload={(file) => {
                                setPhoto(file);
                                setPhotoPreview(URL.createObjectURL(file));
                                return false;
                            }}
                            onRemove={() => {
                                setPhoto(null);
                                setPhotoPreview(patient?.profile_image ? `/storage/${patient.profile_image}` : null);
                            }}
                        >
                            <Button icon={<UploadOutlined />}>Choose file</Button>
                        </Upload>
                        <Button icon={<CameraOutlined />} onClick={startWebcam}>
                            Use webcam
                        </Button>
                    </Space>
                </div>

                <Form.Item label="Notes" name="notes" className="!mb-0">
                    <Input.TextArea rows={3} />
                </Form.Item>
            </Card>

            <div className="flex justify-end">
                <Space>
                    <Button onClick={() => router.visit(cancelUrl)}>Cancel</Button>
                    <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={save}>
                        {patient ? 'Update patient' : 'Register patient'}
                    </Button>
                </Space>
            </div>

            <Modal
                open={webcamOpen}
                title="Capture photo"
                onCancel={stopWebcam}
                destroyOnHidden
                footer={[
                    <Button key="cancel" onClick={stopWebcam}>
                        Cancel
                    </Button>,
                    <Button key="capture" type="primary" icon={<CameraOutlined />} onClick={capturePhoto}>
                        Capture
                    </Button>,
                ]}
            >
                <video ref={videoRef} autoPlay playsInline muted className="w-full rounded bg-black" />
            </Modal>
        </Form>
    );
}
