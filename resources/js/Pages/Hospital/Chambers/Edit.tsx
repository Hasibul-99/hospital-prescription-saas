import HospitalLayout from '@/Layouts/HospitalLayout';
import ChamberForm from '@/Components/ChamberForm';
import { Chamber, User } from '@/types';
import { ReactNode } from 'react';

interface Props {
    chamber: Chamber;
    doctors: Pick<User, 'id' | 'name'>[];
}

export default function Edit({ chamber, doctors }: Props) {
    return (
        <>
            <h2 className="mb-4 text-xl font-bold text-gray-800">Edit Chamber</h2>
            <ChamberForm doctors={doctors} submitUrl={`/hospital/chambers/${chamber.id}`} method="put" initial={chamber} />
        </>
    );
}

Edit.layout = (page: ReactNode) => <HospitalLayout>{page}</HospitalLayout>;
