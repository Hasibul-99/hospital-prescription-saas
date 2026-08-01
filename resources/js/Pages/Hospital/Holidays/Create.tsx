import HospitalLayout from '@/Layouts/HospitalLayout';
import HolidayForm from '@/Components/HolidayForm';
import { ReactNode } from 'react';

export default function Create() {
    return (
        <>
            <h2 className="mb-4 text-xl font-bold text-gray-800">New Holiday</h2>
            <HolidayForm submitUrl="/hospital/holidays" method="post" />
        </>
    );
}

Create.layout = (page: ReactNode) => <HospitalLayout>{page}</HospitalLayout>;
