import { useReducer } from 'react';

export interface ComplaintInput {
    complaint_name: string;
    duration_text?: string;
    note?: string;
}

export interface ExaminationInput {
    examination_name: string;
    finding_value?: string;
    note?: string;
}

export interface SectionInput {
    section_type:
        | 'past_history'
        | 'drug_history'
        | 'investigation'
        | 'diagnosis'
        | 'advice'
        | 'next_plan'
        | 'hospitalization'
        | 'operation_note';
    content: string;
}

export interface MedicineInput {
    medicine_id?: number | null;
    medicine_name: string;
    medicine_type?: string | null;
    strength?: string | null;
    generic_name?: string | null;
    dose_morning?: number | null;
    dose_noon?: number | null;
    dose_afternoon?: number | null;
    dose_night?: number | null;
    dose_bedtime?: number | null;
    timing?: string | null;
    duration_value?: number | null;
    duration_unit?: string | null;
    custom_instruction?: string | null;
}

export interface PrescriptionFormState {
    patient_id: number;
    appointment_id?: number | null;
    date: string;
    template_id?: number | null;
    status: 'draft' | 'finalized' | 'printed';
    complaints: ComplaintInput[];
    examinations: ExaminationInput[];
    sections: SectionInput[];
    medicines: MedicineInput[];
    follow_up_date: string | null;
    follow_up_duration_value: number | null;
    follow_up_duration_unit: 'days' | 'months' | 'years' | null;
    dirty: boolean;
}

export type PrescriptionAction =
    | { type: 'ADD_COMPLAINT'; complaint: ComplaintInput }
    | { type: 'REMOVE_COMPLAINT'; index: number }
    | { type: 'UPDATE_COMPLAINT_DURATION'; index: number; duration_text?: string; note?: string }
    | { type: 'ADD_EXAMINATION'; examination: ExaminationInput }
    | { type: 'UPDATE_EXAMINATION'; index: number; patch: Partial<ExaminationInput> }
    | { type: 'REMOVE_EXAMINATION'; index: number }
    | { type: 'ADD_SECTION'; section: SectionInput }
    | { type: 'UPDATE_SECTION'; index: number; content: string }
    | { type: 'REMOVE_SECTION'; index: number }
    | { type: 'ADD_MEDICINE'; medicine: MedicineInput }
    | { type: 'UPDATE_MEDICINE'; index: number; patch: Partial<MedicineInput> }
    | { type: 'REMOVE_MEDICINE'; index: number }
    | { type: 'REORDER_MEDICINES'; from: number; to: number }
    | {
          type: 'SET_FOLLOW_UP';
          follow_up_date: string | null;
          follow_up_duration_value: number | null;
          follow_up_duration_unit: 'days' | 'months' | 'years' | null;
      }
    | { type: 'LOAD_TEMPLATE'; template: { complaints?: ComplaintInput[]; examinations?: ExaminationInput[]; medicines?: MedicineInput[]; advices?: SectionInput[]; investigations?: SectionInput[]; id?: number } }
    | { type: 'RESET_FORM'; state: PrescriptionFormState }
    | { type: 'SET_STATUS'; status: PrescriptionFormState['status'] }
    | { type: 'MARK_CLEAN' };

function withDirty(s: PrescriptionFormState): PrescriptionFormState {
    return { ...s, dirty: true };
}

function reducer(state: PrescriptionFormState, action: PrescriptionAction): PrescriptionFormState {
    switch (action.type) {
        case 'ADD_COMPLAINT':
            return withDirty({ ...state, complaints: [...state.complaints, action.complaint] });

        case 'REMOVE_COMPLAINT':
            return withDirty({
                ...state,
                complaints: state.complaints.filter((_, i) => i !== action.index),
            });

        case 'UPDATE_COMPLAINT_DURATION': {
            const next = state.complaints.map((c, i) =>
                i === action.index
                    ? {
                          ...c,
                          duration_text: action.duration_text ?? c.duration_text,
                          note: action.note ?? c.note,
                      }
                    : c,
            );
            return withDirty({ ...state, complaints: next });
        }

        case 'ADD_EXAMINATION':
            return withDirty({ ...state, examinations: [...state.examinations, action.examination] });

        case 'UPDATE_EXAMINATION': {
            const next = state.examinations.map((e, i) =>
                i === action.index ? { ...e, ...action.patch } : e,
            );
            return withDirty({ ...state, examinations: next });
        }

        case 'REMOVE_EXAMINATION':
            return withDirty({
                ...state,
                examinations: state.examinations.filter((_, i) => i !== action.index),
            });

        case 'ADD_SECTION':
            return withDirty({ ...state, sections: [...state.sections, action.section] });

        case 'UPDATE_SECTION': {
            const next = state.sections.map((s, i) =>
                i === action.index ? { ...s, content: action.content } : s,
            );
            return withDirty({ ...state, sections: next });
        }

        case 'REMOVE_SECTION':
            return withDirty({
                ...state,
                sections: state.sections.filter((_, i) => i !== action.index),
            });

        case 'ADD_MEDICINE':
            return withDirty({ ...state, medicines: [...state.medicines, action.medicine] });

        case 'UPDATE_MEDICINE': {
            const next = state.medicines.map((m, i) =>
                i === action.index ? { ...m, ...action.patch } : m,
            );
            return withDirty({ ...state, medicines: next });
        }

        case 'REMOVE_MEDICINE':
            return withDirty({
                ...state,
                medicines: state.medicines.filter((_, i) => i !== action.index),
            });

        case 'REORDER_MEDICINES': {
            const list = [...state.medicines];
            const [moved] = list.splice(action.from, 1);
            list.splice(action.to, 0, moved);
            return withDirty({ ...state, medicines: list });
        }

        case 'SET_FOLLOW_UP':
            return withDirty({
                ...state,
                follow_up_date: action.follow_up_date,
                follow_up_duration_value: action.follow_up_duration_value,
                follow_up_duration_unit: action.follow_up_duration_unit,
            });

        case 'LOAD_TEMPLATE': {
            const advices = (action.template.advices ?? []).map((a) => ({
                section_type: 'advice' as const,
                content: a.content ?? '',
            })).filter((a) => a.content);
            const investigations = (action.template.investigations ?? []).map((a) => ({
                section_type: 'investigation' as const,
                content: a.content ?? '',
            })).filter((a) => a.content);
            const otherSections = state.sections.filter(
                (s) => s.section_type !== 'advice' && s.section_type !== 'investigation',
            );

            return withDirty({
                ...state,
                template_id: action.template.id ?? null,
                complaints: action.template.complaints ?? [],
                examinations: action.template.examinations ?? [],
                medicines: action.template.medicines ?? [],
                sections: [...otherSections, ...advices, ...investigations],
            });
        }

        case 'RESET_FORM':
            return { ...action.state, dirty: false };

        case 'SET_STATUS':
            return withDirty({ ...state, status: action.status });

        case 'MARK_CLEAN':
            return { ...state, dirty: false };

        default:
            return state;
    }
}

export function usePrescriptionReducer(initial: PrescriptionFormState) {
    return useReducer(reducer, initial);
}
