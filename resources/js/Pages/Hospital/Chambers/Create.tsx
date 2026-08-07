import HospitalLayout from '@/Layouts/HospitalLayout';
import FlashMessage from '@/Components/Common/FlashMessage';
import ChamberForm from '@/Components/Scheduling/ChamberForm';
import { PageProps, User } from '@/types';
import { Head } from '@inertiajs/react';
import { Alert, Typography } from 'antd';
import { ReactNode } from 'react';

type Props = PageProps<{ doctors: Pick<User, 'id' | 'name'>[] }>;

export default function Create({ doctors }: Props) {
    return (
        <>
            <Head title="New Chamber" />
            <FlashMessage />

            <Typography.Title level={4} style={{ marginBottom: 16 }}>
                New Chamber
            </Typography.Title>

            {doctors.length === 0 ? (
                // A chamber belongs to a doctor, so there is nothing to create yet.
                <Alert
                    type="info"
                    showIcon
                    title="No active doctors"
                    description="Add an active doctor before creating a chamber — every chamber is assigned to one."
                    style={{ maxWidth: 860 }}
                />
            ) : (
                <ChamberForm doctors={doctors} submitUrl="/hospital/chambers" method="post" />
            )}
        </>
    );
}

Create.layout = (page: ReactNode) => <HospitalLayout>{page}</HospitalLayout>;
