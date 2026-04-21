import AddMedicineModal from './AddMedicineModal';
import DoseConfigModal from './DoseConfigModal';
import MedicineList from './MedicineList';
import SectionAccordion from './SectionAccordion';
import { MedicineInput } from '@/hooks/usePrescriptionReducer';
import { Medicine } from '@/types';
import { useState } from 'react';

interface Props {
    medicines: MedicineInput[];
    frequentMedicines: Medicine[];
    instructionPresets: string[];
    dayPresets: number[];
    onAdd: (m: MedicineInput) => void;
    onUpdate: (index: number, patch: Partial<MedicineInput>) => void;
    onRemove: (index: number) => void;
    onReorder: (from: number, to: number) => void;
}

export default function MedicineSection({
    medicines,
    frequentMedicines,
    instructionPresets,
    dayPresets,
    onAdd,
    onUpdate,
    onRemove,
    onReorder,
}: Props) {
    const [addOpen, setAddOpen] = useState(false);
    const [doseOpen, setDoseOpen] = useState(false);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [draft, setDraft] = useState<MedicineInput | null>(null);

    async function pickMedicine(m: Medicine) {
        let defaults: Partial<MedicineInput> = {};

        try {
            const res = await fetch(`/doctor/medicine-defaults/${m.id}`, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            if (res.ok) {
                const data = await res.json();
                if (data.default) {
                    defaults = {
                        dose_morning: numOrNull(data.default.dose_morning),
                        dose_noon: numOrNull(data.default.dose_noon),
                        dose_afternoon: numOrNull(data.default.dose_afternoon),
                        dose_night: numOrNull(data.default.dose_night),
                        dose_bedtime: numOrNull(data.default.dose_bedtime),
                        timing: data.default.timing,
                        duration_value: data.default.duration_value,
                        duration_unit: data.default.duration_unit,
                        custom_instruction: data.default.custom_instruction,
                    };
                }
            }
        } catch {
            /* ignore */
        }

        fetch(`/doctor/medicines/frequent/${m.id}`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN':
                    (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '',
            },
            credentials: 'same-origin',
        }).catch(() => {});

        const newMed: MedicineInput = {
            medicine_id: m.id,
            medicine_name: m.brand_name,
            medicine_type: m.type,
            strength: m.strength ?? null,
            generic_name: m.generic_name ?? null,
            dose_morning: null,
            dose_noon: null,
            dose_afternoon: null,
            dose_night: null,
            dose_bedtime: null,
            timing: null,
            duration_value: null,
            duration_unit: null,
            custom_instruction: null,
            ...defaults,
        };

        setAddOpen(false);
        setDraft(newMed);
        setEditIndex(null);
        setDoseOpen(true);
    }

    function openEdit(index: number) {
        setEditIndex(index);
        setDraft(medicines[index]);
        setDoseOpen(true);
    }

    async function commitDose(patch: MedicineInput, saveAsDefault: boolean) {
        if (editIndex != null) {
            onUpdate(editIndex, patch);
        } else {
            onAdd(patch);
        }

        if (saveAsDefault && patch.medicine_id) {
            try {
                await fetch(`/doctor/medicine-defaults/${patch.medicine_id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN':
                            (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '',
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        dose_morning: patch.dose_morning,
                        dose_noon: patch.dose_noon,
                        dose_afternoon: patch.dose_afternoon,
                        dose_night: patch.dose_night,
                        dose_bedtime: patch.dose_bedtime,
                        timing: patch.timing,
                        duration_value: patch.duration_value,
                        duration_unit: patch.duration_unit,
                        custom_instruction: patch.custom_instruction,
                    }),
                });
            } catch {
                /* ignore */
            }
        }

        setDoseOpen(false);
        setDraft(null);
        setEditIndex(null);
    }

    return (
        <SectionAccordion
            title="Rx — Treatment Plan"
            itemCount={medicines.length}
            onAdd={() => setAddOpen(true)}
        >
            <MedicineList
                medicines={medicines}
                onReorder={onReorder}
                onEdit={openEdit}
                onRemove={onRemove}
            />

            <AddMedicineModal
                show={addOpen}
                onClose={() => setAddOpen(false)}
                frequent={frequentMedicines}
                onPick={pickMedicine}
            />

            <DoseConfigModal
                show={doseOpen}
                onClose={() => {
                    setDoseOpen(false);
                    setDraft(null);
                    setEditIndex(null);
                }}
                medicine={draft}
                onSave={commitDose}
                instructionPresets={instructionPresets}
                dayPresets={dayPresets}
            />
        </SectionAccordion>
    );
}

function numOrNull(v: unknown): number | null {
    if (v == null || v === '') return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
}
