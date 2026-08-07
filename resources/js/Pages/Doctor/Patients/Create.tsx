import DoctorLayout from '@/Layouts/DoctorLayout';
import FlashMessage from '@/Components/Common/FlashMessage';
import PatientForm from '@/Components/Patient/PatientForm';
import { Head } from '@inertiajs/react';
import { Typography } from 'antd';

export default function Create() {
    return (
        <DoctorLayout>
            <Head title="Register Patient" />
            <FlashMessage />

            <Typography.Title level={4} className="!mb-4">
                Register New Patient
            </Typography.Title>

            <PatientForm submitUrl="/doctor/patients" cancelUrl="/doctor/patients" />
        </DoctorLayout>
    );
}
