export interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    role: 'super_admin' | 'hospital_admin' | 'doctor' | 'receptionist';
    preferred_language?: 'en' | 'bn';
    hospital_id?: number;
    is_active: boolean;
    email_verified_at?: string;
    last_login_at?: string;
    hospital?: Hospital;
    doctor_profile?: DoctorProfile;
}

/** A bullet on a plan's landing-page card. `bn` falls back to `en` when blank. */
export interface PlanFeature {
    en: string;
    bn?: string | null;
}

export interface Plan {
    id: number;
    /** Stable machine key (`free`, `basic`, …). Set at create, never edited. */
    code: string;
    name: string;
    name_bn?: string | null;
    tagline?: string | null;
    tagline_bn?: string | null;
    /** Laravel serialises decimal columns as strings. */
    price_monthly: string | number;
    price_yearly?: string | number | null;
    /** null on any limit means UNLIMITED, never zero. */
    max_doctors: number | null;
    max_patients_per_month: number | null;
    max_prescriptions: number | null;
    trial_days: number;
    features?: PlanFeature[] | null;
    cta_label?: string | null;
    cta_label_bn?: string | null;
    is_public: boolean;
    is_featured: boolean;
    is_active: boolean;
    sort_order: number;
    created_at?: string;
    updated_at?: string;
    hospitals_count?: number;
}

/** Display-only currency config. There is no conversion anywhere in this app. */
export interface CurrencyConfig {
    code: string;
    symbol: string;
    name: string;
    decimals: number;
    position: 'before' | 'after';
}

export interface Hospital {
    id: number;
    name: string;
    slug: string;
    logo?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    plan_id?: number | null;
    plan?: Plan | null;
    billing_cycle: 'monthly' | 'yearly';
    /** The hospital's own money display currency, independent of plan pricing. */
    currency: string;
    subscription_status: 'active' | 'trial' | 'expired' | 'suspended';
    subscription_starts_at?: string;
    subscription_ends_at?: string;
    trial_ends_at?: string;
    /** null = inherit the plan's limit. A number is a super-admin exception. */
    max_doctors_override?: number | null;
    max_patients_per_month_override?: number | null;
    prescription_quota_used?: number;
    settings?: Record<string, unknown>;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    doctors_count?: number;
    patients_count?: number;
    prescriptions_count?: number;
}

export interface DoctorProfile {
    id: number;
    user_id: number;
    hospital_id: number;
    bmdc_number?: string;
    bmdc_verified?: boolean;
    bmdc_verified_at?: string | null;
    degrees?: string;
    specialization?: string;
    designation?: string;
    consultation_fee: number;
    follow_up_fee: number;
    prescription_header_image?: string;
    prescription_footer_image?: string;
    prescription_header_text?: string;
    prescription_footer_text?: string;
    signature_image?: string;
    default_prescription_language: 'bn' | 'en' | 'both';
    print_paper_size?: 'A4' | 'Letter';
    print_show_header?: boolean;
    print_show_footer?: boolean;
    print_show_logo?: boolean;
    print_header_mode?: 'image' | 'text' | 'none';
    print_footer_mode?: 'image' | 'signature' | 'none';
    print_font_size?: 'small' | 'medium' | 'large';
    print_margin_top?: number;
    print_margin_bottom?: number;
    print_margin_left?: number;
    print_margin_right?: number;
    notify_followup_reminders?: boolean;
    notify_email?: boolean;
}

export interface Patient {
    id: number;
    hospital_id: number;
    patient_uid: string;
    name: string;
    age_years?: number;
    age_months?: number;
    age_days?: number;
    date_of_birth?: string;
    gender: 'male' | 'female' | 'other';
    phone: string;
    email?: string;
    address?: string;
    blood_group?: string;
    profile_image?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    notes?: string;
    is_active: boolean;
    created_at: string;
    age_display?: string;
    allergies?: PatientAllergy[];
}

export interface PatientAllergy {
    id: number;
    allergen: string;
    note?: string | null;
}

export interface Appointment {
    id: number;
    hospital_id: number;
    doctor_id: number;
    patient_id: number;
    chamber_id?: number;
    appointment_date: string;
    serial_number: number;
    status: 'waiting' | 'in_progress' | 'completed' | 'absent' | 'cancelled';
    type: 'new_visit' | 'follow_up' | 'emergency';
    fee_amount: number;
    fee_paid: boolean;
    payment_method?: string;
    notes?: string;
    patient?: Patient;
    doctor?: User;
    chamber?: Chamber;
    prescription?: Pick<Prescription, 'id' | 'prescription_uid' | 'appointment_id'> | null;
}

export interface QueueStats {
    total: number;
    completed: number;
    waiting: number;
    in_progress: number;
    follow_ups: number;
    absent: number;
    total_earned: number;
    total_unpaid: number;
}

export interface HospitalHoliday {
    id: number;
    hospital_id: number;
    date: string;
    title: string;
    is_recurring_yearly: boolean;
}

/** One weekday's opening hours. Times are 24h "HH:mm" strings. */
export interface ChamberScheduleDay {
    start: string;
    end: string;
    active: boolean;
}

/** How consultation income is split between the doctor and the hospital. */
export type ChamberShareModel = 'full' | 'split' | 'rent';

export interface Chamber {
    id: number;
    doctor_id: number;
    hospital_id: number;
    name: string;
    room_number?: string | null;
    floor?: string | null;
    building?: string | null;
    /** Keyed by short day name — Sun, Mon, … */
    schedule?: Record<string, ChamberScheduleDay> | null;
    daily_slot_cap?: number | null;
    share_model?: ChamberShareModel | null;
    /** Only meaningful when share_model is 'split'. */
    share_percent_doctor?: number | string | null;
    /** Only meaningful when share_model is 'rent'. */
    rent_amount_monthly?: number | string | null;
    share_notes?: string | null;
    is_active: boolean;
    doctor?: Pick<User, 'id' | 'name'>;
}

export interface Prescription {
    id: number;
    hospital_id: number;
    doctor_id: number;
    patient_id: number;
    appointment_id?: number;
    prescription_uid: string;
    share_token?: string | null;
    date: string;
    follow_up_date?: string;
    follow_up_duration_value?: number;
    follow_up_duration_unit?: 'days' | 'months' | 'years';
    status: 'draft' | 'finalized' | 'printed';
    printed_at?: string;
    printed_count: number;
    patient?: Patient;
    doctor?: User;
    complaints?: PrescriptionComplaint[];
    examinations?: PrescriptionExamination[];
    sections?: PrescriptionSection[];
    medicines?: PrescriptionMedicine[];
}

export interface PrescriptionComplaint {
    id: number;
    complaint_name: string;
    duration_text?: string;
    note?: string;
    sort_order: number;
}

export interface PrescriptionExamination {
    id: number;
    examination_name: string;
    finding_value?: string;
    note?: string;
    sort_order: number;
}

export interface PrescriptionSection {
    id: number;
    section_type: string;
    content: string;
    sort_order: number;
}

export interface PrescriptionMedicine {
    id: number;
    medicine_id?: number;
    medicine_name: string;
    medicine_type?: string;
    strength?: string;
    generic_name?: string;
    dose_morning?: number;
    dose_noon?: number;
    dose_afternoon?: number;
    dose_night?: number;
    dose_bedtime?: number;
    dose_display?: string;
    timing?: string;
    duration_value?: number;
    duration_unit?: string;
    custom_instruction?: string;
    additional_doses?: Array<{
        dose_morning?: number | null;
        dose_noon?: number | null;
        dose_afternoon?: number | null;
        dose_night?: number | null;
        dose_bedtime?: number | null;
        duration_value?: number | null;
        duration_unit?: string | null;
        custom_instruction?: string | null;
        dose_display?: string | null;
    }> | null;
    sort_order: number;
}

export interface ComplaintMaster {
    id: number;
    name_en: string;
    name_bn?: string;
    category?: string;
}

export interface DoctorTemplate {
    id: number;
    doctor_id: number;
    disease_name: string;
    is_global: boolean;
    last_used_at?: string;
    use_count: number;
    updated_at: string;
    complaints?: Array<{ complaint_name: string; duration_text?: string; note?: string }>;
    examinations?: Array<{ examination_name: string; finding_value?: string; note?: string }>;
    medicines?: Array<Record<string, unknown>>;
    advices?: Array<{ section_type: string; content: string }>;
    investigations?: Array<{ section_type: string; content: string }>;
}

export interface AdviceSuggestion {
    en: string;
    bn: string;
}

export interface Medicine {
    id: number;
    brand_name: string;
    generic_name?: string;
    type: string;
    strength?: string;
    manufacturer?: string;
    price?: number;
    is_active: boolean;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    locale: 'en' | 'bn';
    /** Money display currency for the current context — see App\Support\Money. */
    currency: CurrencyConfig;
    flash: {
        success?: string;
        error?: string;
    };
};

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface PaginatedData<T> {
    data: T[];
    meta: PaginationMeta;
    /** present when using raw paginator toArray() instead of paginateFor() */
    links?: { url: string | null; label: string; active: boolean }[];
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    from?: number | null;
    to?: number | null;
}
