import { Prescription } from '@/types';
import Modal from '@/Components/Modal';

interface Props {
    show: boolean;
    onClose: () => void;
    prescriptions: Prescription[];
}

export default function PreviousRxDrawer({ show, onClose, prescriptions }: Props) {
    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <div className="p-5">
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">Previous Prescriptions</h3>
                    <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">
                        Close
                    </button>
                </div>

                {prescriptions.length === 0 ? (
                    <p className="text-sm text-gray-500">No previous prescriptions at this hospital.</p>
                ) : (
                    <ul className="max-h-[60vh] divide-y overflow-y-auto">
                        {prescriptions.map((rx) => (
                            <li key={rx.id} className="py-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium text-gray-800">{rx.date}</div>
                                        <div className="text-xs text-gray-500">
                                            {rx.prescription_uid} · Dr. {rx.doctor?.name}
                                        </div>
                                    </div>
                                    <a
                                        href={`/doctor/prescriptions/${rx.id}/edit`}
                                        className="text-xs text-blue-600 hover:underline"
                                    >
                                        Open
                                    </a>
                                </div>
                                {rx.complaints && rx.complaints.length > 0 && (
                                    <div className="mt-1 text-xs text-gray-600">
                                        <strong>Complaints:</strong>{' '}
                                        {rx.complaints.map((c) => c.complaint_name).join(', ')}
                                    </div>
                                )}
                                {rx.medicines && rx.medicines.length > 0 && (
                                    <div className="mt-1 text-xs text-gray-600">
                                        <strong>Medicines:</strong>{' '}
                                        {rx.medicines.map((m) => m.medicine_name).join(', ')}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </Modal>
    );
}
