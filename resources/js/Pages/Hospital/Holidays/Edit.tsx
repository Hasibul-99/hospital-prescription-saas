import HospitalLayout from '@/Layouts/HospitalLayout';
import HolidayForm from '@/Components/HolidayForm';
import { HospitalHoliday } from '@/types';
import { ReactNode } from 'react';

interface Props {
    holiday: HospitalHoliday;
}

export default function Edit({ holiday }: Props) {
    return (
        <>
            <h2 className="mb-4 text-xl font-bold text-gray-800">Edit Holiday</h2>
            <HolidayForm submitUrl={`/hospital/holidays/${holiday.id}`} method="put" initial={holiday} />
        </>
    );
}

Edit.layout = (page: ReactNode) => <HospitalLayout>{page}</HospitalLayout>;
