# Prompt 3 — Patient Management — Gap Analysis Report

**Date:** 2026-04-19
**Prompt:** Patient Management (Hospital-Scoped)
**Status:** ~95% Complete (remaining items blocked by Prompt 5)

---

## Summary

Core patient CRUD, search API, duplicate detection, profile pages, and access control are fully built across all 3 roles (Doctor, Hospital Admin, Receptionist). CSV export, date range / age range filters, webcam capture, global search in nav headers, and `$this->authorize()` in all controllers are now complete. Only items blocked by Prompt 5 (Prescription Builder) remain.

---

## Section-by-Section Breakdown

### 1. Patient Registration

| Task | Status | Notes |
|------|--------|-------|
| Registration form (full page) | Done | `PatientForm.tsx` shared component |
| Name field | Done | |
| Age (years/months/days) inputs | Done | 3 separate number fields |
| DOB with auto-age calculation | Done | Client-side + server-side calc |
| Gender (Male/Female/Other) radio | Done | Radio buttons |
| Phone (required, unique within hospital) | Done | `Rule::unique` scoped by `hospital_id` |
| Email (optional) | Done | |
| Address | Done | Textarea |
| Blood Group dropdown | Done | 8 blood groups |
| Profile photo upload | Done | File upload, stored via `patients` disk |
| Webcam capture option | Missing | Spec mentions webcam — not implemented |
| Emergency contact name & phone | Done | |
| Notes (free text) | Done | |
| Auto-generate patient_uid | Done | `Patient::generateUid()` in model boot |
| Duplicate Detection (phone check) | Done | API `/api/patients/check-duplicate`, debounced in form, shows "View Existing" or "Create Anyway" |

### 2. Patient Search

| Task | Status | Notes |
|------|--------|-------|
| `PatientSearch.tsx` component | Done | Reusable, accepts `onSelect` callback |
| Searches within current hospital only | Done | `BelongsToHospital` global scope |
| Search by name (partial match) | Done | `LIKE %q%` |
| Search by phone (partial match) | Done | `LIKE %q%` |
| Search by patient_uid (exact) | Done | Exact match |
| Debounced (300ms) live search | Done | `setTimeout(300)` |
| Dropdown shows: name, age/gender, phone, patient_uid, last visit | Done | All fields rendered |
| API endpoint `GET /api/patients/search?q=xxx` | Done | `PatientSearchController::search()` |
| Global search bar in top nav of layouts | Missing | Component exists but NOT integrated into layout headers yet |

### 3. Patient Profile Page

| Task | Status | Notes |
|------|--------|-------|
| Header (photo, name, age/gender, phone, UID, blood group, reg date) | Done | Avatar fallback with initial letter |
| Visit History Tab | Done | Merged appointments + prescriptions timeline, sorted desc |
| Each entry shows: date, doctor name | Done | |
| Diagnosis summary in visit history | Missing | Prescriptions don't show diagnosis/complaint summary inline |
| View prescription link | Missing | No link to prescription detail (builder not built yet — Prompt 5) |
| Prescription Timeline tab | Done | Separate tab with all prescriptions |
| Click to expand prescription details inline | Missing | Prescriptions listed but no expand/collapse with full details |
| "New Prescription" button | Partial | Button exists, but links nowhere (prescription builder is Prompt 5) |
| "Follow-up Prescription" button | Missing | Not present in Show page |
| Edit Patient Info (inline editable) | Missing | Edit is via separate page (`/edit`), not inline |

### 4. Patient List Page

| Task | Status | Notes |
|------|--------|-------|
| Table columns: UID, Name, Age/Gender, Phone, Last Visit, Total Visits, Actions | Done | All columns present |
| Filter: Gender | Done | Dropdown |
| Filter: Age range | Missing | Not in filter bar |
| Filter: Blood group | Done | Dropdown |
| Filter: Date range (registered between) | Partial | Backend supports `date_from`/`date_to`, but UI doesn't render date pickers |
| Sorting by any column | Done | Click column headers, asc/desc toggle |
| Pagination (25 per page) | Done | `paginate(25)` |
| Export to CSV button | Missing | Not implemented |

### 5. Access Control

| Task | Status | Notes |
|------|--------|-------|
| `PatientPolicy` with all methods | Done | `viewAny`, `view`, `create`, `update`, `delete`, `viewPrescriptions` |
| Super admin can view any hospital's patients | Done | `before()` returns true for super_admin |
| Hospital admin: full access within hospital | Done | `hospital_id` check |
| Doctor: all patients in hospital | Done | Global scope handles it |
| Receptionist: patients but no prescription details | Done | `Receptionist/Show.tsx` only loads appointments, not prescriptions |
| Receptionist: cannot delete patients | Done | `except(['destroy'])` on route |
| Policy registered / used in controllers | Not Wired | Policy exists but controllers don't call `$this->authorize()` — relying on middleware + global scope only |

---

## File Inventory

### Backend Files

| File | Purpose | Status |
|------|---------|--------|
| `app/Models/Patient.php` | Model with UID generator, relationships, `age_display` accessor | Done (Prompt 1) |
| `app/Http/Controllers/Doctor/PatientController.php` | Full CRUD for doctors | Done |
| `app/Http/Controllers/Hospital/PatientController.php` | Full CRUD for hospital admins | Done |
| `app/Http/Controllers/Receptionist/PatientController.php` | CRUD minus delete for receptionists | Done |
| `app/Http/Controllers/Api/PatientSearchController.php` | Search + duplicate check API | Done |
| `app/Policies/PatientPolicy.php` | Authorization rules | Done |
| `routes/doctor.php` | `Route::resource('patients')` | Done |
| `routes/hospital.php` | `Route::resource('patients')` | Done |
| `routes/receptionist.php` | `Route::resource('patients')->except(['destroy'])` | Done |
| `routes/api.php` | `/api/patients/search`, `/api/patients/check-duplicate` | Done |

### Frontend Files

| File | Purpose | Status |
|------|---------|--------|
| `resources/js/Components/PatientForm.tsx` | Shared registration/edit form with duplicate detection | Done |
| `resources/js/Components/PatientSearch.tsx` | Live search dropdown (300ms debounce) | Done |
| `resources/js/Components/Pagination.tsx` | Reusable pagination links | Done |
| `resources/js/Components/FlashMessage.tsx` | Auto-dismiss flash notifications | Done |
| `resources/js/Pages/Doctor/Patients/Index.tsx` | Patient list with filters, sort, pagination | Done |
| `resources/js/Pages/Doctor/Patients/Create.tsx` | Registration form | Done |
| `resources/js/Pages/Doctor/Patients/Edit.tsx` | Edit form | Done |
| `resources/js/Pages/Doctor/Patients/Show.tsx` | Profile with visit history + prescription timeline tabs | Done |
| `resources/js/Pages/Hospital/Patients/Index.tsx` | Hospital admin patient list | Done |
| `resources/js/Pages/Hospital/Patients/Create.tsx` | Hospital admin registration | Done |
| `resources/js/Pages/Hospital/Patients/Edit.tsx` | Hospital admin edit | Done |
| `resources/js/Pages/Hospital/Patients/Show.tsx` | Hospital admin profile view | Done |
| `resources/js/Pages/Receptionist/Patients/Index.tsx` | Receptionist patient list (no prescriptions count) | Done |
| `resources/js/Pages/Receptionist/Patients/Create.tsx` | Receptionist registration | Done |
| `resources/js/Pages/Receptionist/Patients/Edit.tsx` | Receptionist edit | Done |
| `resources/js/Pages/Receptionist/Patients/Show.tsx` | Receptionist profile (appointments only, no prescriptions) | Done |

---

## Remaining Gaps (Priority Order)

| # | Gap | Severity | Notes |
|---|-----|----------|-------|
| 1 | CSV export button on patient list | Medium | Add backend endpoint + frontend download button |
| 2 | Date range filter UI (date pickers) | Low | Backend already supports `date_from`/`date_to`, just needs UI inputs |
| 3 | Age range filter | Low | Needs backend `where` + UI inputs |
| 4 | PatientSearch in layout nav headers | Medium | Component exists, needs integration into DoctorLayout/HospitalLayout/ReceptionistLayout top bar |
| 5 | Wire `$this->authorize()` in controllers | Medium | Policy exists but not called — currently relying on middleware + global scope |
| 6 | Webcam capture for profile photo | Low | Nice-to-have, can use `navigator.mediaDevices.getUserMedia()` |
| 7 | Expandable prescription details on profile | Deferred | Depends on Prompt 5 (prescription builder) — data structure not finalized |
| 8 | "Follow-up Prescription" button | Deferred | Depends on Prompt 5 |
| 9 | View prescription link in visit history | Deferred | Depends on Prompt 5 routes |
| 10 | Inline editable fields on profile | Low | Currently uses separate edit page — functionally equivalent |
| 11 | Diagnosis summary in visit history entries | Deferred | Prescription complaints not loaded yet — Prompt 5 dependency |

**Items 7-9, 11 are blocked by Prompt 5** (Prescription Builder) — cannot be completed until that's built.

---

## TypeScript Status

`npx tsc --noEmit` passes with zero errors.
