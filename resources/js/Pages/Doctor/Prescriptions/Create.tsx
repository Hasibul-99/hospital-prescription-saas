import PrescriptionLayout from '@/Layouts/PrescriptionLayout';
import TemplateSidebar from '@/Components/Prescription/TemplateSidebar';
import PatientInfoBar from '@/Components/Prescription/PatientInfoBar';
import ComplaintsSection from '@/Components/Prescription/ComplaintsSection';
import ExaminationSection from '@/Components/Prescription/ExaminationSection';
import TextListSection from '@/Components/Prescription/TextListSection';
import MedicineSection from '@/Components/Prescription/MedicineSection';
import Icd10Picker from '@/Components/Prescription/Icd10Picker';
import SpecialtyTools from '@/Components/Prescription/SpecialtyTools';
import RxPreviewColumn from '@/Components/Prescription/RxPreviewColumn';
import PreviousRxDrawer from '@/Components/Prescription/PreviousRxDrawer';
import BottomBar from '@/Components/Prescription/BottomBar';
import AllergyBanner from '@/Components/Prescription/AllergyBanner';
import FlashMessage from '@/Components/Common/FlashMessage';
import {
    AdviceSuggestion,
    ComplaintMaster,
    DoctorTemplate,
    Medicine,
    Patient,
    PatientAllergy,
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
import { App as AntApp, Button, Drawer, Dropdown } from 'antd';
import { PlusOutlined, ProfileOutlined } from '@ant-design/icons';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { csrfHeaders } from '@/utils/csrf';

interface Props {
    patient: Patient;
    allergies: PatientAllergy[];
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

type OptionalType = Exclude<
    SectionInput['section_type'],
    'diagnosis' | 'investigation' | 'advice' | 'hospitalization'
>;

/**
 * Sections beyond the everyday four. They used to all render as empty
 * accordions, so a routine prescription meant scrolling past eleven boxes the
 * doctor never touched. Now they are opt-in per prescription.
 */
const OPTIONAL_SECTIONS: {
    type: OptionalType;
    title: string;
    placeholder: string;
    group: string;
}[] = [
    { type: 'past_history', title: 'Past History', placeholder: 'e.g., Diabetes mellitus since 2015', group: 'History' },
    { type: 'drug_history', title: 'Drug History', placeholder: 'e.g., Metformin 500mg BD', group: 'History' },
    { type: 'negative_history', title: 'Negative History', placeholder: 'e.g., no diabetes, no hypertension', group: 'History' },
    { type: 'previous_reports', title: 'Previous Reports', placeholder: 'e.g., X-ray Chest (2026-01) — clear', group: 'History' },
    { type: 'next_plan', title: 'Next Plans', placeholder: 'Next plan', group: 'Plan' },
    { type: 'operation_note', title: 'Operation Note', placeholder: 'Procedure, findings, post-op plan', group: 'Plan' },
    { type: 'gynae_history', title: 'Gynae History', placeholder: 'Menstrual, obstetric, contraceptive notes', group: 'Obs & Gynae' },
    { type: 'obstetric_history', title: 'Obstetric History', placeholder: 'LMP, EDD, G/P/A, complications', group: 'Obs & Gynae' },
    { type: 'breast_local', title: 'Breast / Local Exam', placeholder: 'Findings', group: 'Obs & Gynae' },
    { type: 'referred_by', title: 'Referred By', placeholder: 'Dr. name or facility', group: 'Admin' },
    { type: 'lab_referral', title: 'Lab Referrals', placeholder: 'Preferred lab + patient discount', group: 'Admin' },
    { type: 'notes', title: 'Notes', placeholder: 'Any special notes', group: 'Admin' },
];

const INVESTIGATION_SUGGESTIONS = ['CBC', 'Blood Sugar', 'X-ray Chest', 'ECG', 'Urine R/E', 'S. Creatinine'];

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
    const [showMedicineModal, setShowMedicineModal] = useState(false);
    const [editMedicineIndex, setEditMedicineIndex] = useState<number | null>(null);
    const [templatesOpen, setTemplatesOpen] = useState(false);
    const [rxColumnOpen, setRxColumnOpen] = useState(false);

    // A section is shown once the doctor picks it, or because the draft it was
    // loaded from already has content for it.
    const [openOptional, setOpenOptional] = useState<OptionalType[]>(() => {
        const present = new Set((props.draft?.sections ?? []).map((s) => s.section_type));
        return OPTIONAL_SECTIONS.filter((s) => present.has(s.type)).map((s) => s.type);
    });

    const stateRef = useRef(state);
    stateRef.current = state;

    const save = useCallback(
        async (action: 'draft' | 'print' = 'draft'): Promise<number | null> => {
            setSaving(true);
            try {
                const payload = { ...stateRef.current, _json: 1 };
                const url = rxId ? `/doctor/prescriptions/${rxId}` : '/doctor/prescriptions';
                const method = rxId ? 'PUT' : 'POST';

                const res = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        Accept: 'application/json',
                        ...csrfHeaders(),
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
                    window.open(`/doctor/prescriptions/${data.id}/preview`, '_blank');
                }

                return data.id ?? rxId;
            } catch {
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
            if (stateRef.current.dirty && !saving) save('draft');
        }, 30000);
        return () => clearInterval(t);
    }, [save, saving]);

    useEffect(() => {
        function beforeUnload(e: BeforeUnloadEvent) {
            if (stateRef.current.dirty) { e.preventDefault(); e.returnValue = ''; }
        }
        window.addEventListener('beforeunload', beforeUnload);
        return () => window.removeEventListener('beforeunload', beforeUnload);
    }, []);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (!(e.metaKey || e.ctrlKey)) return;

            if (e.key === 'k') {
                e.preventDefault();
                openAddMedicine();
            }
            // The header advertises ⌘P as "Print"; without this it fell through
            // to the browser's own print dialog on the editor chrome.
            if (e.key === 'p') {
                e.preventDefault();
                save('print');
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [save]);

    function openAddMedicine() {
        setEditMedicineIndex(null);
        setShowMedicineModal(true);
    }

    function newRx() {
        setRxId(null);
        setLastSavedAt(null);
        setOpenOptional([]);
        dispatch({ type: 'RESET_FORM', state: buildInitialState(props) });
    }

    async function saveAsTemplate(name: string) {
        try {
            const res = await fetch('/doctor/templates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                    ...csrfHeaders(),
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
        } catch {
            message.error('Failed to save template.');
        }
    }

    function applyTemplate(tpl: DoctorTemplate) {
        const payload = {
            id: tpl.id,
            complaints: tpl.complaints as ComplaintInput[] | undefined,
            examinations: tpl.examinations as ExaminationInput[] | undefined,
            // Templates store medicines and the save path writes them, but this
            // used to pass [] — applying a template silently dropped them.
            medicines: (tpl.medicines as MedicineInput[] | undefined) ?? [],
            advices: (tpl.advices as SectionInput[] | undefined) ?? [],
            investigations: (tpl.investigations as SectionInput[] | undefined) ?? [],
        };

        const hasContent =
            stateRef.current.complaints.length > 0 ||
            stateRef.current.examinations.length > 0 ||
            stateRef.current.medicines.length > 0 ||
            stateRef.current.sections.length > 0;

        if (!hasContent) {
            dispatch({ type: 'LOAD_TEMPLATE', template: payload });
            setTemplatesOpen(false);
            return;
        }

        const confirmModal = modal.confirm({
            title: `Apply template "${tpl.disease_name}"?`,
            content: 'Replace what is on the form, or merge the template into it?',
            icon: <ProfileOutlined />,
            footer: (
                <div className="mt-4 flex justify-end gap-2">
                    <Button onClick={() => confirmModal.destroy()}>Cancel</Button>
                    <Button
                        onClick={() => {
                            dispatch({ type: 'MERGE_TEMPLATE', template: payload });
                            setTemplatesOpen(false);
                            confirmModal.destroy();
                        }}
                    >
                        Merge
                    </Button>
                    <Button
                        danger
                        type="primary"
                        onClick={() => {
                            dispatch({ type: 'LOAD_TEMPLATE', template: payload });
                            setTemplatesOpen(false);
                            confirmModal.destroy();
                        }}
                    >
                        Replace
                    </Button>
                </div>
            ),
        });
    }

    function addOptionalSection(type: OptionalType) {
        setOpenOptional((prev) => (prev.includes(type) ? prev : [...prev, type]));
    }

    function removeOptionalSection(type: OptionalType) {
        // Drop the section's rows too, otherwise hidden content would still save.
        stateRef.current.sections
            .map((s, i) => ({ s, i }))
            .filter(({ s }) => s.section_type === type)
            .reverse()
            .forEach(({ i }) => dispatch({ type: 'REMOVE_SECTION', index: i }));

        setOpenOptional((prev) => prev.filter((t) => t !== type));
    }

    const sectionProps = (type: SectionInput['section_type']) => ({
        sectionType: type,
        allSections: state.sections,
        onAdd: (s: SectionInput) => dispatch({ type: 'ADD_SECTION' as const, section: s }),
        onUpdate: (i: number, content: string) => dispatch({ type: 'UPDATE_SECTION' as const, index: i, content }),
        onRemove: (i: number) => dispatch({ type: 'REMOVE_SECTION' as const, index: i }),
    });

    const addSectionMenu = useMemo(() => {
        const remaining = OPTIONAL_SECTIONS.filter((s) => !openOptional.includes(s.type));
        if (remaining.length === 0) return [{ key: 'none', label: 'All sections added', disabled: true }];

        const groups = remaining.reduce<Record<string, typeof remaining>>((acc, s) => {
            (acc[s.group] ??= []).push(s);
            return acc;
        }, {});

        return Object.entries(groups).map(([group, entries]) => ({
            key: group,
            type: 'group' as const,
            label: group,
            children: entries.map((s) => ({
                key: s.type,
                label: s.title,
                onClick: () => addOptionalSection(s.type),
            })),
        }));
    }, [openOptional]);

    const rxColumn = (
        <RxPreviewColumn
            medicines={state.medicines}
            sections={state.sections}
            followUpDate={state.follow_up_date}
            followUpDurationValue={state.follow_up_duration_value}
            followUpDurationUnit={state.follow_up_duration_unit}
            onOpenMedicineModal={openAddMedicine}
            onEditMedicine={(i) => {
                setEditMedicineIndex(i);
                setShowMedicineModal(true);
            }}
            onRemoveMedicine={(i) => dispatch({ type: 'REMOVE_MEDICINE', index: i })}
            onAddSection={(s) => dispatch({ type: 'ADD_SECTION', section: s })}
            onRemoveSection={(i) => dispatch({ type: 'REMOVE_SECTION', index: i })}
            onFollowUpChange={(date, value, unit) =>
                dispatch({
                    type: 'SET_FOLLOW_UP',
                    follow_up_date: date,
                    follow_up_duration_value: value,
                    follow_up_duration_unit: unit,
                })
            }
        />
    );

    return (
        <div className="grid h-full grid-rows-[1fr_56px] overflow-hidden">
            {/* Columns collapse as the viewport narrows: the template rail goes
                first, then the Rx column — both stay reachable as drawers. */}
            <div className="grid min-h-0 overflow-hidden lg:grid-cols-[248px_1fr] xl:grid-cols-[248px_1fr_340px]">
                <div className="hidden lg:block">
                    <TemplateSidebar
                        templates={props.templates}
                        activeId={state.template_id}
                        onSelect={applyTemplate}
                        onNewRx={newRx}
                    />
                </div>

                <div className="flex flex-col overflow-y-auto">
                    <PatientInfoBar
                        patient={props.patient}
                        date={state.date}
                        appointment={props.appointment}
                        medicineCount={state.medicines.length}
                        onOpenPreviousRx={() => setShowPrevious(true)}
                        onOpenTemplates={() => setTemplatesOpen(true)}
                        onOpenRxColumn={() => setRxColumnOpen(true)}
                    />

                    <AllergyBanner
                        patientId={props.patient.id}
                        allergies={props.allergies}
                        medicines={state.medicines}
                    />

                    <div className="flex-1 px-4 pb-6 pt-3">
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
                            title="Diagnosis"
                            titleBn="রোগ নির্ণয়"
                            {...sectionProps('diagnosis')}
                            suggestions={props.diagnosis_suggestions}
                            placeholder="Diagnosis"
                            extra={
                                <Icd10Picker
                                    onPick={(formatted) =>
                                        dispatch({
                                            type: 'ADD_SECTION',
                                            section: { section_type: 'diagnosis', content: formatted },
                                        })
                                    }
                                    placeholder="Search ICD-10 by code or title"
                                />
                            }
                        />

                        <TextListSection
                            title="Investigations"
                            titleBn="পরীক্ষা-নিরীক্ষা"
                            {...sectionProps('investigation')}
                            suggestions={INVESTIGATION_SUGGESTIONS}
                            placeholder="Investigation name"
                        />

                        <TextListSection
                            title="Advices"
                            titleBn="পরামর্শ"
                            {...sectionProps('advice')}
                            bilingualSuggestions={props.advice_suggestions}
                            placeholder="Advice"
                        />

                        {/* Opt-in sections, in the order the doctor added them. */}
                        {openOptional.map((type) => {
                            const meta = OPTIONAL_SECTIONS.find((s) => s.type === type)!;
                            return (
                                <TextListSection
                                    key={type}
                                    title={meta.title}
                                    {...sectionProps(type)}
                                    placeholder={meta.placeholder}
                                    onRemoveSection={() => removeOptionalSection(type)}
                                />
                            );
                        })}

                        <div className="mb-3">
                            <Dropdown menu={{ items: addSectionMenu }} trigger={['click']} placement="bottomLeft">
                                <Button type="dashed" block icon={<PlusOutlined />}>
                                    Add section
                                </Button>
                            </Dropdown>
                        </div>

                        <SpecialtyTools />
                    </div>
                </div>

                <div className="hidden overflow-y-auto border-l border-[#e3e7e3] bg-[#f6f7f5] xl:block">
                    {rxColumn}
                </div>
            </div>

            <BottomBar
                saving={saving}
                dirty={state.dirty}
                lastSavedAt={lastSavedAt}
                medicineCount={state.medicines.length}
                onSave={() => save('draft')}
                onSavePrint={() => save('print')}
                onSaveTemplate={saveAsTemplate}
                onNewRx={newRx}
                onAddMedicine={openAddMedicine}
                onPreview={() => rxId && window.open(`/doctor/prescriptions/${rxId}/preview`, '_blank')}
                hasSavedRx={rxId !== null}
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
                externalOpen={showMedicineModal}
                externalEditIndex={editMedicineIndex}
                onExternalClose={() => {
                    setShowMedicineModal(false);
                    setEditMedicineIndex(null);
                }}
            />

            <PreviousRxDrawer
                show={showPrevious}
                onClose={() => setShowPrevious(false)}
                prescriptions={props.previous_prescriptions}
            />

            {/* Narrow-viewport equivalents of the two side columns. */}
            <Drawer
                open={templatesOpen}
                onClose={() => setTemplatesOpen(false)}
                placement="left"
                width={288}
                title="Templates"
                styles={{ body: { padding: 0 } }}
            >
                <TemplateSidebar
                    templates={props.templates}
                    activeId={state.template_id}
                    onSelect={applyTemplate}
                    onNewRx={() => {
                        newRx();
                        setTemplatesOpen(false);
                    }}
                />
            </Drawer>

            <Drawer
                open={rxColumnOpen}
                onClose={() => setRxColumnOpen(false)}
                placement="right"
                width={360}
                title="Prescription"
                styles={{ body: { padding: 0, background: '#f6f7f5' } }}
            >
                {rxColumn}
            </Drawer>
        </div>
    );
}

Create.layout = (page: ReactNode) => <PrescriptionLayout>{page}</PrescriptionLayout>;
