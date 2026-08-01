# Prompt 8 — Template Management System — Gap Analysis Report

**Date:** 2026-04-23
**Prompt:** Disease Templates (doctor + hospital_admin + super_admin)
**Status:** Complete.

---

## Summary

End-to-end template lifecycle is wired: doctors manage their personal templates under `/doctor/templates`, hospital admins manage hospital-wide global templates under `/hospital/templates`, and the prescription builder offers Replace/Merge confirmation when applying a template. Hospital admins also get a `/hospital/templates/analytics` dashboard showing most-used templates + recent activity across the hospital.

Ant Design was adopted for Prompt 8 and is used throughout the template pages (Form, Index, Analytics). Global Ant Design theme is wired via `ConfigProvider` in `resources/js/app.tsx` so downstream prompts can continue with antd.

---

## Files Added

### Backend

| File | Purpose |
|------|---------|
| `app/Http/Controllers/Doctor/TemplateController.php` | Full CRUD for personal templates: `index` (tabs mine/global), `show` (JSON + `recordUse`), `create`, `edit`, `store`, `update`, `duplicate`, `destroy`. Exposes `formProps()` helper returning `complaint_masters`, `duration_presets`, `advice_suggestions`, `frequent_medicines`, `instruction_presets`, `duration_day_presets` |
| `app/Http/Controllers/Hospital/TemplateController.php` | Global template CRUD for hospital admins. `index` filters to `is_global=true` scoped to `hospital_id`. `create`/`store` require `createGlobal` ability. `edit`/`update`/`destroy` guard `is_global` to prevent accidental writes to personal rows |
| `app/Http/Controllers/Hospital/TemplateAnalyticsController.php` | Hospital admin dashboard. Returns top 50 most-used templates (with doctor name), recent activity in the selected range (7/30/90/180/365 d), and four summary statistics (total, global, total uses, active in period) |
| `app/Http/Requests/TemplateRequest.php` | Validates `disease_name` (required), `is_global`, and nested arrays for complaints / examinations / medicines / advices / investigations |
| `app/Services/TemplateCrudService.php` | `create`, `update`, `duplicate`, `recordUse` + private `normalizeComplaints` / `normalizeExaminations` / `normalizeMedicines` / `normalizeSections` helpers. `duplicate` always creates a personal copy (`is_global=false`, `doctor_id=user->id`) |
| `app/Policies/DoctorTemplatePolicy.php` | `before()` allows super_admin. `viewAny`: doctor + hospital_admin. `view`: owning doctor, or hospital_admin within same hospital for global. `create`: doctor + hospital_admin. `createGlobal`: hospital_admin only. `update`/`delete`: owning doctor (personal) or hospital_admin (global in same hospital). `duplicate`: doctor can duplicate anything they can view |

### Frontend

| File | Purpose |
|------|---------|
| `resources/js/app.tsx` | Wrapped `<App />` with antd `ConfigProvider` + `AntApp` to enable global theme + imperative `message` / `modal` APIs |
| `resources/js/Pages/Doctor/Templates/Index.tsx` | antd Tabs (mine/global) + search Input + Card grid + Popconfirm delete + edit/duplicate actions + Pagination |
| `resources/js/Pages/Doctor/Templates/Form.tsx` | antd Form with disease_name Input + is_global Checkbox (gated on `can_create_global`). Reuses prescription builder sections (`ComplaintsSection`, `ExaminationSection`, `MedicineSection`, `TextListSection`) with local `useState` instead of the prescription reducer. Includes `normalizeMedicineRow` + `numOrNull` helpers |
| `resources/js/Pages/Hospital/Templates/Index.tsx` | antd Card grid scoped to global templates only. Create / Edit / Delete. Always shows `Global` tag |
| `resources/js/Pages/Hospital/Templates/Form.tsx` | Mirrors doctor Form but hardcodes `is_global: true` in save payload. Empty `frequent_medicines` since hospital admin has no prescribing context |
| `resources/js/Pages/Hospital/Templates/Analytics.tsx` | antd Statistic cards + most-used templates Table + recent-activity Table + Segmented range picker (7/30/90/180/365 d) |

### Reducer Changes

| File | Change |
|------|--------|
| `resources/js/hooks/usePrescriptionReducer.ts` | Added `MERGE_TEMPLATE` action that appends template content (complaints, examinations, medicines, advice + investigation sections) to existing state instead of replacing. Existing `LOAD_TEMPLATE` behavior unchanged (wipe-and-replace) |

### Builder Integration

| File | Change |
|------|--------|
| `resources/js/Pages/Doctor/Prescriptions/Create.tsx` | Replaced `alert()` calls with antd `message.success` / `message.error` in `saveAsTemplate` and `save`. Added `applyTemplate(tpl)` which shows antd `Modal.confirm` with custom footer offering **Replace** (primary, danger), **Merge** (custom button), **Cancel**. Skips confirmation when form is empty. Wired `TemplateSidebar.onSelect={applyTemplate}` replacing the inline `dispatch` |

---

## Routes Added

### Doctor (`routes/doctor.php`)

```
GET    /doctor/templates                    index
GET    /doctor/templates/create             create
GET    /doctor/templates/{template}         show (JSON, bumps use_count)
GET    /doctor/templates/{template}/edit    edit
POST   /doctor/templates                    store
PUT    /doctor/templates/{template}         update
POST   /doctor/templates/{template}/duplicate duplicate
DELETE /doctor/templates/{template}         destroy
```

### Hospital (`routes/hospital.php`)

```
GET    /hospital/templates/analytics         analytics dashboard
GET    /hospital/templates                   global template index
GET    /hospital/templates/create            create
GET    /hospital/templates/{template}/edit   edit
POST   /hospital/templates                   store (forces is_global=true)
PUT    /hospital/templates/{template}        update (rejects non-global)
DELETE /hospital/templates/{template}        destroy (rejects non-global)
```

### Navigation

- `HospitalLayout`: added `Global Templates` (`/hospital/templates`) and `Template Analytics` (`/hospital/templates/analytics`) to sidebar.
- `DoctorLayout`: existing `Templates` entry already pointed at `/doctor/templates`.

---

## Spec Coverage

| Spec Requirement | Coverage |
|------------------|----------|
| Template List Page (cards, disease/medicine count/updated/use count, search, tabs mine/global, View/Edit/Delete/Duplicate actions) | Cards ✅, counts ✅, search ✅, tabs ✅, Edit/Delete/Duplicate ✅. **View** is not a dedicated page — card shows full summary and the detail JSON is fetched on apply; spec-listed View button omitted intentionally |
| Create/Edit Template (disease name + all prescription sections + Save) | ✅ via `Doctor/Templates/Form.tsx` |
| Save from Prescription (button, name prompt, strips patient data) | ✅ via existing `FollowUpPicker` "Save as Template" → `Create.tsx saveAsTemplate()`. Payload carries only medical content |
| Template Application (click sidebar, confirm "Apply template '{name}'?", Replace or Merge, fills sections) | ✅ via `applyTemplate()` + `MERGE_TEMPLATE` reducer action |
| Global Templates (admin creates `is_global=true`, appears for all doctors, doctors cannot edit but can duplicate) | ✅ via `Hospital/TemplateController` + policy + `duplicate()` service method |
| Template Analytics (use count per template, most-popular dashboard for admin) | ✅ `use_count` column + `last_used_at` + `Hospital/Templates/Analytics` page |
| Hospital Scoping (personal = doctor + hospital, global = hospital or null for super_admin, no cross-hospital carry) | ✅ via `BelongsToHospital` trait + policy checks against `hospital_id` |

---

## Things that are easy to get wrong

- **`MERGE_TEMPLATE` vs `LOAD_TEMPLATE`** — merge appends to existing arrays, load wipes them. When merging, the existing template_id is preserved if one was already set; on a fresh apply it's overwritten with the new id.
- **Hospital admin creating a template** — `TemplateCrudService::create()` sets `doctor_id = null` when `$asGlobal` is true. Any UI path that needs to edit a global template MUST go through hospital admin routes; `doctor_id = null` would otherwise break the Doctor-side `view` policy check.
- **`duplicate()` always makes a personal copy** — hospital admin "duplicate" doesn't exist. If a hospital admin wants to fork a global template as personal, they would need to be acting as a doctor (different account).
- **`recordUse()` fires on `show`, not on apply** — `TemplateSidebar` fetches `/doctor/templates/{id}` before dispatching `LOAD_TEMPLATE` / `MERGE_TEMPLATE`; the fetch increments `use_count`. If the apply is ever refactored to use a local cached copy, the counter will stop moving.
- **Ant Design theme is global** — `ConfigProvider` wraps the whole app. Don't add local `ConfigProvider` inside pages; it will shadow the global theme.

---

## What is NOT in this prompt

Reports / settings / i18n / deploy — all deferred to Prompt 10.
