import { MedicineInput } from '@/hooks/usePrescriptionReducer';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
    id: string;
    index: number;
    medicine: MedicineInput;
    onEdit: () => void;
    onRemove: () => void;
}

export default function MedicineRow({ id, index, medicine, onEdit, onRemove }: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const dose = buildDoseDisplay(medicine);
    const timing = medicine.custom_instruction?.trim();
    const duration = formatDuration(medicine);

    return (
        <li ref={setNodeRef} style={style} className="flex items-start gap-2 rounded border border-gray-200 bg-white p-2">
            <button
                type="button"
                {...attributes}
                {...listeners}
                className="cursor-grab select-none text-gray-400 hover:text-gray-700"
                title="Drag to reorder"
                aria-label="Drag"
            >
                ⋮⋮
            </button>
            <div className="flex-1">
                <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-800">
                        <span className="mr-1 text-gray-500">{index + 1}.</span>
                        {medicineLabel(medicine)}
                    </div>
                    <div className="flex gap-2 text-xs">
                        <button type="button" onClick={onEdit} className="text-blue-600 hover:underline">
                            edit
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (confirm('Remove this medicine?')) onRemove();
                            }}
                            className="text-red-600 hover:underline"
                        >
                            delete
                        </button>
                    </div>
                </div>
                <div className="mt-0.5 text-sm text-gray-700">
                    {dose || '—'}
                    {timing && <span className="mx-2 text-gray-400">|</span>}
                    {timing}
                    {duration && <span className="mx-2 text-gray-400">|</span>}
                    {duration}
                </div>
            </div>
        </li>
    );
}

function medicineLabel(m: MedicineInput): string {
    const abbr = abbreviate(m.medicine_type ?? '');
    return `${abbr ? abbr + '. ' : ''}${m.medicine_name}${m.strength ? ' ' + m.strength : ''}`;
}

function buildDoseDisplay(m: MedicineInput): string {
    const parts = [m.dose_morning, m.dose_noon, m.dose_afternoon, m.dose_night, m.dose_bedtime];
    if (parts.every((v) => v == null)) return '';
    return parts.map((v) => (v == null ? '0' : String(v))).join('+');
}

function formatDuration(m: MedicineInput): string {
    if (!m.duration_unit) return '';
    if (m.duration_unit === 'continue') return 'চলবে';
    if (m.duration_unit === 'N_A') return 'N/A';
    if (!m.duration_value) return '';
    return `${m.duration_value} ${m.duration_unit}`;
}

function abbreviate(type: string): string {
    const t = type.toLowerCase();
    if (t.startsWith('tab')) return 'Tab';
    if (t.startsWith('cap')) return 'Cap';
    if (t.startsWith('syr')) return 'Syr';
    if (t.startsWith('inj')) return 'Inj';
    if (t.startsWith('sup')) return 'Supp';
    if (t.startsWith('cre')) return 'Cream';
    if (t.startsWith('oin')) return 'Oint';
    if (t.startsWith('dro')) return 'Drops';
    if (t.startsWith('gel')) return 'Gel';
    if (t.startsWith('pow')) return 'Pwd';
    return type;
}
