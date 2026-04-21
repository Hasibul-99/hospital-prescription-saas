import { AdditionalDose, MedicineInput } from '@/hooks/usePrescriptionReducer';
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
    const timing = medicine.custom_instruction?.trim() || timingLabel(medicine.timing);
    const duration = formatDuration(medicine.duration_value, medicine.duration_unit);

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
                {(medicine.additional_doses ?? []).map((ad, i) => (
                    <div key={i} className="mt-0.5 pl-4 text-sm text-gray-600">
                        <span className="text-gray-500">এবং,</span>{' '}
                        {buildAdditionalDoseDisplay(ad) || '—'}
                        {ad.custom_instruction?.trim() && (
                            <>
                                <span className="mx-2 text-gray-400">|</span>
                                {ad.custom_instruction}
                            </>
                        )}
                        {formatDuration(ad.duration_value, ad.duration_unit) && (
                            <>
                                <span className="mx-2 text-gray-400">|</span>
                                {formatDuration(ad.duration_value, ad.duration_unit)}
                            </>
                        )}
                    </div>
                ))}
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

function buildAdditionalDoseDisplay(ad: AdditionalDose): string {
    const parts = [ad.dose_morning, ad.dose_noon, ad.dose_afternoon, ad.dose_night, ad.dose_bedtime];
    if (parts.every((v) => v == null)) return '';
    return parts.map((v) => (v == null ? '0' : String(v))).join('+');
}

function formatDuration(value: number | null | undefined, unit: string | null | undefined): string {
    if (!unit) return '';
    if (unit === 'continue') return 'চলবে';
    if (unit === 'N_A') return 'N/A';
    if (!value) return '';
    return `${value} ${unit}`;
}

function timingLabel(t: string | null | undefined): string {
    switch (t) {
        case 'before_meal': return 'খাবারের আগে';
        case 'after_meal': return 'খাবারের পরে';
        case 'empty_stomach': return 'Empty stomach';
        case 'with_food': return 'খাবারের সাথে';
        default: return '';
    }
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
