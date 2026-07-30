import MedicineRow from './MedicineRow';
import { MedicineInput } from '@/hooks/usePrescriptionReducer';
import {
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface Props {
    medicines: MedicineInput[];
    onReorder: (from: number, to: number) => void;
    onEdit: (index: number) => void;
    onRemove: (index: number) => void;
}

export default function MedicineList({ medicines, onReorder, onEdit, onRemove }: Props) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const ids = medicines.map((_, i) => `med-${i}`);

    // Duplicate-generic flag per row. Case-insensitive + trimmed. Blank generic
    // never counts as a duplicate (avoids false positives on missing metadata).
    const genericCounts = new Map<string, number>();
    for (const m of medicines) {
        const g = (m.generic_name ?? '').trim().toLowerCase();
        if (!g) continue;
        genericCounts.set(g, (genericCounts.get(g) ?? 0) + 1);
    }
    const isDuplicateGeneric = (m: MedicineInput): boolean => {
        const g = (m.generic_name ?? '').trim().toLowerCase();
        if (!g) return false;
        return (genericCounts.get(g) ?? 0) > 1;
    };

    function handleDragEnd(e: DragEndEvent) {
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        const from = ids.indexOf(active.id as string);
        const to = ids.indexOf(over.id as string);
        if (from < 0 || to < 0) return;

        const reordered = arrayMove(ids, from, to);
        const newFrom = ids.indexOf(active.id as string);
        const newTo = reordered.indexOf(active.id as string);
        onReorder(newFrom, newTo);
    }

    if (medicines.length === 0) {
        return <p className="text-sm text-gray-500">No medicines added.</p>;
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                <ul className="space-y-1.5">
                    {medicines.map((m, i) => (
                        <MedicineRow
                            key={ids[i]}
                            id={ids[i]}
                            index={i}
                            medicine={m}
                            onEdit={() => onEdit(i)}
                            onRemove={() => onRemove(i)}
                            duplicateGeneric={isDuplicateGeneric(m)}
                        />
                    ))}
                </ul>
            </SortableContext>
        </DndContext>
    );
}
