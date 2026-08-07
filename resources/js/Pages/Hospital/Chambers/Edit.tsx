import HospitalLayout from '@/Layouts/HospitalLayout';
import FlashMessage from '@/Components/FlashMessage';
import ChamberForm from '@/Components/ChamberForm';
import { Chamber, PageProps, User } from '@/types';
import { Head } from '@inertiajs/react';
import { Typography } from 'antd';
import { ReactNode } from 'react';

type Props = PageProps<{
    chamber: Chamber;
    doctors: Pick<User, 'id' | 'name'>[];
}>;

export default function Edit({ chamber, doctors }: Props) {
    return (
        <>
            <Head title={`Edit — ${chamber.name}`} />
            <FlashMessage />

            <Typography.Title level={4} style={{ marginBottom: 16 }}>
                Edit Chamber
            </Typography.Title>

            <ChamberForm
                doctors={doctors}
                submitUrl={`/hospital/chambers/${chamber.id}`}
                method="put"
                initial={chamber}
            />
        </>
    );
}

Edit.layout = (page: ReactNode) => <HospitalLayout>{page}</HospitalLayout>;
