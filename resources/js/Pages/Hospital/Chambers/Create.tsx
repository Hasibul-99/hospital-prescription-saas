import HospitalLayout from '@/Layouts/HospitalLayout';
import ChamberForm from '@/Components/ChamberForm';
import { User } from '@/types';
import { ReactNode } from 'react';

interface Props {
    doctors: Pick<User, 'id' | 'name'>[];
}

export default function Create({ doctors }: Props) {
    return (
        <>
            <h2 className="mb-4 text-xl font-bold text-gray-800">New Chamber</h2>
            <ChamberForm doctors={doctors} submitUrl="/hospital/chambers" method="post" />
        </>
    );
}

Create.layout = (page: ReactNode) => <HospitalLayout>{page}</HospitalLayout>;
