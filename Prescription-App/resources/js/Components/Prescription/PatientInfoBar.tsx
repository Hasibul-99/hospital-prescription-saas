import { Patient } from '@/types';

interface Props {
    patient: Patient;
    date: string;
    onOpenPreviousRx: () => void;
}

function ageStr(p: Patient): string {
    const parts: string[] = [];
    if (p.age_years) parts.push(`${p.age_years} Y`);
    if (p.age_months) parts.push(`${p.age_months} M`);
    if (p.age_days) parts.push(`${p.age_days} D`);
    return parts.join(' ') || 'N/A';
}

export default function PatientInfoBar({ patient, date, onOpenPreviousRx }: Props) {
    return (
        <div className="sticky top-12 z-20 border-b bg-white px-4 py-2 shadow-sm">
            <div className="flex flex-wrap items-center gap-4 text-sm">
                <div>
                    <span className="text-xs text-gray-500">Name:</span>{' '}
                    <span className="font-medium text-gray-800">{patient.name}</span>
                </div>
                <div>
                    <span className="text-xs text-gray-500">Age:</span>{' '}
                    <span className="font-medium">{ageStr(patient)}</span>
                </div>
                <div>
                    <span className="text-xs text-gray-500">Gender:</span>{' '}
                    <span className="font-medium">{patient.gender}</span>
                </div>
                <div>
                    <span className="text-xs text-gray-500">Date:</span>{' '}
                    <span className="font-medium">{date}</span>
                </div>
                <div>
                    <span className="text-xs text-gray-500">ID:</span>{' '}
                    <span className="font-mono text-xs">{patient.patient_uid}</span>
                </div>
                <button
                    onClick={onOpenPreviousRx}
                    className="ml-auto rounded bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200"
                >
                    Previous Prescriptions
                </button>
            </div>
        </div>
    );
}
