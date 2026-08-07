import DoctorLayout from '@/Layouts/DoctorLayout';
import FlashMessage from '@/Components/Common/FlashMessage';
import PatientForm from '@/Components/Patient/PatientForm';
import { Patient } from '@/types';
import { Head } from '@inertiajs/react';
import { Typography } from 'antd';

interface Props {
    patient: Patient;
}

export default function Edit({ patient }: Props) {
    return (
        <DoctorLayout>
            <Head title={`Edit ${patient.name}`} />
            <FlashMessage />

            <Typography.Title level={4} className="!mb-4">
                Edit Patient — {patient.name}
            </Typography.Title>

            <PatientForm
                patient={patient}
                submitUrl={`/doctor/patients/${patient.id}`}
                method="put"
                cancelUrl="/doctor/patients"
            />
        </DoctorLayout>
    );
}
