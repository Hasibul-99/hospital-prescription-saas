# 02 — Database schema

19 tables total. Migrations live in [../database/migrations/](../database/migrations/) and are dated to enforce order.

Legend: 🌍 = global (not hospital-scoped) · 🏥 = tenant-scoped · 🔐 = soft-deletes

## Tenant & auth layer

### 🏥🔐 `hospitals`
`id`, `name`, `slug` (unique, URL key), `logo`, `address`, `phone`, `email`, `website`, `subscription_plan` (free/basic/premium/enterprise), `subscription_status` (active/trial/expired/suspended), `subscription_starts_at`, `subscription_ends_at`, `trial_ends_at`, `max_doctors`, `max_patients_per_month`, `settings` (JSON: language, prescription_format, currency, timezone), `is_active`, `created_by` → users.id, timestamps.

### 🔐 `users`
Mixed — super admins are global, everyone else is tenant-scoped.
`id`, `name`, `email` (unique), `password`, `phone`, `avatar`, `role` ENUM(super_admin, hospital_admin, doctor, receptionist), `hospital_id` (**nullable** — null only for super_admin), `is_active`, `email_verified_at`, `last_login_at`, timestamps.

### 🏥 `doctor_profiles`
Extends users where `role = doctor`.
`id`, `user_id`, `hospital_id`, `bmdc_number`, `degrees`, `specialization`, `designation`, `consultation_fee`, `follow_up_fee`, `prescription_header_image`, `prescription_footer_image`, `prescription_header_text`, `prescription_footer_text`, `signature_image`, `default_prescription_language` (bn/en/both), timestamps.

### 🏥 `chambers`
A doctor can have multiple chambers within a hospital.
`id`, `doctor_id`, `hospital_id`, `name`, `room_number`, `floor`, `building`, `schedule` (JSON: array of `{day_of_week, start_time, end_time, max_patients}`), `is_active`, timestamps.

### 🏥 `hospital_holidays`
`id`, `hospital_id`, `date`, `title`, `is_recurring_yearly`, timestamps.

## Patient layer

### 🏥🔐 `patients`
`id`, `hospital_id`, `patient_uid` (human-readable — unique per hospital, e.g., `P-DMC-00142`), `name`, `age_years`, `age_months`, `age_days`, `date_of_birth` (nullable), `gender` ENUM(male/female/other), `phone`, `email`, `address`, `blood_group`, `profile_image`, `emergency_contact_name`, `emergency_contact_phone`, `notes`, `is_active`, timestamps.

**UNIQUE** `(hospital_id, phone)` — same phone can exist across hospitals but not within one.

## Appointment layer

### 🏥 `appointments`
`id`, `hospital_id`, `doctor_id`, `patient_id`, `chamber_id`, `appointment_date`, `serial_number` (auto per doctor per day per chamber), `status` ENUM(waiting, in_progress, completed, absent, cancelled), `type` ENUM(new_visit, follow_up, emergency), `fee_amount`, `fee_paid`, `payment_method`, `notes`, `created_by` → users.id, timestamps.

## Prescription layer

### 🏥🔐 `prescriptions`
`id`, `hospital_id`, `doctor_id`, `patient_id`, `appointment_id`, `prescription_uid` (`RX-H001-20251024-0001`), `date`, `follow_up_date`, `follow_up_duration_value`, `follow_up_duration_unit` (days/months/years), `template_id` (nullable → doctor_templates.id), `status` ENUM(draft, finalized, printed), `printed_at`, `printed_count`, timestamps.

### 🏥 `prescription_complaints`
`id`, `prescription_id`, `complaint_name`, `duration_text`, `note`, `sort_order`, timestamps.

### 🏥 `prescription_examinations`
`id`, `prescription_id`, `examination_name`, `finding_value`, `note`, `sort_order`, timestamps.

### 🏥 `prescription_sections`
Flexible store for everything that's just free-text per section.
`id`, `prescription_id`, `section_type` ENUM(past_history, drug_history, investigation, diagnosis, advice, next_plan, hospitalization, operation_note), `content`, `sort_order`, timestamps.

### 🏥 `prescription_medicines`
`id`, `prescription_id`, `medicine_id` (nullable — for manual entries), `medicine_name`, `medicine_type` (Tab/Syp/Cap/Inj/Supp/Cream/Drops/Mouthwash/Toothpaste/Gel/Powder/Suspension/Ointment), `strength`, `generic_name`, `dose_morning`, `dose_noon`, `dose_afternoon`, `dose_night`, `dose_bedtime` (each nullable decimal), `dose_display` (denormalized string, e.g., `"1+0+1+0+1"`), `timing` ENUM(before_meal, after_meal, empty_stomach, with_food, custom), `duration_value`, `duration_unit` ENUM(days/weeks/months/years/continue/N_A), `custom_instruction`, `sort_order`, timestamps.

## Master data layer

### 🌍 `medicines`
`id`, `brand_name`, `generic_name`, `type` ENUM(Tablet, Syrup, Capsule, Injection, Suppository, Cream, Drops, Mouthwash, Toothpaste, Gel, Powder, Suspension, Ointment, Inhaler), `strength`, `manufacturer`, `price`, `is_active`, timestamps.
**FULLTEXT** index on `(brand_name, generic_name)` — on MySQL. In SQLite dev, fall back to `LIKE`.

### 🌍 `complaint_masters`
`id`, `name_en`, `name_bn`, `category`, `sort_order`, `is_active`, timestamps.

### 🌍 `complaint_duration_presets`
`id`, `complaint_master_id`, `duration_text_en`, `duration_text_bn`, `sort_order`, timestamps.

## Doctor personalization layer

### 🏥 `doctor_templates`
`id`, `doctor_id`, `hospital_id`, `disease_name`, `complaints` (JSON), `examinations` (JSON), `medicines` (JSON), `advices` (JSON), `investigations` (JSON), `is_global` (admin-curated vs personal), `last_used_at`, `use_count`, timestamps.

**Global templates** (`is_global = true`) appear in every doctor's sidebar at their hospital. A doctor changing hospitals does NOT carry their personal templates.

### `doctor_medicine_defaults`
Per-doctor preferred dose for each medicine. NOT hospital-scoped — doctors keep their preferences across hospital moves.
`id`, `doctor_id`, `medicine_id`, `dose_morning`, `dose_noon`, `dose_afternoon`, `dose_night`, `dose_bedtime`, `timing`, `duration_value`, `duration_unit`, `custom_instruction`, timestamps.

### `doctor_frequent_medicines`
Quick-access list, max 50 entries per doctor.
`id`, `doctor_id`, `medicine_id`, `sort_order`, timestamps.

## Reporting layer

### 🏥 `daily_statements`
Pre-aggregated per doctor per day — speeds up statement/report pages.
`id`, `hospital_id`, `doctor_id`, `date`, `total_patients`, `total_new_patients`, `total_follow_ups`, `total_earned`, `total_paid`, `total_unpaid`, timestamps.
Written by a daily job (Laravel scheduler).

## Indexes (composite)

Required for query performance at scale:

- `patients (hospital_id, phone)` — UNIQUE
- `patients (hospital_id, name)`
- `appointments (hospital_id, doctor_id, appointment_date)`
- `appointments (hospital_id, patient_id)`
- `prescriptions (hospital_id, doctor_id, date)`
- `prescriptions (hospital_id, patient_id, date)`
- `prescription_medicines (prescription_id, sort_order)`
- `medicines (brand_name)` FULLTEXT
- `medicines (generic_name)` FULLTEXT

## Relationships cheat-sheet

```
Hospital 1─┬─* users
           ├─* doctor_profiles (via users where role=doctor)
           ├─* chambers
           ├─* hospital_holidays
           ├─* patients
           ├─* appointments
           ├─* prescriptions
           └─* daily_statements

User (doctor) 1─┬─1 doctor_profile
                ├─* chambers
                ├─* appointments (as doctor)
                ├─* prescriptions (as doctor)
                ├─* doctor_templates
                ├─* doctor_medicine_defaults
                └─* doctor_frequent_medicines

Patient 1─┬─* appointments
          └─* prescriptions

Prescription 1─┬─* prescription_complaints
               ├─* prescription_examinations
               ├─* prescription_sections
               └─* prescription_medicines

Medicine 1─┬─* prescription_medicines
           ├─* doctor_medicine_defaults
           └─* doctor_frequent_medicines
```
