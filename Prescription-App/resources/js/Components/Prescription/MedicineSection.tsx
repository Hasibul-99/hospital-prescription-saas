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

    async function fetchDefaults(medicineId: number): Promise<Partial<MedicineInput>> {
        try {
            const res = await fetch(`/doctor/medicine-defaults/${medicineId}`, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            if (!res.ok) return {};
            const data = await res.json();
            if (!data.default) return {};
            return {
                dose_morning: numOrNull(data.default.dose_morning),
                dose_noon: numOrNull(data.default.dose_noon),
                dose_afternoon: numOrNull(data.default.dose_afternoon),
                dose_night: numOrNull(data.default.dose_night),
                dose_bedtime: numOrNull(data.default.dose_bedtime),
                timing: data.default.timing ?? null,
                duration_value: data.default.duration_value ?? null,
                duration_unit: data.default.duration_unit ?? null,
                custom_instruction: data.default.custom_instruction ?? null,
            };
        } catch {
            return {};
        }
    }

    function fireAndForgetAddFrequent(medicineId: number) {
        fetch(`/doctor/medicines/frequent/${medicineId}`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN':
                    (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '',
            },
            credentials: 'same-origin',
        }).catch(() => {});
    }

    function buildBase(m: Medicine): MedicineInput {
        return {
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
            additional_doses: null,
        };
    }

    function hasDoseDefaults(d: Partial<MedicineInput>): boolean {
        return [d.dose_morning, d.dose_noon, d.dose_afternoon, d.dose_night, d.dose_bedtime].some(
            (v) => v != null,
        );
    }

    async function pickFromSearch(m: Medicine) {
        const defaults = await fetchDefaults(m.id);
        fireAndForgetAddFrequent(m.id);

        setAddOpen(false);
        setDraft({ ...buildBase(m), ...defaults });
        setEditIndex(null);
        setDoseOpen(true);
    }

    async function pickFromFrequent(m: Medicine) {
        const defaults = await fetchDefaults(m.id);
        const merged: MedicineInput = { ...buildBase(m), ...defaults };

        if (hasDoseDefaults(defaults)) {
            setAddOpen(false);
            onAdd(merged);
            return;
        }

        setAddOpen(false);
        setDraft(merged);
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

    function removeFromModal(index: number) {
        if (confirm('Remove this medicine?')) onRemove(index);
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
                addedMedicines={medicines}
                onPickFromFrequent={pickFromFrequent}
                onPickFromSearch={pickFromSearch}
                onEditAdded={(i) => {
                    setAddOpen(false);
                    openEdit(i);
                }}
                onRemoveAdded={removeFromModal}
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
