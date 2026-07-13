# 07 — Build roadmap

The project is structured as 10 prompts in [../../Prescription-Software/project-doc.md](../../Prescription-Software/project-doc.md). Build them in order. Don't jump ahead — Prompt 5 (prescription builder) depends on Prompt 3 (patients) which depends on Prompt 2 (auth).

## Status snapshot

All ten prompts are built end-to-end. The table below reflects reality as of
2026-07-12; per-prompt detail lives in the `prompt-*-report.md` files.

| # | Prompt | Status | Notes |
|---|---|---|---|
| 1 | DB schema, migrations, models, `BelongsToHospital`, `HospitalScope` | 🟢 **Done** | Migrations + models + traits + seeders in place. |
| 2 | Role-based auth, Super Admin panel, Hospital Admin panel | 🟢 **Done** | Role routes, controllers, Inertia pages, policies, login redirect all built. See "Post-build hardening" below. |
| 3 | Patient management | 🟢 **Done** | Filters, webcam capture, CSV export. |
| 4 | Appointments & serial queue | 🟢 **Done** | See [prompt-4-report.md](prompt-4-report.md). Broadcast events deferred; polling covers real-time. |
| 5 | Prescription builder — core form | 🟢 **Done** | See [prompt-5-report.md](prompt-5-report.md). |
| 6 | Medicine entry & dose config | 🟢 **Done** | Frequent list, per-doctor defaults, missing-medicine flow. |
| 7 | Print / PDF / PNG export | 🟢 **Done** | DomPDF server-side + client fallback. |
| 8 | Disease templates | 🟢 **Done** | Doctor + global templates, analytics. |
| 9 | Global medicine DB + doctor personalization | 🟢 **Done** | See [prompt-9-report.md](prompt-9-report.md). Hospital-level medicine restrictions deferred (spec-optional). |
| 10 | Reports, settings, i18n, Docker deploy | 🟢 **Done** | See [prompt-10-report.md](prompt-10-report.md). |

## Post-build hardening (2026-07)

Work done after the 10 prompts, not part of the original spec:

- **OTP email verification + password reset** — hashed codes, attempt cap, 60s cooldown, hourly send cap (cache-backed), enumeration-safe messages, scheduled purge of stale unverified users.
- **Tenant-isolation fix (critical)** — removed public self-registration (staff are admin-provisioned); `BelongsToHospital` now fails closed for a non-super-admin with a null `hospital_id` (`whereRaw('1 = 0')`); `EnsureHospitalActive` rejects hospital-less non-super-admins. Covered by `tests/Feature/Auth/TenantIsolationTest.php`.
- **Race-safe ID generation** — `patient_uid` / `prescription_uid` retry on unique-violation (`App\Traits\GeneratesUniqueUid`); `Appointment` serials are generated under a `(doctor, date)` row lock. `nextSerial` uses `whereDate` (was silently always-1 on SQLite).
- **Receptionist dashboard** — the previously-missing `Receptionist\DashboardController` + page.
- **Security misc** — maintenance bypass secret is now random-per-activation (was hardcoded); OTP length raised 4 → 6 digits.
- **Audit log expansion** — now records `auth.login` / `auth.logout` (in `AuthenticatedSessionController`) and `patient.create/update/delete` + `appointment.delete` via `App\Observers\PatientObserver` / `AppointmentObserver` (registered with `#[ObservedBy]`). `AuditLogger::record` is exception-safe so a failed audit write never breaks the operation. Viewers colour-code actions by category.
- **Drug / allergy warnings** — `patient_allergies` table + `PatientAllergy` model (hospital-scoped) with a `Patient::allergies` relation. Managed from the prescription builder via `Doctor\PatientAllergyController` (JSON endpoints so the builder updates in place without an Inertia reload that would lose the in-progress draft). The builder's `AllergyBanner` component lists recorded allergies and flags any prescribed medicine whose brand/generic matches an allergen (case-insensitive substring, both directions). **Limitation:** no drug-class awareness — allergen "Penicillin" does not flag "Amoxicillin"; that needs a drug-class map we don't have yet.
- **Durable platform settings** — `platform_settings` key/value table + `PlatformSetting` model (`get` / `put` / `forget`). The DB row is the source of truth; the cache is only a read accelerator, so `platform.name` / `platform.logo_url` now survive a `cache:clear`. `Admin\SettingsController` reads/writes through it instead of `Cache::forever`.

### Still open (known gaps)

- Notification preferences UI (columns `notify_followup_reminders` / `notify_email` exist on `doctor_profiles`; the reminder job doesn't yet honour them) and report PDF export are deferred (see [prompt-10-report.md](prompt-10-report.md)).
- Audit log has no delete trail for prescriptions (no delete path exposed) and no dedicated retention/purge policy.

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
