import DoctorLayout from '@/Layouts/DoctorLayout';
import PatientForm from '@/Components/PatientForm';
import { ReactNode } from 'react';

export default function Create() {
    return (
        <>
            <h2 className="mb-6 text-xl font-bold text-gray-800">Register New Patient</h2>
            <div className="rounded-lg bg-white p-6 shadow">
                <PatientForm
                    submitUrl="/doctor/patients"
                    cancelUrl="/doctor/patients"
                />
            </div>
        </>
    );
}

Create.layout = (page: ReactNode) => <DoctorLayout>{page}</DoctorLayout>;
