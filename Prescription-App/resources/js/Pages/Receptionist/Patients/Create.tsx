import ReceptionistLayout from '@/Layouts/ReceptionistLayout';
import PatientForm from '@/Components/PatientForm';
import { ReactNode } from 'react';

export default function Create() {
    return (
        <>
            <h2 className="mb-6 text-xl font-bold text-gray-800">Register New Patient</h2>
            <div className="rounded-lg bg-white p-6 shadow">
                <PatientForm submitUrl="/receptionist/patients" cancelUrl="/receptionist/patients" />
            </div>
        </>
    );
}

Create.layout = (page: ReactNode) => <ReceptionistLayout>{page}</ReceptionistLayout>;
