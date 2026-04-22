import DoctorLayout from '@/Layouts/DoctorLayout';
import FlashMessage from '@/Components/FlashMessage';
import ComplaintsSection from '@/Components/Prescription/ComplaintsSection';
import ExaminationSection from '@/Components/Prescription/ExaminationSection';
import MedicineSection from '@/Components/Prescription/MedicineSection';
import TextListSection from '@/Components/Prescription/TextListSection';
import { AdviceSuggestion, ComplaintMaster, DoctorTemplate, Medicine, PageProps } from '@/types';
import { ComplaintInput, ExaminationInput, MedicineInput, SectionInput } from '@/hooks/usePrescriptionReducer';
import { Head, router } from '@inertiajs/react';
import { Button, Card, Checkbox, Form, Input, Space, Typography, App as AntApp } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useState } from 'react';

type Props = PageProps<{
    template: DoctorTemplate | null;
    can_create_global: boolean;
    complaint_masters: ComplaintMaster[];
    duration_presets: string[];
    advice_suggestions: AdviceSuggestion[];
    frequent_medicines: Medicine[];
    instruction_presets: string[];
    duration_day_presets: number[];
}>;

export default function TemplateForm({
    template,
    can_create_global,
    complaint_masters,
    duration_presets,
    advice_suggestions,
    frequent_medicines,
    instruction_presets,
    duration_day_presets,
}: Props) {
    const { message } = AntApp.useApp();

    const [diseaseName, setDiseaseName] = useState<string>(template?.disease_name ?? '');
    const [isGlobal, setIsGlobal] = useState<boolean>(template?.is_global ?? false);
    const [complaints, setComplaints] = useState<ComplaintInput[]>(
        (template?.complaints as ComplaintInput[]) ?? [],
    );
    const [examinations, setExaminations] = useState<ExaminationInput[]>(
        (template?.examinations as ExaminationInput[]) ?? [],
    );
    const [medicines, setMedicines] = useState<MedicineInput[]>(
        (((template?.medicines as unknown) as MedicineInput[]) ?? []).map(normalizeMedicineRow),
    );
    const [advices, setAdvices] = useState<SectionInput[]>(
        ((template?.advices as any[]) ?? []).map((a) => ({ section_type: 'advice', content: a.content ?? a })),
    );
    const [investigations, setInvestigations] = useState<SectionInput[]>(
        ((template?.investigations as any[]) ?? []).map((a) => ({ section_type: 'investigation', content: a.content ?? a })),
    );
    const [saving, setSaving] = useState(false);

    function save() {
        if (!diseaseName.trim()) {
            message.warning('Disease name is required.');
            return;
        }

        const payload = {
            disease_name: diseaseName.trim(),
            is_global: isGlobal,
            complaints,
            examinations,
            medicines,
            advices,
            investigations,
        };

        setSaving(true);

        const onOk = () => {
            setSaving(false);
            message.success('Template saved.');
            router.visit('/doctor/templates');
        };
        const onFail = () => {
            setSaving(false);
            message.error('Save failed.');
        };

        if (template) {
            router.put(`/doctor/templates/${template.id}`, payload as any, {
                onSuccess: onOk,
                onError: onFail,
            });
        } else {
            router.post('/doctor/templates', payload as any, {
                onSuccess: onOk,
                onError: onFail,
            });
        }
    }

    return (
        <DoctorLayout>
            <Head title={template ? 'Edit Template' : 'New Template'} />
            <FlashMessage />

            <div className="mb-4 flex items-center justify-between">
                <Typography.Title level={4} className="!mb-0">
                    {template ? 'Edit Template' : 'New Template'}
                </Typography.Title>
                <Space>
                    <Button onClick={() => router.visit('/doctor/templates')}>Cancel</Button>
                    <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={save}>
                        Save
                    </Button>
                </Space>
            </div>

            <Card className="mb-4">
                <Form layout="vertical">
                    <Form.Item label="Disease / Condition Name" required>
                        <Input
                            value={diseaseName}
                            onChange={(e) => setDiseaseName(e.target.value)}
                            placeholder="e.g., Acute Gastroenteritis"
                            maxLength={150}
                        />
                    </Form.Item>
                    {can_create_global && (
                        <Form.Item>
                            <Checkbox checked={isGlobal} onChange={(e) => setIsGlobal(e.target.checked)}>
                                Mark as <strong>Global</strong> (visible to all doctors in hospital)
                            </Checkbox>
                        </Form.Item>
                    )}
                </Form>
            </Card>

            <div className="space-y-3">
                <ComplaintsSection
                    complaints={complaints}
                    masters={complaint_masters}
                    durationPresets={duration_presets}
                    onAdd={(c) => setComplaints((prev) => [...prev, c])}
                    onRemove={(i) => setComplaints((prev) => prev.filter((_, idx) => idx !== i))}
                    onUpdate={(i, patch) =>
                        setComplaints((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))
                    }
                />

                <ExaminationSection
                    items={examinations}
                    onAdd={(e) => setExaminations((prev) => [...prev, e])}
                    onUpdate={(i, patch) =>
                        setExaminations((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)))
                    }
                    onRemove={(i) => setExaminations((prev) => prev.filter((_, idx) => idx !== i))}
                />

                <TextListSection
                    title="Investigations (defaults)"
                    sectionType="investigation"
                    allSections={investigations}
                    onAdd={(s) => setInvestigations((prev) => [...prev, s])}
                    onUpdate={(i, content) =>
                        setInvestigations((prev) => prev.map((s, idx) => (idx === i ? { ...s, content } : s)))
                    }
                    onRemove={(i) => setInvestigations((prev) => prev.filter((_, idx) => idx !== i))}
                />

                <MedicineSection
                    medicines={medicines}
                    frequentMedicines={frequent_medicines}
                    instructionPresets={instruction_presets}
                    dayPresets={duration_day_presets}
                    onAdd={(m) => setMedicines((prev) => [...prev, m])}
                    onUpdate={(i, patch) =>
                        setMedicines((prev) => prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m)))
                    }
                    onRemove={(i) => setMedicines((prev) => prev.filter((_, idx) => idx !== i))}
                    onReorder={(from, to) =>
                        setMedicines((prev) => {
                            const next = [...prev];
                            const [item] = next.splice(from, 1);
                            next.splice(to, 0, item);
                            return next;
                        })
                    }
                />

                <TextListSection
                    title="Advices (defaults)"
                    sectionType="advice"
                    allSections={advices}
                    bilingualSuggestions={advice_suggestions}
                    onAdd={(s) => setAdvices((prev) => [...prev, s])}
                    onUpdate={(i, content) =>
                        setAdvices((prev) => prev.map((s, idx) => (idx === i ? { ...s, content } : s)))
                    }
                    onRemove={(i) => setAdvices((prev) => prev.filter((_, idx) => idx !== i))}
                />
            </div>

            <div className="mt-6 flex justify-end">
                <Button type="primary" size="large" icon={<SaveOutlined />} loading={saving} onClick={save}>
                    Save Template
                </Button>
            </div>
        </DoctorLayout>
    );
}

function normalizeMedicineRow(m: any): MedicineInput {
    return {
        medicine_id: m.medicine_id ?? null,
        medicine_name: m.medicine_name ?? '',
        medicine_type: m.medicine_type ?? null,
        strength: m.strength ?? null,
        generic_name: m.generic_name ?? null,
        dose_morning: numOrNull(m.dose_morning),
        dose_noon: numOrNull(m.dose_noon),
        dose_afternoon: numOrNull(m.dose_afternoon),
        dose_night: numOrNull(m.dose_night),
        dose_bedtime: numOrNull(m.dose_bedtime),
        timing: m.timing ?? null,
        duration_value: m.duration_value ?? null,
        duration_unit: m.duration_unit ?? null,
        custom_instruction: m.custom_instruction ?? null,
        additional_doses: m.additional_doses ?? null,
    };
}

function numOrNull(v: unknown): number | null {
    if (v == null || v === '') return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
}
