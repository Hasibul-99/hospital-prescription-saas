import HospitalLayout from '@/Layouts/HospitalLayout';
import FlashMessage from '@/Components/FlashMessage';
import HolidayForm from '@/Components/HolidayForm';
import { HospitalHoliday } from '@/types';
import { Head } from '@inertiajs/react';
import { Typography } from 'antd';

interface Props {
    holiday: HospitalHoliday;
}

export default function Edit({ holiday }: Props) {
    return (
        <HospitalLayout>
            <Head title={`Edit ${holiday.title}`} />
            <FlashMessage />

            <Typography.Title level={4} className="!mb-4">
                Edit Holiday
            </Typography.Title>

            <HolidayForm
                submitUrl={`/hospital/holidays/${holiday.id}`}
                method="put"
                initial={holiday}
            />
        </HospitalLayout>
    );
}
