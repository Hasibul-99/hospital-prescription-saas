# Prompt 9 — Medicine Database Management & Doctor Personalization — Gap Analysis Report

**Date:** 2026-04-23
**Prompt:** Global medicine database (super_admin) + doctor personalization (frequent, defaults, missing flow) + complaint masters.
**Status:** Complete. Hospital-level medicine restrictions (spec-flagged optional) deferred.

---

## Summary

Super admin gets a full medicine catalogue CRUD at `/admin/medicines` with search/sort/paginate/filter (type, manufacturer, status), individual edit/deactivate, bulk CSV/JSON upload via UI, and an artisan command. Pending submissions from the doctor "Medicine missing?" flow land in `/admin/medicine-requests` for approve/reject; approval writes a `user_notifications` row so the submitting doctor sees an in-app notification.

Doctors get `/doctor/settings/medicine-defaults` with a frequent-medicines pane (search-add, drag-reorder, 50-cap enforced) and a saved-doses pane listing per-medicine default dose rows. A notification bell in the doctor header polls `/doctor/notifications` every 60 s and shows unread items.

Complaint masters (super admin) live at `/admin/complaints` with full CRUD, per-complaint duration-preset management (add / edit / drag-reorder / delete) and JSON bulk import.

---

## Files Added

### Backend — Admin

| File | Purpose |
|------|---------|
| `app/Http/Controllers/Admin/MedicineController.php` | `index` (searchable/sortable/paginated with type + manufacturer + status filters), `create`, `edit`, `store`, `update`, `destroy` (soft deactivate by setting `is_active=false`), `activate`, `bulkImport` (accepts `.csv` / `.json` upload, delegates to `MedicineBulkImportService`) |
| `app/Http/Controllers/Admin/MedicineRequestController.php` | `index` for pending submissions, `approve` (flips `is_pending_approval=false` + writes `UserNotification` to submitter), `reject` (deletes the row) |
| `app/Http/Controllers/Admin/ComplaintMasterController.php` | `index` / `create` / `edit` / `store` / `update` / `destroy` + `addPreset`, `updatePreset`, `destroyPreset`, `reorderPresets`, `bulkImport` (JSON) |

### Backend — Doctor

| File | Purpose |
|------|---------|
| `app/Http/Controllers/Doctor/MedicineSettingsController.php` | `index` renders `Doctor/Settings/MedicineDefaults` Inertia page with the doctor's frequent list (via `DoctorFrequentMedicine`) and saved defaults (via `DoctorMedicineDefault`). `reorderFrequent` updates `sort_order` per row |
| `app/Http/Controllers/Doctor/NotificationController.php` | `index` returns unread `UserNotification` rows (JSON). `ack` marks one as read |

### Services & Commands

| File | Purpose |
|------|---------|
| `app/Services/MedicineBulkImportService.php` | `importFile($path)` dispatches to `importRows()` based on extension. CSV parser uses header row; JSON expects array of objects. Per-row validation via Laravel `Validator`. Dedup check against `(brand_name, strength, manufacturer)`. Wrapped in a single DB transaction. Invalidates `MedicineSearchService` cache on completion |
| `app/Console/Commands/ImportMedicinesCommand.php` | `php artisan medicines:import {file}` — CLI wrapper around the bulk import service. Reports created / skipped / first 10 errors |

### Models & Migrations

| File | Change |
|------|--------|
| `database/migrations/2024_01_02_000010_create_user_notifications_table.php` | New table: `id`, `user_id` (FK cascade), `type` (string 50), `data` (json), `read_at` (nullable ts), timestamps. Index on `(user_id, read_at)` |
| `app/Models/UserNotification.php` | `$fillable`, casts (`data` → array, `read_at` → datetime), `user()` belongsTo, `scopeUnread()` |
| `app/Models/Medicine.php` | Added `submittedBy()` `BelongsTo(User::class, 'submitted_by_user_id')` relation used by the admin requests page |

### Frontend — Admin

| File | Purpose |
|------|---------|
| `resources/js/Pages/Admin/Medicines/Index.tsx` | antd Table + Input search + Select filters (type, manufacturer, status) + Upload (CSV/JSON bulk import) + Badge-wrapped "Pending Requests" button + Pagination. Server-side sort handoff via `onChange` → `apply({sort, dir})` |
| `resources/js/Pages/Admin/Medicines/Form.tsx` | antd Form with brand_name / generic_name / type (Select) / strength / manufacturer / price / is_active (Switch) |
| `resources/js/Pages/Admin/MedicineRequests/Index.tsx` | antd Table listing pending rows with submitter info + approve/reject Popconfirm buttons |
| `resources/js/Pages/Admin/Complaints/Index.tsx` | antd Table with search + category filter + status filter + bulk import Upload (JSON only) + "Add" link |
| `resources/js/Pages/Admin/Complaints/Form.tsx` | antd Form for master + inline duration-preset manager with dnd-kit drag reorder + add/delete buttons |

### Frontend — Doctor

| File | Purpose |
|------|---------|
| `resources/js/Pages/Doctor/Settings/MedicineDefaults.tsx` | antd Tabs (Frequent / Defaults). Frequent tab: AutoComplete backed by `/doctor/medicines/search`, drag-reorder via dnd-kit, Popconfirm remove, 50-cap enforcement. Defaults tab: List of saved dose defaults with dose display (`a+b+c+d+e` format), tags for timing / duration, delete action |
| `resources/js/Components/Notifications/NotificationBell.tsx` | antd Badge + Dropdown in header. Polls `/doctor/notifications` every 60 s. Mark-read button POSTs to `/doctor/notifications/{id}/ack` |
| `resources/js/Layouts/DoctorLayout.tsx` | Added `<NotificationBell />` to header + `Medicine Settings` nav item |
| `resources/js/Layouts/AdminLayout.tsx` | Added `Medicines`, `Medicine Requests`, `Complaints` nav items |

---

## Routes Added

### Admin (`routes/admin.php`)

```
GET    /admin/medicines                          index
GET    /admin/medicines/create                   create
POST   /admin/medicines                          store
GET    /admin/medicines/{medicine}/edit          edit
PUT    /admin/medicines/{medicine}               update
DELETE /admin/medicines/{medicine}               destroy (deactivate)
POST   /admin/medicines/{medicine}/activate      activate
POST   /admin/medicines/bulk-import              bulkImport (upload CSV/JSON)

GET    /admin/medicine-requests                  requests index
POST   /admin/medicine-requests/{medicine}/approve approve (writes UserNotification)
DELETE /admin/medicine-requests/{medicine}       reject

POST   /admin/complaints/bulk-import             complaint JSON bulk import
RESOURCE /admin/complaints                       full CRUD via Route::resource
POST   /admin/complaints/{complaint}/presets     add duration preset
POST   /admin/complaints/{complaint}/presets/reorder  reorder (ordered_ids: int[])
PATCH  /admin/complaints/presets/{preset}        update preset
DELETE /admin/complaints/presets/{preset}        delete preset
```

### Doctor (`routes/doctor.php`)

```
GET    /doctor/settings/medicine-defaults        settings page
POST   /doctor/settings/frequent/reorder         reorder frequent list (ordered_medicine_ids: int[])

GET    /doctor/notifications                     unread list (JSON)
POST   /doctor/notifications/{id}/ack            mark read
```

### Artisan

```
php artisan medicines:import {file}
# Reports: Created, Skipped (duplicates), Errors (first 10 shown).
```

---

## Spec Coverage

| Spec Requirement | Coverage |
|------------------|----------|
| Global Medicine List — searchable, sortable, paginated, columns (brand/generic/type/strength/manufacturer/price/status), filters (type, manufacturer, generic search), Edit/Deactivate | ✅ |
| Bulk Import — CSV/JSON upload with dedup + error reporting | ✅ UI upload + ✅ `medicines:import` CLI |
| Medicine Seeder — JSON data file in `database/data/medicines.json` | ✅ pre-existing `MedicineSeeder` kept as-is |
| Doctor Frequent Medicines — browse, mark as frequent, drag-reorder, 50-cap | ✅ via `/doctor/settings/medicine-defaults` |
| Default Dose Settings — save per-medicine default, auto-fill in builder | ✅ via pre-existing `DoctorMedicineDefault` + `MedicineSection.tsx fetchDefaults` |
| Medicine Missing Flow — doctor submits, super admin reviews, doctor gets in-app notification on approval | ✅ via `storeMissing` endpoint + `MedicineRequestController::approve` + `UserNotification` + `NotificationBell` |
| Complaint Masters — table with EN/BN/category/sort, CRUD, bulk JSON import | ✅ |
| Duration Presets — per complaint, add/edit/delete/reorder | ✅ all four |
| Hospital-level medicine restrictions (optional) | ⏭️ deferred — spec flags it optional |

---

## Things that are easy to get wrong

- **`submittedBy` relation JSON key** — Laravel serialises relations using `$snakeAttributes = true`, so `->with('submittedBy')` shows up as `submitted_by` on the JSON side. The React page relies on this snake_case key.
- **Bulk-import route order** — `POST /admin/medicines/bulk-import` is a literal string and is safe when placed after `POST /admin/medicines/{medicine}/activate` because the parameter route requires the `/activate` suffix. For complaint masters, `/admin/complaints/bulk-import` is declared **before** `Route::resource('complaints', …)` so it doesn't get eaten by the `show` route.
- **`DoctorMedicineDefault` is per doctor only** — not per (doctor, hospital). A doctor moving between hospitals keeps their dose defaults. Don't add a `hospital_id` scope to it.
- **`is_pending_approval` vs `is_active`** — a pending submission has `is_pending_approval=true` and is already `is_active=true` (so it's still hidden from search via `MedicineSearchService`, which filters on `is_pending_approval=false`). On approve, both flags end up `false` / `true` respectively. Don't conflate the two booleans.
- **Notification polling** — `NotificationBell` polls every 60 s. It only appears in `DoctorLayout` right now; if hospital admin or super admin ever need notifications, drop the same `<NotificationBell />` into those layouts — no server-side role check needed because the controller scopes to `$request->user()->id`.
- **Bulk medicine import dedup key** — `(brand_name, strength, manufacturer)`. A row with the same brand but a different strength is NOT a duplicate. The CSV must include a header row.
- **`MedicineSearchService::invalidate()`** — called after every write path (single create, single update, single deactivate, bulk import, request approve, request reject). Don't skip it in new write paths or the search cache will go stale.

---

## What is NOT in this prompt

- Hospital-level medicine restrictions — spec-flagged optional.
- Dedicated "view" detail page for a medicine — the edit page is the detail view.
- Per-hospital custom medicine catalogues — all writes land in the global table.
- Reporting / settings / i18n / deploy — Prompt 10.
