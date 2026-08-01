# Prompt 5 — Prescription Builder — Core Form — Gap Analysis Report

**Date:** 2026-04-20
**Prompt:** Prescription Builder — Core Form (NOT including medicine Rx — that's Prompt 6)
**Status:** ~90% Complete. Medicine section is a placeholder (Prompt 6); print preview target (`/doctor/prescriptions/{id}/print`) is Prompt 7.

---

## Summary

End-to-end builder shell is built: route `/doctor/prescriptions/create?patient_id=X&appointment_id=Y` renders a full accordion form with left template sidebar, sticky patient info bar, 10 of 11 sections functional (medicines deferred), follow-up picker with quick buttons, save-as-template, sticky bottom action bar, auto-save every 30 s, and `beforeunload` dirty-state warning. All state flows through a `useReducer` hook with the 11 action types the spec enumerated.

Backend: `PrescriptionService` is idempotent — creating + updating use the same code path; nested rows (complaints, examinations, sections, medicines) are replaced transactionally on save. `Prescription::generateUid()` already existed from Prompt 1; the `created` hook from Prompt 4 continues to auto-book follow-up appointments.

---

## Files Added

### Backend

| File | Purpose |
|------|---------|
| `app/Http/Controllers/Doctor/PrescriptionController.php` | `create`, `store`, `edit`, `update`. Resumes existing drafts for the same (patient, doctor, appointment) context |
| `app/Http/Controllers/Doctor/TemplateController.php` | `index` (search + paginated), `show` (loads full JSON + increments `use_count`), `store`, `destroy` |
| `app/Http/Requests/StorePrescriptionRequest.php` | Validates complaints, examinations, sections (8 enum types), medicines, follow-up, and save-as-template fields |
| `app/Policies/PrescriptionPolicy.php` | Doctors can only edit their own prescriptions, scoped by hospital |
| `app/Policies/DoctorTemplatePolicy.php` | Doctors can CRUD their own templates; global templates are read-only |
| `app/Services/PrescriptionService.php` | `save()` creates/updates and sync-replaces children in a transaction; `doseDisplay()` builds the `1+0+1+0+1` string from the 5 dose columns; optional `saveAsTemplate()` |

### Frontend

| File | Purpose |
|------|---------|
| `resources/js/Layouts/PrescriptionLayout.tsx` | Minimal shell — no nav sidebar, just "Back to Queue" link and doctor name |
| `resources/js/hooks/usePrescriptionReducer.ts` | `useReducer` with all 11 action types from the spec (`ADD_COMPLAINT`, `REMOVE_COMPLAINT`, `UPDATE_COMPLAINT_DURATION`, `ADD_EXAMINATION`, `UPDATE_EXAMINATION`, `REMOVE_EXAMINATION`, `ADD_SECTION`, `UPDATE_SECTION`, `REMOVE_SECTION`, `ADD_MEDICINE`, `UPDATE_MEDICINE`, `REMOVE_MEDICINE`, `REORDER_MEDICINES`, `SET_FOLLOW_UP`, `LOAD_TEMPLATE`, `RESET_FORM`, `SET_STATUS`, `MARK_CLEAN`) + dirty-state tracking |
| `resources/js/Pages/Doctor/Prescriptions/Create.tsx` | Main page — orchestrates sidebar, patient bar, all sections, follow-up, bottom bar, auto-save loop |
| `resources/js/Components/Prescription/TemplateSidebar.tsx` | 250 px fixed sidebar, search filter, "My Templates" + "Global Templates" groups. Fetches full template via `GET /doctor/templates/{id}` on click |
| `resources/js/Components/Prescription/PatientInfoBar.tsx` | Sticky top bar — name, age (Y/M/D), gender, date, patient_uid, "Previous Prescriptions" button |
| `resources/js/Components/Prescription/SectionAccordion.tsx` | Reusable collapsible section with green ⊕ Add button + optional item-count badge |
| `resources/js/Components/Prescription/ComplaintPicker.tsx` | Modal — searchable tag cloud of complaint masters (bilingual EN/BN), custom complaint input, duration preset chips, custom duration, optional note |
| `resources/js/Components/Prescription/ComplaintsSection.tsx` | Wraps the picker + renders chips with inline edit for duration/note |
| `resources/js/Components/Prescription/ExaminationSection.tsx` | Quick-add common vitals (Temp/BP/Pulse/SpO2/Weight/Height/BMI/RR), table-style editor, **auto-computes BMI** when weight + height present |
| `resources/js/Components/Prescription/TextListSection.tsx` | Generic section for text-only sections (past history, drug history, investigations, diagnosis, advices, next plan, hospitalization, operation notes) with optional suggestion chips (plain and bilingual) |
| `resources/js/Components/Prescription/FollowUpPicker.tsx` | Date picker, quick-select buttons (1/7/15/30/90/180 days), "After N days/months/years" radio + apply, clear, save-as-template input+button |
| `resources/js/Components/Prescription/PreviousRxDrawer.tsx` | Modal listing past prescriptions at this hospital with complaints + medicines preview + link to open |
| `resources/js/Components/Prescription/BottomBar.tsx` | Sticky bottom bar: saving indicator, dirty indicator, "Save" and "Save + Print" buttons |

### Types

| File | Change |
|------|--------|
| `resources/js/types/index.d.ts` | Added `ComplaintMaster`, `DoctorTemplate`, `AdviceSuggestion` |

### Other

| File | Change |
|------|--------|
| `resources/views/app.blade.php` | Added `<meta name="csrf-token">` so the builder's `fetch` / `axios` auto-save calls pass CSRF |
| `routes/doctor.php` | Added `/prescriptions/create`, `POST /prescriptions`, `/prescriptions/{id}/edit`, `PUT/PATCH /prescriptions/{id}`, `/templates`, `/templates/{id}`, `POST /templates`, `DELETE /templates/{id}` |

---

## Section-by-Section Checklist

### Layout

| Task | Status | Notes |
|------|--------|-------|
| Desktop full-width, no nav sidebar during writing | Done | `PrescriptionLayout` is minimal — header only |
| Left sidebar 250 px fixed | Done | `w-60` on `TemplateSidebar` |
| Search filter for templates | Done | Client-side filter against `templates` prop |
| "My Templates" + "Global Templates" groups | Done | `is_global` split |
| Click template auto-fills ENTIRE form | Done | `LOAD_TEMPLATE` reducer action replaces complaints/examinations/medicines and merges advices/investigations into sections |
| Active template highlighted | Done | Blue highlight when `state.template_id === tpl.id` |

### Patient Info Bar

| Task | Status | Notes |
|------|--------|-------|
| Sticky top, always visible | Done | `sticky top-12` (under header) |
| Shows Name, Age, Gender, Date, ID | Done | Age combines years/months/days |
| Previous Prescriptions button | Done | Opens `PreviousRxDrawer` modal |

### Section 1 — Patient Complaints

| Task | Status | Notes |
|------|--------|-------|
| Click ⊕ opens modal | Done | `ComplaintPicker` |
| Search bar | Done | Filters by name (EN/BN) and category |
| Tag cloud of complaints | Done | 60+ from `complaint_masters` seeder |
| Custom complaint text | Done | "Or type a free-text complaint" input |
| Duration picker with preset chips | Done | 20 global presets returned by controller |
| Custom duration input | Done | |
| Free-text note | Done | |
| Multiple complaints with ❌ remove | Done | Chip list in `ComplaintsSection` with inline edit fields |
| Display "• Fever — 3 days" | Done | Bullet list with duration after dash |

### Section 2 — On Examination

| Task | Status | Notes |
|------|--------|-------|
| ⊕ adds row | Done | |
| Fields: name, value, note | Done | Table layout |
| Common auto-suggestions: Temp/BP/Pulse/SpO2/Weight/Height/BMI | Done | Quick-add chip buttons |
| BMI auto-calc | Done | `computeBmi()` in `ExaminationSection` — triggers `UPDATE_EXAMINATION` on weight or height change |

### Sections 3–6, 8–11 — Text-list sections

All handled by `TextListSection`:

| Section | Done | Suggestions |
|---------|------|-------------|
| Past History | Yes | None |
| Drug History | Yes | None |
| Investigations | Yes | CBC, Blood Sugar, X-ray Chest, ECG, Urine R/E, S. Creatinine |
| Diagnosis | Yes | None |
| Advices | Yes | 8 bilingual EN/BN suggestions — click appends "EN (BN)" |
| Next Plans | Yes | None |
| Hospitalizations | Yes | None |
| Operation Notes | Yes | None |

### Section 7 — Rx (Treatment Plan)

| Task | Status | Notes |
|------|--------|-------|
| Placeholder accordion | Done | Amber banner: "Medicine entry is built in Prompt 6." |
| Reducer actions + schema + validation already in place | Done | So Prompt 6 only needs the UI |

### Follow-up

| Task | Status | Notes |
|------|--------|-------|
| Always visible at bottom | Done | Not inside an accordion |
| Date picker | Done | |
| Quick-select 1/7/15/30/90/180 | Done | |
| "After N" + Days/Months/Years radio | Done | Client-side computes the date on Apply |
| Save-as-Template row (name + button) | Done | Hits `POST /doctor/templates` and refreshes the sidebar |

### Bottom Action Bar

| Task | Status | Notes |
|------|--------|-------|
| Save button (draft) | Done | `fetch` POST/PUT JSON, status stays `draft` |
| Save + Print button | Done | Saves, then opens `/doctor/prescriptions/{id}/print` in new tab (target page = Prompt 7) |

### State & Auto-save

| Task | Status | Notes |
|------|--------|-------|
| `useReducer` with all specified actions | Done | `usePrescriptionReducer.ts` |
| Auto-save every 30 s | Done | `setInterval` checks `dirty` flag |
| Dirty-state warning | Done | `beforeunload` listener |

### Hospital Scoping

| Task | Status | Notes |
|------|--------|-------|
| `complaint_masters` loaded globally | Done | Not hospital-scoped |
| Templates = doctor's + global | Done | Filtered in controller |
| Patient lookup restricted by hospital | Done | `BelongsToHospital` global scope |
| Rx saved with authenticated doctor's `hospital_id` | Done | Service hardcodes `$doctor->hospital_id` — user-supplied values ignored |

---

## Known Gaps / Deferred

1. **Medicine entry UI** — Section 7 is a placeholder. Full implementation is Prompt 6. Schema, reducer actions, and validation are already wired.
2. **Print preview route** — `/doctor/prescriptions/{id}/print` is Prompt 7. The "Save + Print" button already links there; clicking will 404 until Prompt 7 ships.
3. **Prescriptions index / list page** — Spec focuses on `/create` + `/edit`. A browse list is not required here; it will come with Prompt 10 (Reports).
4. **Drag-and-drop reorder of medicines** — Reducer has `REORDER_MEDICINES` but no UI. Will be added with medicine UI in Prompt 6.
5. **Template delete from sidebar** — Endpoint exists; UI only loads and selects, no delete button yet. Deferred until Prompt 8 (Disease Templates page).
6. **Diagnosis searchable suggestions** — Spec mentioned "free-text or searchable". Only free-text today. Would need an ICD-10 seeder.
7. **Duration presets are a flat global list** — Schema supports per-complaint-master presets, but only Fever is seeded. Seeding all 60+ complaints with presets would bloat the seeder; the flat list returned by the controller is sufficient for UX.

---

## Key Design Decisions

1. **One page for create + edit.** `/prescriptions/create` and `/prescriptions/{id}/edit` both render `Pages/Doctor/Prescriptions/Create.tsx`. The controller pre-loads a draft prescription when one exists for the (patient, doctor, appointment) tuple, so re-visiting the Queue's "Create Rx" button resumes work, it does not duplicate.
2. **Auto-save writes to the same draft row.** First save creates the row and the page tracks `rxId` in local state; subsequent saves PUT to `/prescriptions/{rxId}`. No duplicate rows from auto-save.
3. **JSON endpoint on the same controller.** `store`/`update` check `wantsJson()` / `_json` input flag and return JSON for the SPA, or a redirect for classic form posts. Avoids a parallel API controller.
4. **`LOAD_TEMPLATE` merges advices/investigations.** Loading a template replaces complaints/examinations/medicines but appends template advices/investigations to the existing sections array (filtered to remove existing advice/investigation rows first). Prevents duplicate advice lines when switching templates.
5. **BMI auto-calc uses `setTimeout` inside render.** Guards against dispatching during render. If weight or height becomes invalid, BMI is left alone (the setTimeout just doesn't fire with a new value).
6. **CSRF via meta tag, not bootstrap.** Added `<meta name="csrf-token">` so a fetch-based SPA save can read the token. Axios is already XSRF-cookie-aware for other calls.
7. **Children sync = delete-all + re-insert.** Simpler than diffing; prescription size is small (≤50 rows total across all children). Ran inside a DB transaction so a partial failure rolls back cleanly.

---

## Validation Checklist

- [x] `php -l` clean on all new PHP files
- [x] `npx tsc --noEmit` clean
- [x] Policies auto-discovered (Laravel 11 convention)
- [x] CSRF meta tag added to root blade
- [x] Routes wired — Queue page "Create Rx" link already targets `/doctor/prescriptions/create?patient_id=X&appointment_id=Y`
- [ ] Manual browser smoke test (no dev server running in this session)
- [ ] Data migration run check (existing migrations already cover all the schema used here)

---

## Next

**Prompt 6 — Medicine Entry System** slots directly into the existing `Rx — Treatment Plan` accordion:

- Add `AddMedicineModal` + commonly-used-drugs left pane fed from `doctor_frequent_medicines`.
- Add dose grid (morning/noon/afternoon/night/bedtime), timing enum, duration enum, custom instruction.
- Hook into existing `ADD_MEDICINE` / `UPDATE_MEDICINE` / `REMOVE_MEDICINE` / `REORDER_MEDICINES` actions.
- Add drag-handles using `@dnd-kit/sortable`.

**Prompt 7 — Print / PDF / PNG** fills in the `/doctor/prescriptions/{id}/print` target the "Save + Print" button already opens.
