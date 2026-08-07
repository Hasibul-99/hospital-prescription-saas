import HospitalLayout from '@/Layouts/HospitalLayout';
import FlashMessage from '@/Components/Common/FlashMessage';
import PatientForm from '@/Components/Patient/PatientForm';
import { Head } from '@inertiajs/react';
import { Typography } from 'antd';

export default function Create() {
    return (
        <HospitalLayout>
            <Head title="Register Patient" />
            <FlashMessage />

            <Typography.Title level={4} className="!mb-4">
                Register New Patient
            </Typography.Title>

            <PatientForm submitUrl="/hospital/patients" cancelUrl="/hospital/patients" />
        </HospitalLayout>
    );
}
