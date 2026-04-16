# Online Prescription Software — SaaS Multi-Tenant Architecture

## Prompts for Building with Laravel 11 + React 18 + Inertia.js

> **Architecture**: Multi-tenant SaaS where a Super Admin manages hospitals/clinics as tenants. Each hospital has its own doctors, patients, and data — completely isolated. Doctors can only see patients within their assigned hospital.

---

## Prompt 1: Multi-Tenant Database Architecture & Project Setup

```
I'm building a multi-tenant SaaS prescription management software using Laravel 11, React 18, and Inertia.js.

**Architecture**: Single database, tenant-scoped using hospital_id. A Super Admin creates and manages hospitals. Each hospital is a tenant with isolated data.

Design the complete database schema with migrations:

### Tenant & Auth Layer

1. **hospitals** (tenants)
   - id, name, slug (unique, used in URL), logo, address, phone, email, website
   - subscription_plan (free/basic/premium/enterprise), subscription_status (active/trial/expired/suspended)
   - subscription_starts_at, subscription_ends_at, trial_ends_at
   - max_doctors (plan limit), max_patients_per_month (plan limit)
   - settings JSON (default language, prescription format, currency, timezone)
   - is_active (boolean), created_by (admin user), soft deletes, timestamps

2. **users** (all user types in one table)
   - id, name, email, password, phone, avatar
   - role ENUM: super_admin, hospital_admin, doctor, receptionist
   - hospital_id (nullable — null for super_admin, required for others)
   - is_active, email_verified_at, last_login_at, soft deletes, timestamps

3. **doctor_profiles** (extends users where role=doctor)
   - id, user_id, hospital_id
   - bmdc_number, degrees, specialization, designation
   - consultation_fee, follow_up_fee
   - prescription_header_image, prescription_footer_image
   - prescription_header_text, prescription_footer_text
   - signature_image
   - default_prescription_language (bn/en/both)
   - timestamps

4. **chambers** (a doctor can have multiple chambers within a hospital)
   - id, doctor_id, hospital_id
   - name, room_number, floor, building
   - schedule JSON (day_of_week, start_time, end_time, max_patients)
   - is_active, timestamps

5. **hospital_holidays**
   - id, hospital_id, date, title, is_recurring_yearly, timestamps

### Patient Layer

6. **patients**
   - id, hospital_id (tenant scope)
   - patient_uid (auto-generated, unique per hospital: e.g., H001-P0001)
   - name, age_years, age_months, age_days, date_of_birth (nullable)
   - gender ENUM (male/female/other)
   - phone, email (nullable), address, blood_group
   - profile_image, emergency_contact_name, emergency_contact_phone
   - notes (text), is_active, soft deletes, timestamps
   - UNIQUE constraint on (hospital_id, phone) to prevent duplicates within a hospital

### Appointment Layer

7. **appointments**
   - id, hospital_id, doctor_id, patient_id, chamber_id
   - appointment_date, serial_number (auto per doctor per day)
   - status ENUM: waiting, in_progress, completed, absent, cancelled
   - type ENUM: new_visit, follow_up, emergency
   - fee_amount, fee_paid (boolean), payment_method (nullable)
   - notes, created_by (user_id — receptionist or doctor)
   - timestamps

### Prescription Layer

8. **prescriptions**
   - id, hospital_id, doctor_id, patient_id, appointment_id
   - prescription_uid (auto: e.g., RX-H001-20251024-0001)
   - date, follow_up_date, follow_up_duration_value, follow_up_duration_unit (days/months/years)
   - template_id (nullable — if created from template)
   - status ENUM: draft, finalized, printed
   - printed_at, printed_count
   - soft deletes, timestamps

9. **prescription_complaints**
   - id, prescription_id
   - complaint_name, duration_text, note, sort_order
   - timestamps

10. **prescription_examinations**
    - id, prescription_id
    - examination_name, finding_value, note, sort_order
    - timestamps

11. **prescription_sections** (flexible for: past_history, drug_history, investigations, diagnosis, advices, next_plans, hospitalizations, operation_notes)
    - id, prescription_id
    - section_type ENUM (past_history, drug_history, investigation, diagnosis, advice, next_plan, hospitalization, operation_note)
    - content (text), sort_order
    - timestamps

12. **prescription_medicines**
    - id, prescription_id, medicine_id (nullable for manual entry)
    - medicine_name, medicine_type (Tab/Syp/Cap/Inj/Supp/Cream/Drops/Mouthwash/Toothpaste/Gel/Powder/Suspension/Ointment)
    - strength, generic_name
    - dose_morning, dose_noon, dose_afternoon, dose_night, dose_bedtime (each nullable decimal)
    - dose_display (string: e.g., "1+0+1+0+1")
    - timing ENUM: before_meal, after_meal, empty_stomach, with_food, custom
    - duration_value (int), duration_unit ENUM (days/weeks/months/years/continue/N_A)
    - custom_instruction (text)
    - sort_order
    - timestamps

### Master Data Layer

13. **medicines** (global, shared across all hospitals)
    - id, brand_name, generic_name
    - type ENUM (Tablet, Syrup, Capsule, Injection, Suppository, Cream, Drops, Mouthwash, Toothpaste, Gel, Powder, Suspension, Ointment, Inhaler)
    - strength, manufacturer, price
    - is_active, timestamps
    - Full-text index on (brand_name, generic_name)

14. **complaint_masters** (global)
    - id, name_en, name_bn, category, sort_order, is_active, timestamps

15. **complaint_duration_presets** (global)
    - id, complaint_master_id
    - duration_text_en, duration_text_bn, sort_order
    - timestamps

### Doctor Personalization Layer

16. **doctor_templates**
    - id, doctor_id, hospital_id
    - disease_name, complaints JSON, examinations JSON, medicines JSON, advices JSON, investigations JSON
    - is_global (boolean — admin-curated vs personal)
    - last_used_at, use_count, timestamps

17. **doctor_medicine_defaults** (per-doctor default dose for each medicine)
    - id, doctor_id, medicine_id
    - dose_morning, dose_noon, dose_afternoon, dose_night, dose_bedtime
    - timing, duration_value, duration_unit, custom_instruction
    - timestamps

18. **doctor_frequent_medicines** (quick-access list)
    - id, doctor_id, medicine_id, sort_order, timestamps

### Reporting Layer

19. **daily_statements**
    - id, hospital_id, doctor_id, date
    - total_patients, total_new_patients, total_follow_ups
    - total_earned, total_paid, total_unpaid
    - timestamps

### Global Scoping
- Every model except `medicines`, `complaint_masters`, `complaint_duration_presets`, and super_admin `users` MUST be scoped by `hospital_id`.
- Create a `BelongsToHospital` trait that auto-applies `hospital_id` global scope based on the authenticated user's hospital.
- Create a `HospitalScope` middleware that injects hospital_id into all queries.
- Add proper indexes: (hospital_id, doctor_id), (hospital_id, patient_id), (hospital_id, appointment_date), (hospital_id, phone) on patients.
- Use UUIDs for patient_uid and prescription_uid (human-readable), keep auto-increment IDs for internal relations.
- All models should use soft deletes.

Generate: All migrations, all Eloquent models with relationships, the BelongsToHospital trait, and the HospitalScope middleware.
```

---

## Prompt 2: Role-Based Auth, Super Admin & Hospital Management

```
Using the schema from Prompt 1, build the authentication and admin management system:

### Authentication (Laravel Breeze + Inertia.js React)
1. Login page with email/password. After login, redirect based on role:
   - super_admin → /admin/dashboard
   - hospital_admin → /hospital/dashboard
   - doctor → /doctor/dashboard
   - receptionist → /receptionist/dashboard
2. Forgot password, email verification flows.
3. Middleware: `role:super_admin`, `role:hospital_admin`, `role:doctor`, `role:receptionist`. 
4. A `EnsureHospitalActive` middleware that blocks access if the hospital's subscription is expired or suspended (except for super_admin).

### Super Admin Panel (React + Inertia pages under /admin/*)
1. **Dashboard**: Total hospitals, total doctors, total prescriptions generated (all-time), active subscriptions count, revenue chart (monthly), recent hospital registrations.
2. **Hospital Management** (/admin/hospitals):
   - List all hospitals with: name, slug, plan, status, doctor count, patient count, created date, actions.
   - Create Hospital form: name, slug (auto-generated from name), logo upload, address, phone, email, plan selection, max_doctors, max_patients_per_month.
   - Edit Hospital: all fields + toggle is_active, change plan, extend subscription.
   - View Hospital detail: see all doctors, patients count, prescriptions count, usage stats.
   - Suspend/Activate hospital.
3. **User Management** (/admin/users):
   - List all users filterable by hospital and role.
   - Create user: assign to a hospital, set role. For doctors, also create doctor_profile.
   - Edit/deactivate users.
4. **Medicine Database** (/admin/medicines):
   - CRUD for global medicines. Bulk import from CSV.
   - Manage complaint masters and duration presets.
5. **Global Templates** (/admin/templates):
   - Create/edit disease templates marked as `is_global=true`, available to all doctors.
6. **Subscription & Billing** (basic):
   - View all hospitals' subscription status.
   - Manually extend/change subscriptions (no payment gateway yet — just admin-managed).

### Hospital Admin Panel (React + Inertia pages under /hospital/*)
1. **Dashboard**: Today's patients across all doctors, total doctors, total patients, weekly/monthly stats.
2. **Doctor Management**: Add/edit/deactivate doctors within their hospital. Create doctor profiles with all fields (BMDC, degrees, specialization, fees, header/footer images).
3. **Receptionist Management**: Add/edit receptionists.
4. **Chamber Management**: CRUD chambers, assign to doctors.
5. **Holiday Management**: Add/edit hospital holidays.
6. **Hospital Settings**: Update hospital info, logo, default language, prescription format.
7. **Reports**: Hospital-wide daily/monthly patient stats, revenue reports, doctor-wise breakdown.

### Authorization
- Use Laravel Policies for each model.
- super_admin can access everything.
- hospital_admin can only manage their own hospital's resources.
- doctor can only see their own patients and prescriptions (within their hospital).
- receptionist can manage appointments and patients (within their hospital) but NOT create/edit prescriptions.
- All queries must be automatically scoped by hospital_id using the global scope trait.

Generate: All routes (web.php organized by role), controllers, middleware, policies, and React pages with Inertia.
```

---

## Prompt 3: Patient Management (Hospital-Scoped)

```
Build the patient management module. All patient data is scoped to hospital_id — a doctor in Hospital A cannot see patients from Hospital B.

### Patient Registration
1. **Registration Form** (modal or full page):
   - Name, Age (years/months/days inputs OR date of birth with auto-age calculation)
   - Gender (Male/Female/Other radio buttons)
   - Phone (required, unique within hospital), Email (optional)
   - Address, Blood Group dropdown
   - Profile photo upload (webcam capture option too)
   - Emergency contact name & phone
   - Notes (free text)
   - Auto-generate patient_uid: format "P-{hospital_short_code}-{sequential_number}" e.g., P-DMC-00142
2. **Duplicate Detection**: Before saving, check if phone number already exists in the same hospital. If yes, show existing patient and ask: "This patient already exists. View profile?" or "Create anyway?"

### Patient Search (used everywhere — dashboard, prescription, appointments)
1. Global search bar (appears in top nav) that searches within the current hospital only.
2. Search by: name (partial match), phone (partial match), patient_uid (exact).
3. Debounced (300ms) live search with dropdown results showing: name, age/gender, phone, patient_uid, last visit date.
4. API endpoint: GET /api/patients/search?q=xxx — scoped by hospital_id automatically.

### Patient Profile Page (/doctor/patients/{id} or /hospital/patients/{id})
1. **Header**: Photo, name, age/gender, phone, patient_uid, blood group, registration date.
2. **Visit History Tab**: All appointments & prescriptions chronologically (newest first). Each entry shows: date, doctor name, diagnosis summary, view prescription link.
3. **Prescription Timeline**: Visual timeline of all prescriptions. Click to expand and see full prescription details inline.
4. **"New Prescription" button**: Opens prescription builder pre-filled with this patient.
5. **"Follow-up Prescription" button**: Creates a new prescription pre-populated with the most recent prescription's data for quick editing.
6. **Edit Patient Info**: Inline editable fields.

### Patient List Page
1. Table with columns: Patient UID, Name, Age/Gender, Phone, Last Visit, Total Visits, Actions.
2. Filters: Gender, Age range, Blood group, Date range (registered between).
3. Sorting by any column.
4. Pagination (25 per page).
5. Export to CSV button.

### Access Control
- Doctors see patients they've treated (have prescriptions for) + all patients registered in their hospital.
- Receptionists see all patients in their hospital (for appointment booking) but cannot view prescription details.
- Hospital admins see all patients in their hospital with full access.
- Super admins can view any hospital's patients.

Generate: PatientController, Patient model methods, search API, React components (PatientForm, PatientSearch, PatientProfile, PatientList), Inertia pages.
```

---

## Prompt 4: Appointment & Serial Queue System

```
Build the appointment/serial queue management system:

### Serial Queue Dashboard (main working screen for receptionist & doctor)
1. **Date selector** at top (defaults to today).
2. **Chamber selector** (if doctor has multiple chambers).
3. **Patient Queue Table**:
   - Columns: Serial #, Patient (name, age/gender, UID, phone), Status badge, Type (New/Follow-up/Emergency), Actions.
   - Status flow: Waiting → In Progress → Completed. Also: Absent, Cancelled.
   - Actions per row: ✏️ Edit, ➕ Create Prescription (redirects to builder), 🖨️ Print last prescription, ☑️ Mark Complete, ❌ Mark Absent.
   - Color coding: Waiting (gray), In Progress (blue pulse), Completed (green), Absent (red strikethrough).
4. **Action Bar**: 
   - "+ New Appointment" button → opens modal to search/select patient (or register new) and add to queue.
   - "Refresh" button.
   - "Break" toggle (pauses queue, shows "Doctor on break" to any queue display).
   - "→ Next" button (marks current as completed, moves next to in_progress).
5. **Auto serial numbering**: Per doctor, per chamber, per day. Starts from 1 each day.
6. **Quick Stats**: Cards showing — Today's Total, Completed, Waiting, Follow-ups, Absent, Total Earned.

### Appointment Booking
1. **Add Appointment Modal**:
   - Patient search field (existing patient) OR "Register New Patient" link.
   - Select date (today or future).
   - Select chamber.
   - Type: New Visit / Follow-up / Emergency.
   - Fee amount (auto-filled from doctor_profile.consultation_fee, editable).
   - Fee paid checkbox + payment method dropdown.
   - Notes (optional).
   - Save → adds to queue with next serial number.
2. **Follow-up auto-booking**: When a prescription has a follow_up_date, auto-create a pending appointment for that date (status: waiting).

### Follow-up Management
1. **Follow-up List Page** (/doctor/follow-ups):
   - List of patients due for follow-up, filterable by date range.
   - Columns: Patient, Original Prescription Date, Follow-up Due Date, Status (Due/Overdue/Completed), Actions (Book Appointment, View Prescription).
   - Highlight overdue follow-ups in red.

### Daily Statement
1. **Statement Page** (/doctor/statements):
   - Date range picker.
   - Summary: Total patients, New patients, Follow-ups, Total earned, Paid, Unpaid.
   - Breakdown table by appointment.
   - Print button.

### Multi-Chamber Support
1. Doctor can switch active chamber from a dropdown in the nav.
2. Each chamber has independent serial numbering and schedule.
3. Schedule display: Show which chambers are active on which days.

### Holiday Management (Hospital Admin)
1. Calendar view to add/remove holidays.
2. Recurring yearly holidays (e.g., Independence Day).
3. Block appointment booking on holidays — show "Holiday: {title}" message.

### Real-time Updates
1. Use Laravel Events + polling (every 10 seconds) to refresh queue status.
2. When receptionist adds a patient, doctor's screen updates.
3. When doctor completes a patient, receptionist's screen updates.

Generate: AppointmentController, SerialQueueController, FollowUpController, StatementController, all React components, Inertia pages.
```

---

## Prompt 5: Prescription Builder — Core Form

```
Build the main prescription creation page (/doctor/prescriptions/create?patient_id=X&appointment_id=Y). This is the MOST CRITICAL feature of the entire application.

### Layout (Desktop — full width, no sidebar navigation during prescription writing)

**Left Sidebar (250px fixed)**:
- Search input to filter templates.
- List of doctor's saved templates: disease name + "Updated: date". 
- Grouped: "My Templates" and "Global Templates".
- Clicking a template auto-fills the ENTIRE form (complaints, examination, medicines, advices, etc.).
- Active template highlighted.

**Main Content (fluid width)**:

**Patient Info Bar** (sticky top, always visible):
- Name: {name} | Age: {age} Years | Gender: {gender} | Date: {today} | ID: {patient_uid}
- "Previous Prescriptions" button → opens drawer/modal showing this patient's past prescriptions at this hospital.

**Form — organized in collapsible accordion sections with green ⊕ buttons:**

#### Section 1: Patient Complaints
- Click ⊕ → opens **Complaint Picker Modal**:
  - Search bar at top.
  - Tag cloud of 60+ common complaints: Fever, Weakness, Cough, Memory loss, Vomiting, Chest pain, Itching, Swelling of legs, Sleep disturbances, Abdominal pain, Vaginal discharge, Constipation, Poor feeding, Skin discoloration, Burning during urination, Headache, Blood in stool, Pain, Mood swings, Ringing in ears, Hemoptysis, Chills, Lower abdominal pain, Abdominal cramp, Rash, Fatigue on exertion, Hallucinations, Nasal congestion, Noisy breathing, Irregular periods, Upper Abdominal Burning, Skin dryness, High blood pressure, Lack of concentration, Nosebleed, Joint pain, Sore throat, Irregular heartbeat, Suicidal thoughts, Post prandial bloating, Throat pain, Abdomen Pain, Diarrhea, Back pain, Loss of appetite, Heavy bleeding, Headache (migraine, cluster, tension-type), Cough and cold, Voice change, Abdominal Fullness, Neck pain, Dizziness, Painful periods, Epigastric pain, Nail changes, Seizures, Difficulty swallowing, Weight loss, Heartburn (Acid reflux), Swelling of joints, Nausea, Pregnancy-related symptoms.
  - Clicking a complaint adds it, then shows **Duration Picker** below it:
    - Pre-built duration tags (blue chips): "05 days, high grade, continued", "3 days", "2 day", "1 month", "7 day", "4 day", "7days", "3days", "6 days", "for 5 days", "AT NIGHT", "for 7-8 days", "103", "5 days", "FOR 4 DAY", "3d", "for 7 days", "4 days", "For 5days", "7 days", "2day", "For few days", "7 days, back-now feverish", "15 days", "for 3 days", "2 days", "more than 10 days", "20-25 days", "2 month", "1 month- Now for 2 month", "4days", "for 2 days", "3 month", "1 day", "20 days+", "For 4 days", "5 day", "for 6 days", "for 20 days", "6 day", "2 Months", "Frequent", "High Temperature", "02 days, high, grade, continued", "2 days, high grade continued", "1 day", "for 2days", "5 days, Shivering with fever", "2weeks", "1 years", "8days", "11 days", "3 d"
    - Free-text "Note" input for custom details.
  - Multiple complaints can be added. Each shows as a chip with ❌ remove button.
- Display: Listed as bullets with duration, e.g., "• Fever — 3 days" "• Cough — 7days"

#### Section 2: On Examination
- Click ⊕ → add examination findings. Fields: examination name (searchable/free-text), value/finding, note.
- Common examinations auto-suggested: Temperature, BP, Pulse, SpO2, Weight, Height, BMI (auto-calc).

#### Section 3: Past History
- Click ⊕ → free-text entry for past medical history items.

#### Section 4: Drug History
- Click ⊕ → free-text entry for current/past medications.

#### Section 5: Investigations
- Click ⊕ → add investigation items (CBC, Blood Sugar, X-ray, etc.) with searchable suggestions.

#### Section 6: Diagnosis
- Click ⊕ → free-text or searchable diagnosis entry.

#### Section 7: Rx (Treatment Plan) — THE MAIN SECTION
- This is built in the next prompt (Prompt 6). Placeholder here.

#### Section 8: Advices
- Click ⊕ → add advice lines. Free-text with common suggestions:
  "পরীক্ষা করে দেখান" (Get tests done), "প্রচুর পানি খাবেন" (Drink plenty of water), "বিশ্রাম নিবেন" (Take rest), etc.

#### Section 9: Next Plans
- Click ⊕ → free-text for next steps.

#### Section 10: Hospitalizations
- Click ⊕ → free-text for hospitalization notes.

#### Section 11: Operation Notes
- Click ⊕ → free-text for operation/procedure notes.

#### Follow-up Section (always visible at bottom):
- "Next Follow up" label.
- Date picker input (mm/dd/yyyy).
- Quick-select buttons: 1, 7, 15, 30, 90, 180 (days from today — clicking sets the date automatically).
- "After ___" input with unit radio buttons: Days / Months / Years.
- "Save as Template" row: Template Name input + "Save as Template" button.

**Bottom Action Bar (sticky bottom)**:
- "Update" button (saves as draft).
- "Update + Print" button (saves and opens print preview).

### State Management
- Use `useReducer` for the entire prescription form state with actions: ADD_COMPLAINT, REMOVE_COMPLAINT, UPDATE_COMPLAINT_DURATION, ADD_EXAMINATION, ADD_MEDICINE, UPDATE_MEDICINE, REMOVE_MEDICINE, REORDER_MEDICINES, SET_FOLLOW_UP, LOAD_TEMPLATE, RESET_FORM.
- Auto-save draft every 30 seconds to prevent data loss (store in prescription with status=draft).
- Track dirty state to warn before leaving page with unsaved changes.

### Hospital Scoping
- When loading complaint_masters, load from global table.
- When loading templates, load doctor's personal templates + global templates.
- Patient lookup restricted to current hospital.
- Prescription saved with hospital_id from authenticated user's hospital.

Generate: PrescriptionBuilderController, all React components (PrescriptionBuilder, ComplaintPicker, DurationPicker, SectionAccordion, FollowUpPicker, TemplateSelector), useReducer with all actions, auto-save logic.
```

---

## Prompt 6: Medicine Entry System (Within Prescription Builder)

```
Build the medicine entry system — the Rx section inside the prescription builder:

### Adding a Medicine

**"+ Add Medicine" button** in the Rx section → opens **Add Medicine Modal** (full-screen modal on mobile, 800px modal on desktop):

**Left Pane (300px): "Commonly used drugs"**
- List of doctor's frequently prescribed medicines (from doctor_frequent_medicines table).
- Each item shows: "• {brand_name} ({type}, {strength})" e.g., "• Indever (Tablet, 10 mg)"
- Clicking any item instantly adds it to the prescription with the doctor's saved default dose (from doctor_medicine_defaults).
- This list is personalized per doctor.
- Examples from the screenshots:
  - Indever (Tablet, 10 mg) • Bislol (Tablet, 2.5 mg)
  - Rupa (Tablet, 5 mg) • Ecosprin (Tablet Enteric Coated, 75 mg)
  - Ace (Syrup, 120 mg/5 ml) • Betaloc (Tablet, 50 mg)
  - Edemide (Tablet, 20 mg+50 mg) • Azithrocin (Tablet, 500 mg)
  - Napa (Tablet, 500 mg)
  - Nitroren SR (Tablet Sustained Release, 2.6 mg)
  - Omet (Tablet, 20 mg) • Ace (Tablet, 500 mg)
  - Dextac (Capsule Delayed Release, 30 mg)
  - Zithrin (Tablet, 500 mg) • Fuca (Gel, 0.3%) • Beklo (Tablet, 10 mg)
  - Neoflex (Tablet, 500 mg) • Pethidine 50 (Injection, 50 mg/ml)
  - Rivotril (Tablet, 0.25 mg) • Rupin (Oral Solution, 5 mg/5 ml)
  - Abicox Plus (Oral Suspension, 500 mg+267 mg+160 mg/10 ml)
  - Napa (Suppository, 500 mg) • Nafgel (Cream, 2%)
  - Xinc B (Syrup) • Nexotal (Tablet, 5 mg) • Rupa (Tablet, 10 mg)
  - Oral-C Pro-Expert (Mouthwash, 0.05%)
  - Intravas (SC Injection, 8000 Anti-Xa IU/0.8 ml)
  - Norium (Tablet, 10 mg) • Pantonix (Tablet Enteric Coated, 20 mg)
  - Bislol (Tablet, 5 mg) • Zurid (Syrup)
  - Zithrin (Powder for Suspension, 200 mg/5 ml) • Zabilit (Tablet)
  - Zif-CI (Capsule Timed Release, 50 mg+50 mg/1.00 mg)

**Right Pane: Medicine Search & Selection**
- **"Medicine Missing? Add"** link at top-right (lets doctor add new medicine manually).
- "Medicine" label with search input: "Type medicine name..."
- As doctor types, show autocomplete results from the 30,000+ medicine database.
- Results grouped by type: Tablet, Syrup, Capsule, etc.
- Each result shows: brand_name (type, strength) — generic_name — manufacturer.
- Search must be FAST (< 200ms). Use server-side search with database full-text index + Redis cache for top 1000 medicines.
- Clicking a result selects it and adds to the current prescription.
- Below the search, show the medicine already added (if editing): "1. Tab. Napa" with dose details and edit/delete icons.

### Dose Configuration Modal

After selecting a medicine, open the **Dose Configuration Modal**:

**Header**: "Tab. {medicine_name}" (e.g., "Tab. Napa")

**Dose Schedule Row**:
- Checkboxes with labels: ✅ সকাল (Morning) ✅ দুপুর (Noon) ✅ বিকাল (Afternoon) ✅ রাত (Night) ☐ শয়নে (Bedtime) — each with ✏️ edit icon
- Below each checked box: a numeric input for dose amount (default 1)
- Example: 1 | 1 | 1 | 1 with a dropdown for "বেলা" (times/schedule)
- **"+ Add more"** link to add split/additional dose rows.

**Instruction or custom time**:
- Textarea for custom instructions.
- Below it, a text input that pre-fills with common instructions.
- **Pre-built instruction tags** (clickable chips, clicking inserts into textarea):
  - "খাবারের পরে" (After meal)
  - "খাবারের আগে" (Before meal)
  - "0/6+0/6+0/6 খাবারের পরে"
  - "If Fever or Pain"
  - "2/3 অথবা তিন ও চার ঘণ্টা পরপর খাবারের পরে" 
  - "1/0+1/0+1+1/0 খাবারের পরে"
  - "খাবারের সাথে"
  - "খুব 100°F এ বা তার চেয়ে বেশি হলে" (If temp 100°F or higher)
  - "যন্ত্রণা থাকলে থাক" (If Pain)
  - "খানিকটা বাসায়ে পর" (custom timing)

**Take For (Duration)**:
- Checkbox/radio options: ☐ 1 ☐ 5 ☐ 7 ☐ 14 ☐ 30 days + custom input
- Additional: ☐ চলবে (Continue) ☐ সময় (Duration) ☐ N/A

**"Set as default settings for this medicine"** checkbox:
- When checked, saves this dose config as the doctor's default for this medicine.
- Next time this medicine is selected, these settings auto-fill.

**Buttons**: "Close" (cancel) | "✏️ Update" (save dose config)

### Medicine List Display in Prescription

After adding medicines, display them as a numbered list in the Rx section:

```
Rx ⊕

1. Tab. Napa                    [edit] [delete]
   1+0+1+0+1  |  খাবারের পরে  |  7 দিন

2. Tab. Indever 10 mg           [edit] [delete]
   1+0+0+1  |  খাবারের পরে  |  চলবে

3. Tab. Brokdin 50 mg           [edit] [delete]
   1+0+0+1  |  খাবারের পরে  |  4 দিন
   এবং, 1/4+0+0+1  |           |  2 দিন
   এবং, 0+0+0+1    |           |  4 দিন
```

- Drag-to-reorder support (react-beautiful-dnd or dnd-kit).
- Each medicine row is editable (clicking edit re-opens Dose Configuration Modal).
- Delete with confirmation.
- Medicine numbers auto-update on reorder/delete.

### Backend API Endpoints
1. `GET /api/medicines/search?q={query}&limit=20` — Full-text search, cached.
2. `GET /api/medicines/frequent` — Doctor's frequently used medicines.
3. `POST /api/medicines/frequent/{medicine_id}` — Add to frequent list.
4. `GET /api/doctor-medicine-defaults/{medicine_id}` — Get doctor's saved defaults.
5. `POST /api/doctor-medicine-defaults/{medicine_id}` — Save defaults.
6. `POST /api/medicines` — Add missing medicine (doctor-submitted, pending admin approval).

### Performance
- Medicine search: Use Laravel Scout with database driver OR raw SQL with FULLTEXT index.
- Cache top 1000 medicines in Redis (invalidate on update).
- Frequently used medicines loaded on page load (not on-demand).
- Debounce search input (300ms).

Generate: MedicineController, MedicineSearchService, DoctorMedicineDefaultController, React components (AddMedicineModal, MedicineSearch, DoseConfigModal, MedicineList, MedicineRow), all API routes.
```

---

## Prompt 7: Prescription Print, PDF & Output

```
Build the prescription output/print system:

### Print Preview Page (/doctor/prescriptions/{id}/preview)

**A4 Layout (210mm × 297mm)**:

**Header Zone**:
- Option A: Custom header image uploaded by doctor (full-width, max 150px height).
- Option B: Auto-generated header from doctor_profile:
  - Doctor name (large, bold), Degrees (below name)
  - Specialization, Designation
  - Chamber/Hospital name, Address
  - Phone number
  - Hospital logo on the right
- Doctor can choose in settings: "Use image header" or "Use text header" or "No header (pre-printed pad)".

**Patient Info Bar** (horizontal strip below header):
- Left: "Name: {name}" | "Age: {age} Years" | "Gender: {gender}"
- Right: "Date: {date}" | "ID: {patient_uid}"

**Body — Two Columns**:

**Left Column (~35%)**:
- **Patient Complaints:**
  - • Fever — 3 days
  - • Cough — 7days
- **On Examination:**
  - • Temperature: 101°F
  - • BP: 120/80

**Right Column (~65%)**:
- **Rx** (large symbol)
  - 1. Tab. Napa
     1+0+1+0+1 | খাবারের পরে | 7 দিন
     মুখ খাবেন
  - 2. Tab. Indever 10 mg
     1+0+0+1 | খাবারের পরে | চলবে
  - 3. Tab. Brokdin 50 mg
     1+0+0+1 | খাবারের পরে | 4 দিন
     এবং, 1/4+0+0+1 | | 2 দিন
     এবং, 0+0+0+1 | | 4 দিন
- **Advices:**
  - • পরীক্ষা করে দেখান
  - • প্রচুর পানি খাবেন
- **Follow up: 2 সপ্তাহ পর (তাপ সহকারে)**

**Footer Zone**:
- Option A: Custom footer image.
- Option B: Doctor's signature image + name.
- Option C: No footer (pre-printed pad).

### Export Options (buttons on preview page)
1. **Print** — Browser print dialog, optimized @media print CSS for A4. Hide all UI elements except prescription.
2. **Save as PNG** — Use html2canvas to capture the prescription div as PNG. Download automatically.
3. **Save as PDF** — Server-side: Use Laravel DomPDF or Puppeteer to generate PDF from a Blade view. Client-side fallback: html2canvas + jsPDF.
4. **Edit** — Return to prescription builder with all data loaded.

### Print Settings (per doctor, saved in doctor_profiles)
- Paper size: A4 (default) / Letter / Custom
- Show header: Yes/No (for pre-printed pads)
- Show footer: Yes/No
- Font size: Small / Medium / Large
- Language: Bangla / English / Both
- Show hospital logo: Yes/No
- Margin settings: Top, Bottom, Left, Right (in mm)

### Prescription History
- After printing, update prescription: status=printed, printed_at=now, printed_count++.
- Store a snapshot of the prescription at print time (in case medicines change later).

### Bulk Print
- From the queue/dashboard, select multiple completed appointments and batch-print all prescriptions.

### Implementation Details
1. Create a dedicated `<PrescriptionPrintLayout />` React component that ONLY renders the prescription content — no navigation, no buttons.
2. Use `@media print` CSS to hide everything except the print layout.
3. For PNG/PDF server-side generation, create a Blade template that mirrors the React print layout.
4. Use CSS Grid for the two-column layout.
5. Support for Bangla Unicode fonts: Include Noto Sans Bengali or SolaimanLipi font.
6. Responsive: On mobile, show a "scroll to view" of the prescription, with share/download options.

Generate: PrescriptionPreviewController, PrescriptionPdfService, Blade print template, React PrescriptionPrintLayout component, print CSS, PNG/PDF export logic.
```

---

## Prompt 8: Template Management System

```
Build the disease template system:

### Template Concept
A template is a saved preset for a specific disease/condition. When a doctor sees a patient with "Fever", they click the "Fever" template, and the entire prescription form auto-fills with default complaints, examinations, medicines (with doses), and advices. The doctor then tweaks for the specific patient and saves.

### Template CRUD (/doctor/templates)

**Template List Page**:
- Cards or table view showing all templates.
- Each card: Disease name, medicine count, last updated, last used, use count.
- Actions: View, Edit, Delete, Duplicate.
- Search/filter templates.
- Tabs: "My Templates" | "Global Templates" (read-only, created by admin).

**Create/Edit Template** (can be from scratch OR by saving a prescription):
- Disease name (required).
- All prescription sections (same form as prescription builder):
  - Default complaints with durations.
  - Default examination fields.
  - Default medicines with full dose configurations.
  - Default advices.
  - Default investigations.
- Save button.

**Save from Prescription**:
- In the prescription builder, "Save as Template" button at bottom.
- Enter template name → saves current prescription state as a template.
- Strips patient-specific data, keeps only the medical content.

### Template Application
- In prescription builder left sidebar, click a template.
- Confirmation: "Apply template '{name}'? This will replace current form data." (with option "Merge" to add to existing data instead of replacing).
- Apply: Fills complaints, examinations, medicines, advices, investigations from template.
- Doctor can then modify anything.

### Global Templates (Hospital Admin / Super Admin)
- Admin can create templates marked `is_global=true`.
- These appear in ALL doctors' template sidebar under "Global Templates" section.
- Doctors cannot edit global templates but can duplicate them as personal templates.

### Template Analytics
- Track: how many times each template is used, by which doctors.
- Most popular templates dashboard (for admin).

### Hospital Scoping
- Personal templates: scoped to doctor_id + hospital_id.
- Global templates: scoped to hospital_id (hospital admin) or no scope (super admin).
- A doctor joining a new hospital does NOT carry templates from old hospital.

Generate: TemplateController, TemplateCrudService, React components (TemplateList, TemplateForm, TemplateSidebar), Inertia pages.
```

---

## Prompt 9: Medicine Database Management & Doctor Personalization

```
Build the medicine database and doctor personalization features:

### Global Medicine Database (/admin/medicines — Super Admin only)

**Medicine List Page**:
- Searchable, sortable, paginated table of 30,000+ medicines.
- Columns: Brand Name, Generic Name, Type, Strength, Manufacturer, Price, Status.
- Filters: Type dropdown, Manufacturer dropdown, Generic name search.
- Actions: Edit, Deactivate.

**Bulk Import**:
- CSV/JSON upload for bulk medicine import.
- Format: brand_name, generic_name, type, strength, manufacturer, price.
- Validation: Skip duplicates, report errors.
- Laravel Command: `php artisan medicines:import {file_path}`.

**Medicine Seeder**:
- Create DatabaseSeeder for initial Bangladeshi medicine data.
- Include common medicines with proper Bangla-compatible data.
- Source structure: JSON file in `/database/data/medicines.json`.

### Doctor's Medicine Defaults (/doctor/settings/medicine-defaults)

**Commonly Used Drugs Management**:
- Doctor can browse the full medicine database and mark medicines as "frequently used".
- Drag-to-reorder the frequent list.
- These appear in the "Commonly used drugs" left pane of the Add Medicine modal.
- Maximum 50 frequent medicines per doctor.

**Default Dose Settings**:
- For each medicine, doctor can save their preferred default dose.
- When that medicine is added to any prescription, the dose auto-fills.
- Override global defaults: if not set, use generic defaults based on medicine type.

**Medicine Missing Flow**:
1. Doctor clicks "Medicine Missing? Add" in the Add Medicine modal.
2. Form: Brand name, Type, Strength, Generic name, Manufacturer (all manual entry).
3. Saves to a `medicine_requests` table with status: pending.
4. Super Admin reviews and approves → adds to global medicines table.
5. Doctor gets notified (in-app) when their requested medicine is approved.

### Complaint Masters Management (/admin/complaints — Super Admin only)

**Complaint List**:
- Table of all complaint masters with English name, Bangla name, category, sort order.
- CRUD operations.
- Bulk import from JSON.

**Duration Presets**:
- For each complaint, manage duration preset tags.
- Add/edit/delete/reorder presets.

### Hospital-Level Medicine Restrictions (Optional, for hospital_admin)
- Hospital admin can restrict certain medicines from being prescribed in their hospital.
- Restricted medicines won't appear in search results for doctors in that hospital.

Generate: MedicineManagementController, MedicineBulkImportService, MedicineRequestController, ComplaintMasterController, DoctorMedicineSettingsController, React pages and components, artisan commands.
```

---

## Prompt 10: Reports, Settings, Bilingual Support & Deployment

```
Build the reporting, settings, bilingual, and deployment layer:

### Reports

**Doctor Reports** (/doctor/reports):
- Daily/Weekly/Monthly patient count chart (line chart).
- Disease-wise breakdown (pie chart — based on template/diagnosis used).
- Medicine prescription frequency (bar chart — most prescribed medicines).
- Follow-up compliance rate (% of follow-up patients who returned).
- Export any report as PDF or CSV.

**Hospital Admin Reports** (/hospital/reports):
- Doctor-wise patient load comparison.
- Revenue summary (daily/weekly/monthly) with doctor breakdown.
- Hospital occupancy/utilization.
- Patient demographics (age/gender distribution).
- Top prescribed medicines across hospital.
- New vs returning patients ratio.

**Super Admin Reports** (/admin/reports):
- Hospital-wise subscription status.
- Platform-wide usage stats: total prescriptions, total patients, total doctors.
- Hospital growth chart (new hospitals per month).
- Revenue per hospital (subscription fees).

### Charting
- Use Recharts (already available in React artifacts) for all charts.
- Backend: Aggregate queries with date grouping, cached for 1 hour.

### Settings

**Doctor Settings** (/doctor/settings):
- Profile: Name, degrees, specialization, photo, signature upload.
- Prescription Header: Upload image OR enter text fields (name, degrees, chamber address).
- Prescription Footer: Upload image OR text.
- Prescription Preferences: Default language (Bangla/English/Both), paper size, margins, font size.
- Notification Preferences: Follow-up reminders (on/off), email notifications.
- Password Change.

**Hospital Settings** (/hospital/settings — Hospital Admin):
- Hospital Info: Name, logo, address, phone, email, website.
- Default Language for new doctors.
- Working hours, holidays.
- Subscription details (view only).

**Super Admin Settings** (/admin/settings):
- Platform name, logo.
- Subscription plan definitions (name, price, limits).
- Default complaint masters and duration presets.
- System maintenance mode toggle.

### Bilingual Support (Bangla + English)

**Implementation**:
1. Laravel Localization: Create `lang/en/` and `lang/bn/` directories with translation files.
2. React i18n: Use `react-i18next` with translation JSON files.
3. Language switcher in the top navigation (dropdown: English | বাংলা).
4. Store user preference in users table: `preferred_language`.
5. Key areas requiring bilingual support:
   - All UI labels and buttons.
   - Complaint names (from complaint_masters: name_en, name_bn).
   - Medicine instructions (pre-built tags in both languages).
   - Prescription output (print in selected language).
   - Error messages and validation messages.
6. Bangla fonts: Include SolaimanLipi or Noto Sans Bengali via Google Fonts.
7. RTL is NOT needed (Bangla is LTR).

### Performance Optimization
- Medicine search: Full-text index + Redis cache.
- Prescription list: Paginated with cursor pagination for large datasets.
- Dashboard stats: Cached for 5 minutes, invalidated on new appointment/prescription.
- Images: Compress uploads (use Intervention Image), serve via Laravel Storage with CDN-ready paths.
- Database: Add composite indexes on (hospital_id, created_at), (doctor_id, appointment_date), (patient_id, created_at).

### Security
- RBAC: Laravel Policies on every model.
- Hospital isolation: Global scope ensures data never leaks between hospitals.
- Rate limiting: 60 requests/minute for API endpoints.
- CSRF protection on all forms (Inertia handles this).
- XSS prevention: React auto-escapes, Blade uses {{ }}.
- SQL injection: Eloquent ORM prevents this.
- File uploads: Validate MIME types, max 2MB images.
- Session security: Regenerate on login, expire after 2 hours inactivity.
- Audit log: Log all prescription create/edit/delete actions with user_id and timestamp.

### Deployment

**Docker Setup**:
```yaml
services:
  app: Laravel + PHP 8.3 FPM
  node: Vite dev server (dev only)
  nginx: Web server
  mysql: MySQL 8.0
  redis: Redis 7 (caching, sessions, queues)
  queue: Laravel Queue Worker (for PDF generation, email notifications)
```

**Environment**:
- .env.example with all variables documented.
- Separate configs for local, staging, production.
- Storage: Use S3-compatible storage for uploads in production.
- SSL: Certbot/Let's Encrypt.
- Queue: Use Redis driver for async jobs (PDF generation, follow-up reminders, email).
- Scheduler: Laravel scheduler for daily statement generation, follow-up reminder emails.

**CI/CD**:
- GitHub Actions workflow: test → build → deploy.
- Run PHPUnit + Pest tests.
- Run ESLint + TypeScript checks.
- Build Vite assets.
- Deploy via SSH or container registry.

Generate: ReportController, DashboardStatsService, SettingsController, i18n setup, Docker files (Dockerfile, docker-compose.yml, nginx.conf), GitHub Actions workflow, .env.example.
```

---

## Execution Order

Build the project in this exact order for best results:

| Step | Prompt | Priority | Dependency |
|------|--------|----------|------------|
| 1 | Prompt 1 — Database & Setup | 🔴 Critical | None |
| 2 | Prompt 2 — Auth & Admin Panels | 🔴 Critical | Prompt 1 |
| 3 | Prompt 3 — Patient Management | 🔴 Critical | Prompt 2 |
| 4 | Prompt 4 — Appointments & Queue | 🟡 High | Prompt 3 |
| 5 | Prompt 5 — Prescription Builder | 🔴 Critical | Prompt 3 |
| 6 | Prompt 6 — Medicine System | 🔴 Critical | Prompt 5 |
| 7 | Prompt 7 — Print & PDF | 🟡 High | Prompt 6 |
| 8 | Prompt 8 — Templates | 🟢 Medium | Prompt 6 |
| 9 | Prompt 9 — Medicine DB & Defaults | 🟢 Medium | Prompt 6 |
| 10 | Prompt 10 — Reports & Deploy | 🟢 Medium | All above |

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Backend Framework | Laravel 11 |
| Frontend Framework | React 18 + TypeScript |
| SPA Bridge | Inertia.js v2 |
| Styling | Tailwind CSS 3 |
| component | Ant design |
| Database | MySQL 8.0 |
| Cache | Redis 7 |
| Search | Laravel Scout (Database driver) OR MySQL FULLTEXT |
| PDF Generation | Laravel DomPDF + html2canvas (client fallback) |
| File Storage | Laravel Storage (local dev, S3 production) |
| Queue | Laravel Queue (Redis driver) |
| Charts | Recharts |
| Drag & Drop | @dnd-kit/sortable |
| i18n | react-i18next + Laravel Localization |
| Auth | Laravel Breeze (Inertia React stack) |
| Deployment | Docker + Nginx + GitHub Actions |