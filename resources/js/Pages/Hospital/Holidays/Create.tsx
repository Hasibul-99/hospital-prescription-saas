import HospitalLayout from '@/Layouts/HospitalLayout';
import FlashMessage from '@/Components/Common/FlashMessage';
import HolidayForm from '@/Components/Scheduling/HolidayForm';
import { Head } from '@inertiajs/react';
import { Typography } from 'antd';

export default function Create() {
    return (
        <HospitalLayout>
            <Head title="New Holiday" />
            <FlashMessage />

            <Typography.Title level={4} className="!mb-4">
                New Holiday
            </Typography.Title>

            <HolidayForm submitUrl="/hospital/holidays" method="post" />
        </HospitalLayout>
    );
}
