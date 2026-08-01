import HospitalLayout from '@/Layouts/HospitalLayout';
import PatientForm from '@/Components/PatientForm';
import { Patient } from '@/types';
import { ReactNode } from 'react';

interface Props {
    patient: Patient;
}

export default function Edit({ patient }: Props) {
    return (
        <>
            <h2 className="mb-6 text-xl font-bold text-gray-800">Edit Patient: {patient.name}</h2>
            <div className="rounded-lg bg-white p-6 shadow">
                <PatientForm patient={patient} submitUrl={`/hospital/patients/${patient.id}`} method="put" cancelUrl="/hospital/patients" />
            </div>
        </>
    );
}

Edit.layout = (page: ReactNode) => <HospitalLayout>{page}</HospitalLayout>;
