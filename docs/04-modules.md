# 04 — Feature modules

Feature-by-feature walkthrough. Each section maps to a prompt in [../../Prescription-Software/project-doc.md](../../Prescription-Software/project-doc.md) and a set of mockup pages in [../../Prescription-Software/medixpro/](../../Prescription-Software/medixpro/).

---

## Super Admin panel (Prompt 2)

Base URL: `/admin/*`. Middleware: `auth`, `role:super_admin`.

| Page | Route | Mockup |
|---|---|---|
| Dashboard | `/admin/dashboard` | — custom |
| Hospitals list | `/admin/hospitals` | — custom |
| Hospital create | `/admin/hospitals/create` | — |
| Hospital edit/view | `/admin/hospitals/{id}` | — |
| Users list | `/admin/users` | `medixpro/staff.html` (reuse layout) |
| Medicines | `/admin/medicines` | — |
| Complaint masters | `/admin/complaints` | — |
| Global templates | `/admin/templates` | — |
| Subscriptions | `/admin/subscriptions` | `medixpro/billing.html` |

Actions:
- Create/edit/suspend hospitals.
- Manage plans and limits.
- Curate global medicine DB (+ bulk CSV import: `php artisan medicines:import <file>`).
- Approve doctor-submitted `medicine_requests`.
- Create global disease templates visible to all doctors.

---

## Hospital Admin panel (Prompt 2)

Base URL: `/hospital/*`. Middleware: `auth`, `role:hospital_admin`, `hospital.active`.

| Page | Route | Mockup |
|---|---|---|
| Dashboard | `/hospital/dashboard` | `medixpro/index.html` |
| Doctors | `/hospital/doctors` | `medixpro/doctors.html` |
| Receptionists | `/hospital/receptionists` | `medixpro/staff.html` |
| Chambers | `/hospital/chambers` | `medixpro/rooms.html` |
| Holidays | `/hospital/holidays` | `medixpro/calendar.html` |
| Settings | `/hospital/settings` | `medixpro/settings.html` |
| Reports | `/hospital/reports` | `medixpro/reports.html` |

Plan-limit enforcement: block creating a new doctor when `count(doctors) >= hospital.max_doctors`, etc.

---

## Patient management (Prompt 3)

Routes shared across doctor, receptionist, hospital_admin — all within `/patients/*` (or role-prefixed). Middleware: `auth`, `role:hospital_admin,doctor,receptionist`, `hospital.active`.

| Page | Route | Mockup |
|---|---|---|
| List | `/patients` | `medixpro/patients.html` |
| Create | `/patients/create` | — modal on list page |
| Profile | `/patients/{id}` | — |
| Edit | `/patients/{id}/edit` | — inline or modal |

Key flows:

### Registration
- Form with bilingual labels.
- Age input: either direct years/months/days OR DOB (auto-compute).
- Webcam capture for profile photo (use browser `getUserMedia`).
- **Duplicate check on phone (within hospital)** — show existing patient and let user choose "View" or "Create anyway".
- `patient_uid` generated server-side on create.

### Search
Global nav search box (debounced 300ms). Endpoint `GET /api/patients/search?q=...` — scoped to current hospital. Match on `name` (partial), `phone` (partial), `patient_uid` (exact). Return at most 10 suggestions.

### Profile
Tabs: Info · Visit History · Prescriptions · Appointments. Buttons: `+ New Prescription`, `+ Follow-up Prescription` (pre-fills with most recent Rx).

### Access
- Doctor sees any patient in their hospital (not just those they've treated).
- Receptionist sees the list but cannot open a prescription's clinical content.
- Hospital admin has full read/write.

---

## Appointments & serial queue (Prompt 4)

Base URL: `/queue`, `/appointments`. Middleware: `auth`, `role:doctor,receptionist`, `hospital.active`.

| Page | Route | Mockup |
|---|---|---|
| Today's queue | `/queue` | `medixpro/appointments.html` |
| Appointments list | `/appointments` | `medixpro/appointments.html` |
| Follow-ups | `/doctor/follow-ups` | — |
| Daily statements | `/doctor/statements` | `medixpro/billing.html` |

### Queue dashboard
- Date picker (default today) + chamber selector.
- Table: Serial #, Patient, Status, Type, Actions.
- Status flow: `waiting → in_progress → completed` (+ `absent`, `cancelled`).
- Action bar: `+ New Appointment`, `Refresh`, `Break` toggle, `→ Next`.
- Stats cards: Total, Completed, Waiting, Follow-ups, Absent, Earned.
- Color code rows by status.

### Serial numbering
**Scope**: per `(doctor_id, chamber_id, appointment_date)`. Reset at midnight. Compute at insert time as `max(serial_number) + 1`.

### Follow-up auto-booking
When a prescription is finalized with `follow_up_date`, auto-create an `appointment` with `status=waiting`, `type=follow_up` on that date.

### Real-time
Poll every 10s with Inertia's `router.reload({ only: ['queue'] })` OR wire up Laravel Echo + Reverb (v2). Spec says polling is acceptable for v1.

### Holidays
Block booking on dates matching `hospital_holidays`. Show "Holiday: {title}" on the queue page for holiday dates.

---

## Prescription builder (Prompt 5 & 6) — critical

Base URL: `/doctor/prescriptions/create?patient_id=X&appointment_id=Y`. Middleware: `auth`, `role:doctor`, `hospital.active`.

**This is the most complex feature of the app.** Read both Prompt 5 and Prompt 6 in full before starting, and study `medixpro/prescriptions.html` + doctor dashboard mockup.

### Layout
Three-zone desktop layout (no side nav during writing):

1. **Left sidebar (250px, scrollable)** — template selector (my templates + global templates, searchable).
2. **Main content** — patient info sticky bar + 11 accordion sections.
3. **Bottom sticky action bar** — "Update" (draft) and "Update + Print".

### Sections (all optional, collapsible, `⊕` to expand)
1. Patient Complaints — picker modal with 60+ pre-defined complaints (bilingual) + duration picker with 50+ preset tags + free-text note.
2. On Examination — auto-suggested fields (Temp, BP, Pulse, SpO2, Weight, Height, BMI-calc).
3. Past History — free text.
4. Drug History — free text.
5. Investigations — searchable (CBC, Blood Sugar, X-ray, ...).
6. Diagnosis — free text / searchable.
7. **Rx (Treatment Plan)** — medicine list, see below.
8. Advices — bilingual preset advice suggestions.
9. Next Plans — free text.
10. Hospitalizations — free text.
11. Operation Notes — free text.

Below the sections: **Follow-up picker** (date input + quick-buttons for 1/7/15/30/90/180 days + "After N (days/months/years)") and **Save as Template** row.

### State management
Use `useReducer`:

```ts
type Action =
  | { type: 'ADD_COMPLAINT'; payload: Complaint }
  | { type: 'REMOVE_COMPLAINT'; id: string }
  | { type: 'UPDATE_COMPLAINT_DURATION'; id: string; duration: string }
  | { type: 'ADD_EXAMINATION'; payload: Examination }
  | { type: 'ADD_MEDICINE'; payload: Medicine }
  | { type: 'UPDATE_MEDICINE'; id: string; patch: Partial<Medicine> }
  | { type: 'REMOVE_MEDICINE'; id: string }
  | { type: 'REORDER_MEDICINES'; order: string[] }
  | { type: 'SET_FOLLOW_UP'; date: string; value?: number; unit?: DurationUnit }
  | { type: 'LOAD_TEMPLATE'; template: Template; mode: 'replace' | 'merge' }
  | { type: 'RESET_FORM' };
```

Auto-save every 30s to the backend with `status=draft`. Track dirty state and warn on navigate-away.

### Medicine entry (Prompt 6)
Modal triggered by `+ Add Medicine`:
- **Left pane** — "Commonly used drugs" (up to 50, personalised per doctor, from `doctor_frequent_medicines`). Click adds instantly with default dose from `doctor_medicine_defaults`.
- **Right pane** — search input → autocomplete from global `medicines` (FULLTEXT, < 200ms target). Results grouped by type. `Medicine Missing? Add` opens a form to submit a medicine request.

After selecting a medicine, open the **Dose Configuration modal**:
- Time-of-day checkboxes (সকাল/দুপুর/বিকাল/রাত/শয়নে) with numeric dose inputs.
- Bilingual pre-set instruction tags (clickable chips).
- Duration checkboxes (1/5/7/14/30 days) + চলবে / N/A options.
- Checkbox: "Set as default settings for this medicine" — saves into `doctor_medicine_defaults`.

Medicine list display: numbered, drag-to-reorder (`@dnd-kit`), edit/delete inline. Numbers auto-re-sequence on reorder/delete.

### Scoping
- Complaint masters: global table.
- Templates: doctor's personal + hospital's global.
- Patient lookup: current hospital only.
- Prescription saved with `hospital_id` from auth user.

---

## Prescription print & export (Prompt 7)

Page: `/doctor/prescriptions/{id}/preview`.

- A4 layout (210mm × 297mm). Two-column body: left = complaints/exam, right = Rx + advices + follow-up.
- Header modes: image upload / text (from `doctor_profiles`) / none (pre-printed pad).
- Footer modes: image / signature image + name / none.
- Export: Print (browser dialog), Save as PNG (`html2canvas`), Save as PDF (server via DomPDF, client fallback via `html2canvas` + `jsPDF`).
- Dedicated `<PrescriptionPrintLayout />` component + `@media print` CSS.
- Bangla fonts: Noto Sans Bengali / SolaimanLipi.
- On print: set `status=printed`, `printed_at=now`, `printed_count++`, store a snapshot of the payload.
- **Bulk print** from the queue page (select multiple completed appointments).

---

## Templates (Prompt 8)

Route: `/doctor/templates`, `/admin/templates`.

- CRUD over `doctor_templates`.
- Save-from-prescription flow: strips patient-specific fields, saves medical content.
- Apply modes: **Replace** (overwrite current form) or **Merge** (append).
- Global templates: `is_global = true`. Created by super admin → available to all doctors; created by hospital admin → available to doctors within that hospital.
- Track `use_count` and `last_used_at`; show "most popular" dashboard for admins.

---

## Medicine DB & doctor personalization (Prompt 9)

### Global medicine DB — super admin only
- `/admin/medicines`: searchable/sortable/paginated table over 30,000+ entries.
- Bulk import: `php artisan medicines:import storage/imports/medicines.csv`. Columns: `brand_name, generic_name, type, strength, manufacturer, price`. Skip duplicates (match on `brand_name + strength + manufacturer`).
- Seeder: `database/data/medicines.json` → `MedicineSeeder`.

### Doctor personalization
- `/doctor/settings/medicine-defaults` — browse catalog, mark "frequent" (max 50, drag-reorder), edit default dose per medicine.

### Missing-medicine requests
- `medicine_requests` table (status: `pending | approved | rejected`).
- Doctor submits from the Add Medicine modal.
- Super admin reviews at `/admin/medicine-requests`.
- On approval → inserted into `medicines` + in-app notification to requester.

---

## Reports (Prompt 10)

Charts via **Recharts**. Backend aggregates with date-grouped queries, cached 5–60 min.

| Scope | Page | Content |
|---|---|---|
| Doctor | `/doctor/reports` | Patient count line chart, disease pie, medicine frequency bar, follow-up compliance % |
| Hospital | `/hospital/reports` | Doctor-wise patient load, revenue, demographics, top medicines, new-vs-returning |
| Super Admin | `/admin/reports` | Hospital-wise subscription, platform totals, hospital growth, revenue per hospital |

Export: PDF + CSV.

---

## Settings (Prompt 10)

| Scope | Page | Key fields |
|---|---|---|
| Doctor | `/doctor/settings` | Profile, header/footer image, prescription preferences (language, paper, font, margins), notifications, password |
| Hospital | `/hospital/settings` | Hospital info, default language, working hours, view subscription |
| Super Admin | `/admin/settings` | Platform name/logo, plan definitions, default complaint masters, maintenance mode |

---

## i18n (Prompt 10)

- Laravel localization: `lang/en/*.php`, `lang/bn/*.php`.
- React: `react-i18next` with JSON files in `resources/js/locales/`.
- Language switcher in top nav.
- Store user preference on `users.preferred_language`.
- Required bilingual surfaces: UI labels, complaint names (name_en / name_bn), medicine instruction presets, prescription output, validation errors.
- Bangla is LTR — no RTL handling needed.
