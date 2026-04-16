# 07 — Build roadmap

The project is structured as 10 prompts in [../../Prescription-Software/project-doc.md](../../Prescription-Software/project-doc.md). Build them in order. Don't jump ahead — Prompt 5 (prescription builder) depends on Prompt 3 (patients) which depends on Prompt 2 (auth).

## Status snapshot

| # | Prompt | Status | Notes |
|---|---|---|---|
| 1 | DB schema, migrations, models, `BelongsToHospital`, `HospitalScope` | 🟡 **Mostly done** | Migrations + models + trait in place. Verify columns match spec; no seeders yet. |
| 2 | Role-based auth, Super Admin panel, Hospital Admin panel | 🟠 **Partial** | `RoleMiddleware`, `EnsureHospitalActive`, `HospitalScope` exist. **No role routes, controllers, Inertia pages, policies, or login redirect.** |
| 3 | Patient management | 🔴 Not started | |
| 4 | Appointments & serial queue | 🔴 Not started | |
| 5 | Prescription builder — core form | 🔴 Not started | **Critical.** Start after Prompt 3. |
| 6 | Medicine entry & dose config | 🔴 Not started | Part of the builder. |
| 7 | Print / PDF / PNG export | 🔴 Not started | |
| 8 | Disease templates | 🔴 Not started | |
| 9 | Global medicine DB + doctor personalization | 🔴 Not started | |
| 10 | Reports, settings, i18n, Docker deploy | 🔴 Not started | |

## Prompt 1 — finish line checklist

Before moving on, verify:

- [ ] Every column listed in [02-database-schema.md](02-database-schema.md) exists in the matching migration.
- [ ] Every model uses `SoftDeletes` where specified.
- [ ] `Patient`, `Appointment`, `Prescription`, `DoctorProfile`, `Chamber`, `HospitalHoliday`, `DoctorTemplate`, `DailyStatement`, and non-super-admin-scoped `User` queries use `BelongsToHospital`.
- [ ] `patient_uid` and `prescription_uid` have server-side generation logic (in the model's `creating` event or a `UidGenerator` service).
- [ ] All composite indexes from [02-database-schema.md](02-database-schema.md) are declared.
- [ ] `medicines`, `complaint_masters`, `complaint_duration_presets` are NOT hospital-scoped.
- [ ] `users.hospital_id` is nullable.
- [ ] `patients` has UNIQUE `(hospital_id, phone)`.
- [ ] Seeders exist for: super admin, medicines (JSON-sourced), complaint masters, complaint duration presets.
- [ ] `php artisan migrate:fresh --seed` runs clean on SQLite and MySQL.

## Prompt 2 — plan

Order of operations:

1. **Login redirect by role** — override Breeze's `AuthenticatedSessionController::store` to redirect based on `$user->role`.
2. **Register middleware aliases** in [../bootstrap/app.php](../bootstrap/app.php): `role`, `ensure.hospital.active`.
3. **Extend `HandleInertiaRequests`** to share `auth.user.hospital`, `permissions`, `locale`.
4. **Split route files** — create `routes/admin.php`, `routes/hospital.php`, `routes/doctor.php`, `routes/receptionist.php`; require them from `web.php` under the appropriate middleware groups.
5. **Role-aware Inertia layouts** — `AdminLayout`, `HospitalLayout`, `DoctorLayout`, `ReceptionistLayout`. Each uses the matching nav from `medixpro/` HTML mockups.
6. **Super admin controllers + pages**:
   - `Admin\DashboardController` → `Pages/Admin/Dashboard.tsx`
   - `Admin\HospitalController` (resource) → `Pages/Admin/Hospitals/{Index,Create,Edit,Show}.tsx`
   - `Admin\UserController` (resource, filterable by hospital/role) → `Pages/Admin/Users/*.tsx`
   - `Admin\MedicineController` (+ bulk import artisan command) → `Pages/Admin/Medicines/*.tsx`
   - `Admin\ComplaintMasterController`, `Admin\ComplaintDurationPresetController`
   - `Admin\GlobalTemplateController`
   - `Admin\SubscriptionController` (view + manual extend)
7. **Hospital admin controllers + pages**:
   - `Hospital\DashboardController`
   - `Hospital\DoctorController` (enforce `max_doctors` plan limit)
   - `Hospital\ReceptionistController`
   - `Hospital\ChamberController`
   - `Hospital\HolidayController`
   - `Hospital\SettingsController`
   - `Hospital\ReportController`
8. **Policies** — one per model; register in `AuthServiceProvider`.
9. **Tenant-isolation test** — write a feature test proving Hospital A's doctor cannot query Hospital B's data.

Exit criteria: a super admin can create a hospital + hospital admin; the hospital admin can log in, create a doctor, and the doctor can log in and reach their empty dashboard. All blocked by policies otherwise.

## Prompt 3 and beyond

Don't plan in detail yet — complete Prompt 2 first, then revisit this roadmap. Each prompt's exit criteria should be verifiable by hand before the next begins.

## Rule of thumb

> **Finish end-to-end** (migration → model → controller → route → Inertia page → policy → test) **before starting the next prompt.** Leaving vertical slices half-built causes drift, and drift in a multi-tenant system is how `hospital_id` checks get forgotten.
