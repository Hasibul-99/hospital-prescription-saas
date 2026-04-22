import PrescriptionLayout from '@/Layouts/PrescriptionLayout';
import TemplateSidebar from '@/Components/Prescription/TemplateSidebar';
import PatientInfoBar from '@/Components/Prescription/PatientInfoBar';
import ComplaintsSection from '@/Components/Prescription/ComplaintsSection';
import ExaminationSection from '@/Components/Prescription/ExaminationSection';
import TextListSection from '@/Components/Prescription/TextListSection';
import FollowUpPicker from '@/Components/Prescription/FollowUpPicker';
import MedicineSection from '@/Components/Prescription/MedicineSection';
import PreviousRxDrawer from '@/Components/Prescription/PreviousRxDrawer';
import BottomBar from '@/Components/Prescription/BottomBar';
import FlashMessage from '@/Components/FlashMessage';
import {
    AdviceSuggestion,
    ComplaintMaster,
    DoctorTemplate,
    Medicine,
    Patient,
    Appointment,
    Prescription,
} from '@/types';
import {
    MedicineInput,
    PrescriptionFormState,
    usePrescriptionReducer,
    ComplaintInput,
    ExaminationInput,
    SectionInput,
} from '@/hooks/usePrescriptionReducer';
import { router } from '@inertiajs/react';
import { App as AntApp, Modal } from 'antd';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';

interface Props {
    patient: Patient;
    appointment: Appointment | null;
    draft: (Prescription & {
        complaints?: Array<{ complaint_name: string; duration_text?: string; note?: string }>;
        examinations?: Array<{ examination_name: string; finding_value?: string; note?: string }>;
        sections?: Array<{ section_type: string; content: string }>;
        medicines?: Array<MedicineInput & { id?: number }>;
    }) | null;
    complaint_masters: ComplaintMaster[];
    duration_presets: string[];
    templates: DoctorTemplate[];
    previous_prescriptions: Prescription[];
    advice_suggestions: AdviceSuggestion[];
    diagnosis_suggestions: string[];
    frequent_medicines: Medicine[];
    instruction_presets: string[];
    duration_day_presets: number[];
}

function toNum(v: unknown): number | null {
    if (v == null || v === '') return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
}

function buildInitialState(props: Props): PrescriptionFormState {
    const draft = props.draft;
    return {
        patient_id: props.patient.id,
        appointment_id: props.appointment?.id ?? null,
        date: draft?.date ?? new Date().toISOString().slice(0, 10),
        template_id: null,
        status: draft?.status ?? 'draft',
        complaints: (draft?.complaints ?? []).map((c) => ({
            complaint_name: c.complaint_name,
            duration_text: c.duration_text,
            note: c.note,
        })),
        examinations: (draft?.examinations ?? []).map((e) => ({
            examination_name: e.examination_name,
            finding_value: e.finding_value,
            note: e.note,
        })),
        sections: (draft?.sections ?? []).map((s) => ({
            section_type: s.section_type as SectionInput['section_type'],
            content: s.content,
        })),
        medicines: (draft?.medicines ?? []).map((m) => ({
            medicine_id: m.medicine_id ?? null,
            medicine_name: m.medicine_name,
            medicine_type: m.medicine_type ?? null,
            strength: m.strength ?? null,
            generic_name: m.generic_name ?? null,
            dose_morning: toNum(m.dose_morning),
            dose_noon: toNum(m.dose_noon),
            dose_afternoon: toNum(m.dose_afternoon),
            dose_night: toNum(m.dose_night),
            dose_bedtime: toNum(m.dose_bedtime),
            timing: m.timing ?? null,
            duration_value: m.duration_value ?? null,
            duration_unit: m.duration_unit ?? null,
            custom_instruction: m.custom_instruction ?? null,
        })),
        follow_up_date: draft?.follow_up_date ?? null,
        follow_up_duration_value: draft?.follow_up_duration_value ?? null,
        follow_up_duration_unit: draft?.follow_up_duration_unit ?? null,
        dirty: false,
    };
}

export default function Create(props: Props) {
    const { message, modal } = AntApp.useApp();
    const [state, dispatch] = usePrescriptionReducer(buildInitialState(props));
    const [rxId, setRxId] = useState<number | null>(props.draft?.id ?? null);
    const [saving, setSaving] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
    const [showPrevious, setShowPrevious] = useState(false);
    const stateRef = useRef(state);
    stateRef.current = state;

    const save = useCallback(
        async (action: 'draft' | 'print' = 'draft'): Promise<number | null> => {
            setSaving(true);
            try {
                const payload = {
                    ...stateRef.current,
                    _json: 1,
                };
                const url = rxId ? `/doctor/prescriptions/${rxId}` : '/doctor/prescriptions';
                const method = rxId ? 'PUT' : 'POST';

                const res = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN':
                            (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)
                                ?.content ?? '',
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify(payload),
                });

                if (!res.ok) throw new Error('Save failed');
                const data = await res.json();

                if (data.id) setRxId(data.id);
                setLastSavedAt(new Date().toLocaleTimeString());
                dispatch({ type: 'MARK_CLEAN' });

                if (action === 'print' && data.id) {
                    window.open(`/doctor/prescriptions/${data.id}/print`, '_blank');
                }

                return data.id ?? rxId;
            } catch (e) {
                message.error('Failed to save. Please try again.');
                return null;
            } finally {
                setSaving(false);
            }
        },
        [rxId, dispatch, message],
    );

    useEffect(() => {
        const t = setInterval(() => {
            if (stateRef.current.dirty && !saving) {
                save('draft');
            }
        }, 30000);
        return () => clearInterval(t);
    }, [save, saving]);

    useEffect(() => {
        function beforeUnload(e: BeforeUnloadEvent) {
            if (stateRef.current.dirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        }
        window.addEventListener('beforeunload', beforeUnload);
        return () => window.removeEventListener('beforeunload', beforeUnload);
    }, []);

    async function saveAsTemplate(name: string) {
        try {
            const res = await fetch('/doctor/templates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    disease_name: name,
                    complaints: state.complaints,
                    examinations: state.examinations,
                    medicines: state.medicines,
                    advices: state.sections.filter((s) => s.section_type === 'advice'),
                    investigations: state.sections.filter((s) => s.section_type === 'investigation'),
                }),
            });
            if (!res.ok) throw new Error('Template save failed');
            message.success(`Template "${name}" saved.`);
            router.reload({ only: ['templates'] });
        } catch (e) {
            message.error('Failed to save template.');
        }
    }

    function applyTemplate(tpl: DoctorTemplate) {
        const payload = {
            id: tpl.id,
            complaints: tpl.complaints as ComplaintInput[] | undefined,
            examinations: tpl.examinations as ExaminationInput[] | undefined,
            medicines: [],
            advices: (tpl.advices as any) ?? [],
            investigations: (tpl.investigations as any) ?? [],
        };

        const hasContent =
            stateRef.current.complaints.length > 0 ||
            stateRef.current.examinations.length > 0 ||
            stateRef.current.medicines.length > 0 ||
            stateRef.current.sections.length > 0;

        if (!hasContent) {
            dispatch({ type: 'LOAD_TEMPLATE', template: payload });
            return;
        }

        modal.confirm({
            title: `Apply template "${tpl.disease_name}"?`,
            content: 'Replace current form data, or merge template items into it?',
            okText: 'Replace',
            cancelText: 'Cancel',
            okButtonProps: { danger: true },
            footer: (_, { OkBtn, CancelBtn }) => (
                <div className="flex justify-end gap-2">
                    <CancelBtn />
                    <button
                        type="button"
                        className="rounded border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50"
                        onClick={() => {
                            dispatch({ type: 'MERGE_TEMPLATE', template: payload });
                            Modal.destroyAll();
                        }}
                    >
                        Merge
                    </button>
                    <OkBtn />
                </div>
            ),
            onOk: () => dispatch({ type: 'LOAD_TEMPLATE', template: payload }),
        });
    }

    return (
        <div className="flex min-h-[calc(100vh-3rem)]">
            <TemplateSidebar
                templates={props.templates}
                activeId={state.template_id}
                onSelect={applyTemplate}
            />

            <div className="flex-1">
                <PatientInfoBar
                    patient={props.patient}
                    date={state.date}
                    onOpenPreviousRx={() => setShowPrevious(true)}
                />

                <div className="mx-auto max-w-5xl px-4 py-4">
                    <FlashMessage />

                    <ComplaintsSection
                        complaints={state.complaints}
                        masters={props.complaint_masters}
                        durationPresets={props.duration_presets}
                        onAdd={(c) => dispatch({ type: 'ADD_COMPLAINT', complaint: c })}
                        onRemove={(i) => dispatch({ type: 'REMOVE_COMPLAINT', index: i })}
                        onUpdate={(i, patch) =>
                            dispatch({
                                type: 'UPDATE_COMPLAINT_DURATION',
                                index: i,
                                duration_text: patch.duration_text,
                                note: patch.note,
                            })
                        }
                    />

                    <ExaminationSection
                        items={state.examinations}
                        onAdd={(e) => dispatch({ type: 'ADD_EXAMINATION', examination: e })}
                        onUpdate={(i, patch) => dispatch({ type: 'UPDATE_EXAMINATION', index: i, patch })}
                        onRemove={(i) => dispatch({ type: 'REMOVE_EXAMINATION', index: i })}
                    />

                    <TextListSection
                        title="Past History"
                        sectionType="past_history"
                        allSections={state.sections}
                        onAdd={(s) => dispatch({ type: 'ADD_SECTION', section: s })}
                        onUpdate={(i, content) => dispatch({ type: 'UPDATE_SECTION', index: i, content })}
                        onRemove={(i) => dispatch({ type: 'REMOVE_SECTION', index: i })}
                        placeholder="e.g., Diabetes mellitus since 2015"
                    />

                    <TextListSection
                        title="Drug History"
                        sectionType="drug_history"
                        allSections={state.sections}
                        onAdd={(s) => dispatch({ type: 'ADD_SECTION', section: s })}
                        onUpdate={(i, content) => dispatch({ type: 'UPDATE_SECTION', index: i, content })}
                        onRemove={(i) => dispatch({ type: 'REMOVE_SECTION', index: i })}
                        placeholder="e.g., Metformin 500mg BD"
                    />

                    <TextListSection
                        title="Investigations"
                        sectionType="investigation"
                        allSections={state.sections}
                        onAdd={(s) => dispatch({ type: 'ADD_SECTION', section: s })}
                        onUpdate={(i, content) => dispatch({ type: 'UPDATE_SECTION', index: i, content })}
                        onRemove={(i) => dispatch({ type: 'REMOVE_SECTION', index: i })}
                        suggestions={['CBC', 'Blood Sugar', 'X-ray Chest', 'ECG', 'Urine R/E', 'S. Creatinine']}
                        placeholder="Investigation name"
                    />

                    <TextListSection
                        title="Diagnosis"
                        sectionType="diagnosis"
                        allSections={state.sections}
                        onAdd={(s) => dispatch({ type: 'ADD_SECTION', section: s })}
                        onUpdate={(i, content) => dispatch({ type: 'UPDATE_SECTION', index: i, content })}
                        onRemove={(i) => dispatch({ type: 'REMOVE_SECTION', index: i })}
                        suggestions={props.diagnosis_suggestions}
                        placeholder="Diagnosis"
                    />

                    <MedicineSection
                        medicines={state.medicines}
                        frequentMedicines={props.frequent_medicines}
                        instructionPresets={props.instruction_presets}
                        dayPresets={props.duration_day_presets}
                        onAdd={(m) => dispatch({ type: 'ADD_MEDICINE', medicine: m })}
                        onUpdate={(i, patch) => dispatch({ type: 'UPDATE_MEDICINE', index: i, patch })}
                        onRemove={(i) => dispatch({ type: 'REMOVE_MEDICINE', index: i })}
                        onReorder={(from, to) => dispatch({ type: 'REORDER_MEDICINES', from, to })}
                    />

                    <TextListSection
                        title="Advices"
                        sectionType="advice"
                        allSections={state.sections}
                        onAdd={(s) => dispatch({ type: 'ADD_SECTION', section: s })}
                        onUpdate={(i, content) => dispatch({ type: 'UPDATE_SECTION', index: i, content })}
                        onRemove={(i) => dispatch({ type: 'REMOVE_SECTION', index: i })}
                        bilingualSuggestions={props.advice_suggestions}
                        placeholder="Advice"
                    />

                    <TextListSection
                        title="Next Plans"
                        sectionType="next_plan"
                        allSections={state.sections}
                        onAdd={(s) => dispatch({ type: 'ADD_SECTION', section: s })}
                        onUpdate={(i, content) => dispatch({ type: 'UPDATE_SECTION', index: i, content })}
                        onRemove={(i) => dispatch({ type: 'REMOVE_SECTION', index: i })}
                        placeholder="Next plan"
                    />

                    <TextListSection
                        title="Hospitalizations"
                        sectionType="hospitalization"
                        allSections={state.sections}
                        onAdd={(s) => dispatch({ type: 'ADD_SECTION', section: s })}
                        onUpdate={(i, content) => dispatch({ type: 'UPDATE_SECTION', index: i, content })}
                        onRemove={(i) => dispatch({ type: 'REMOVE_SECTION', index: i })}
                        placeholder="Hospitalization notes"
                    />

                    <TextListSection
                        title="Operation Notes"
                        sectionType="operation_note"
                        allSections={state.sections}
                        onAdd={(s) => dispatch({ type: 'ADD_SECTION', section: s })}
                        onUpdate={(i, content) => dispatch({ type: 'UPDATE_SECTION', index: i, content })}
                        onRemove={(i) => dispatch({ type: 'REMOVE_SECTION', index: i })}
                        placeholder="Operation note"
                    />

                    <FollowUpPicker
                        followUpDate={state.follow_up_date}
                        durationValue={state.follow_up_duration_value}
                        durationUnit={state.follow_up_duration_unit}
                        onChange={(follow_up_date, follow_up_duration_value, follow_up_duration_unit) =>
                            dispatch({
                                type: 'SET_FOLLOW_UP',
                                follow_up_date,
                                follow_up_duration_value,
                                follow_up_duration_unit,
                            })
                        }
                        onSaveAsTemplate={saveAsTemplate}
                    />
                </div>

                <BottomBar
                    saving={saving}
                    dirty={state.dirty}
                    lastSavedAt={lastSavedAt}
                    onSave={() => save('draft')}
                    onSavePrint={() => save('print')}
                />
            </div>

            <PreviousRxDrawer
                show={showPrevious}
                onClose={() => setShowPrevious(false)}
                prescriptions={props.previous_prescriptions}
            />
        </div>
    );
}

Create.layout = (page: ReactNode) => <PrescriptionLayout>{page}</PrescriptionLayout>;
