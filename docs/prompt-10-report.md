# Prompt 10 — Reports, Settings, Bilingual, Deployment — Gap Analysis Report

**Date:** 2026-05-04
**Prompt:** Reports + Settings + Bilingual + Performance + Security + Deployment.
**Status:** Substantially complete. Optional items (S3 driver wiring, scheduler jobs, Pest tests for new endpoints) deferred.

---

## Summary

Three role-scoped report dashboards (`/doctor/reports`, `/hospital/reports`, `/admin/reports`) backed by cached aggregate-query services + Recharts visualisations + per-card CSV export. Three role-scoped settings pages + a SuperAdmin maintenance toggle. Full bilingual scaffolding via Laravel Localization + react-i18next with a header `LanguageSwitcher`, persisted in `users.preferred_language`. New `audit_logs` table records prescription create/update via `AuditLogger`. Docker + nginx + supervisord + GitHub Actions CI scaffold ships with the repo for production deploy.

---

## Files Added

### Backend — Reports

| File | Purpose |
|------|---------|
| `app/Services/Reports/DoctorReportService.php` | Patient count (line) + diagnosis breakdown (pie) + top medicines (bar) + follow-up compliance rate. All cached for 1 hour |
| `app/Services/Reports/HospitalReportService.php` | Doctor patient load + revenue (bucketed) + revenue-by-doctor + utilization + age/gender demographics + top medicines (hospital-wide) + new vs returning |
| `app/Services/Reports/PlatformReportService.php` | Subscription breakdown + platform totals + hospital growth + revenue-per-hospital |
| `app/Services/Reports/ReportExporter.php` | CSV streaming helper with UTF-8 BOM and column mapping |
| `app/Http/Controllers/Doctor/ReportController.php` | Doctor reports index + per-report CSV export |
| `app/Http/Controllers/Hospital/ReportController.php` | Hospital reports index + per-report CSV export |
| `app/Http/Controllers/Admin/ReportController.php` | Platform reports index + per-report CSV export |

### Backend — Settings

| File | Purpose |
|------|---------|
| `app/Http/Controllers/Doctor/SettingsController.php` | `edit` (auto-creates DoctorProfile), `updateProfile`, `updatePreferences` (UI lang + prescription output lang + paper size, header/footer/logo modes, font size, margins), `updatePassword` (current-password verify), `uploadImage` (header / footer / signature / avatar — validated to JPG/PNG/WEBP, max 2 MB, stored on `public` disk) |
| `app/Http/Controllers/Hospital/SettingsController.php` | `edit`, `update` — hospital info + default language + working hours; subscription is read-only |
| `app/Http/Controllers/Admin/SettingsController.php` | Platform name + logo URL stored in cache; maintenance mode toggle (`artisan down/up` with bypass secret `medixpro-bypass`); subscription plans surfaced from config |
| `config/subscription.php` | Source of truth for subscription plans (price + max_doctors + max_patients_per_month) |

### Backend — Bilingual & Audit

| File | Purpose |
|------|---------|
| `lang/en/common.php` + `lang/bn/common.php` | Server-side translation files |
| `app/Http/Controllers/LocaleController.php` | `POST /locale` — sets session locale + persists `preferred_language` on the user |
| `app/Http/Middleware/SetLocale.php` | Resolves locale from session → user → fallback config; appended to `web` middleware stack |
| `database/migrations/2024_01_02_000011_create_audit_logs_table.php` + `app/Models/AuditLog.php` | Audit log table with composite indexes on (hospital_id, subject_type, subject_id) and (user_id, created_at) |
| `app/Services/AuditLogger.php` | `record($action, Model $subject, array $meta)` — captures `user_id`, `hospital_id`, `subject_type`, `subject_id`, `meta`, `ip_address` |
| `app/Services/PrescriptionService.php` | Now constructor-injects `AuditLogger` and emits `prescription.create` / `prescription.update` events with medicine + complaint counts in meta |
| `database/migrations/0001_01_01_000000_create_users_table.php` | Added `preferred_language` enum (`en` / `bn`) directly to the original users migration (no shim, per CLAUDE.md) |
| `app/Models/User.php` | Added `preferred_language` to fillable |

### Frontend

| File | Purpose |
|------|---------|
| `resources/js/i18n/index.ts` + `i18n/locales/{en,bn}.json` | i18next bootstrap with `setLanguage(lng)` helper that updates html lang, localStorage, and toggles `lang-bn` body class |
| `resources/js/Components/Common/LanguageSwitcher.tsx` | Header dropdown — switches react-i18next + posts `/locale` to persist server-side |
| `resources/js/Pages/Doctor/Reports/Index.tsx` | Recharts: Line (patient count), Pie (diagnosis), Bar (top medicines) + Statistic cards for follow-up compliance |
| `resources/js/Pages/Hospital/Reports/Index.tsx` | Revenue line + new-vs-returning pie + doctor-load Table + revenue-by-doctor Table + age Bar + gender Pie + hospital-wide top medicines Bar |
| `resources/js/Pages/Admin/Reports/Index.tsx` | Subscription Pie + hospital growth Bar + revenue-per-hospital Table with monthly-fee total |
| `resources/js/Pages/Doctor/Settings/Index.tsx` | antd Tabs: Profile (BMDC/degrees/fees/header-footer text + image uploads for signature/header/footer), Prescription Preferences (UI lang, output lang, paper size, font, margins, header/footer modes), Password change |
| `resources/js/Pages/Hospital/Settings/Index.tsx` | antd Form for hospital info + default language + working hours; Descriptions for read-only subscription |
| `resources/js/Pages/Admin/Settings/Index.tsx` | antd Forms for platform name/logo + maintenance toggle + plan summary |
| `resources/js/app.tsx` | Imports `./i18n` so the locale boots before any page renders |
| `resources/js/Layouts/{Admin,Hospital,Doctor}Layout.tsx` | Added Reports + Settings nav entries; DoctorLayout adds `<LanguageSwitcher />` to header |

### Deployment

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage: node20 build of Vite assets → composer prod install → php8.3-fpm-alpine runtime with nginx + supervisord. Includes intl, gd, pdo_mysql, zip, bcmath, opcache, redis |
| `docker/nginx.conf` | Single-server nginx → php-fpm on 9000, gzip, 25 MB upload limit |
| `docker/php-fpm.conf` | Dynamic process manager tuned for small-to-mid traffic |
| `docker/supervisord.conf` | Runs nginx + php-fpm + queue worker + scheduler loop in one container |
| `docker/entrypoint.sh` | Caches config/route/view + optional `php artisan migrate` (gated on `RUN_MIGRATIONS=true`) + `storage:link` |
| `docker-compose.yml` | App + MySQL 8 + Redis 7 with persistent volumes |
| `.env.example` | Updated to MedixPro defaults (Asia/Dhaka tz, APP_PORT) |
| `.github/workflows/ci.yml` | Three jobs: backend (PHP 8.3 + Pest/PHPUnit on sqlite), frontend (Node 20 + tsc + vite build), docker (buildx build with gha cache, push-only on push events) |

---

## Routes Added

### Doctor (`routes/doctor.php`)

```
GET  /doctor/reports                        index
GET  /doctor/reports/export?report=…        CSV export

GET  /doctor/settings                       Profile + Prefs + Password tabs
PUT  /doctor/settings/profile               profile + DoctorProfile fields
PUT  /doctor/settings/preferences           UI lang + print prefs
PUT  /doctor/settings/password              with current-password check
POST /doctor/settings/upload                kind=header|footer|signature|avatar (multipart)
```

### Hospital (`routes/hospital.php`)

```
GET  /hospital/reports                      index
GET  /hospital/reports/export?report=…      CSV export

GET  /hospital/settings                     edit
PUT  /hospital/settings                     update (existed pre-prompt; controller now built)
```

### Admin (`routes/admin.php`)

```
GET  /admin/reports                         index
GET  /admin/reports/export?report=…         CSV export

GET  /admin/settings                        edit
PUT  /admin/settings/platform               name + logo
PUT  /admin/settings/maintenance            toggle (enable: bool)
```

### Public

```
POST /locale                                set locale (session + user.preferred_language)
```

---

## Spec Coverage

| Spec Requirement | Coverage |
|------------------|----------|
| Doctor: Daily/Weekly/Monthly patient count line chart | ✅ `patient_count` with bucket Segmented |
| Doctor: Disease pie (template/diagnosis) | ✅ via `prescription_sections.section_type='diagnosis'` |
| Doctor: Medicine frequency bar | ✅ `top_medicines` |
| Doctor: Follow-up compliance % | ✅ matches follow-up date ± 14 days |
| Doctor: PDF or CSV export | CSV ✅. PDF deferred (existing PDF infrastructure in PrescriptionPdfService is per-prescription not per-report) |
| Hospital Admin: Doctor-wise patient load | ✅ |
| Hospital Admin: Revenue summary daily/weekly/monthly + doctor breakdown | ✅ |
| Hospital Admin: Hospital occupancy/utilization | ✅ `utilization` block |
| Hospital Admin: Age/Gender demographics | ✅ |
| Hospital Admin: Top prescribed medicines (hospital) | ✅ |
| Hospital Admin: New vs returning patients | ✅ |
| Super Admin: Subscription status breakdown | ✅ |
| Super Admin: Platform totals | ✅ totals card row |
| Super Admin: Hospital growth chart (per month) | ✅ |
| Super Admin: Revenue per hospital (subscription fees) | ✅ Table with monthly-fee total |
| Recharts | ✅ |
| 1-hour cache on aggregates | ✅ `Cache::remember(..., now()->addHour())` |
| Doctor Settings: Profile + header/footer + prefs + notifications + password | Profile ✅, header/footer (text+image) ✅, prefs ✅, password ✅. **Notification toggles deferred** — toggle column doesn't exist on doctor_profiles yet |
| Hospital Settings: Info + default language + working hours + subscription view | ✅ default_language + working_hours stored in hospitals.settings JSON |
| Admin Settings: Platform name/logo + plan defs (read-only) + maintenance toggle | ✅ |
| Admin: Default complaint masters management | Already in Prompt 9 (`/admin/complaints`). Linked via nav |
| Bilingual: lang/en + lang/bn dirs | ✅ |
| Bilingual: react-i18next | ✅ with detectInitialLanguage from meta + localStorage |
| Bilingual: language switcher in top nav | ✅ in DoctorLayout (other layouts can drop the same component) |
| Bilingual: users.preferred_language column | ✅ enum en/bn on the original users migration |
| Bilingual: Bangla font | ✅ `Noto Sans Bengali` listed in antd `ConfigProvider.fontFamily` |
| Performance: Medicine search FTS + cache | ✅ pre-existing `MedicineSearchService` |
| Performance: Dashboard 5-min cache | Reports cache ✅ at 1 hour. 5-min dashboard cache deferred |
| Performance: Composite indexes | ✅ existing migrations carry the (hospital_id, doctor_id), (hospital_id, patient_id), (hospital_id, appointment_date), (hospital_id, phone) indexes |
| Security: RBAC policies | ✅ pre-existing |
| Security: Rate limiting | Laravel default `throttle:60,1` on api routes ✅ (kept) |
| Security: CSRF + Inertia | ✅ Inertia handles |
| Security: File upload MIME + 2 MB | ✅ Doctor `uploadImage` validates `image\|mimes:jpg,jpeg,png,webp\|max:2048` |
| Security: Audit log create/edit/delete | ✅ for prescription create + update. Delete path not currently exposed for prescriptions |
| Deployment: Docker (app/nginx/mysql/redis/queue) | ✅ |
| Deployment: .env.example | ✅ updated |
| Deployment: GitHub Actions test → build | ✅ backend + frontend + docker buildx |
| Deployment: SSL via Certbot | Out of scope of repo (operator concern) |
| Deployment: S3 production storage | Env vars commented in .env.example; controller uses `Storage::url($path)` so swapping disk is config-only |
| Deployment: Scheduler for daily statements + reminders | Scheduler loop runs in supervisord; concrete jobs deferred |

---

## Things that are easy to get wrong

- **`audit_logs.subject_type` is the FQCN** — no morph map registered yet. If the model namespace ever changes, old rows still hold the old class string.
- **Maintenance bypass secret** — hardcoded `medixpro-bypass`. In production override `php artisan down --secret=$(openssl rand -hex 16)` instead of toggling via the UI.
- **`platform.name` + `platform.logo_url` live in cache** — they survive across requests via the configured cache driver. With a `file` driver they persist; with `redis` they vanish on flush. Move to a `platform_settings` table if you need durability.
- **`preferred_language` migration was edited in place** — `0001_01_01_000000_create_users_table.php`. Anyone with a stale DB must `migrate:fresh` (per project's "no backward-compat shims" rule).
- **Bucket grouping uses driver-specific SQL** — sqlite uses `strftime`, MySQL uses `DATE_FORMAT`. The helper handles both. If you swap to Postgres, rewrite `bucketExpression()` in each report service.
- **Report cache keys include date range** — different ranges produce different keys. A 1-hour TTL on `last 30 days` is acceptable; if you want live numbers, call `Cache::tags(['reports'])->flush()` after a write or shorten the TTL.
- **Recharts Pie + ResponsiveContainer** — both must have explicit `height`. Setting only width breaks rendering with a console warning.
- **Locale middleware order matters** — `SetLocale` is appended after `HospitalScope` so it runs after auth resolution (`$request->user()` is populated).
- **Docker image bundles supervisor + nginx + php-fpm + queue + scheduler** — fine for single-host. For Kubernetes, split into separate Deployments (web vs worker vs scheduler) — supervisord makes that harder.
- **`storage` volume in docker-compose is anonymous** — moves with the container. Use a named volume or bind-mount in production.

---

## What is NOT in this prompt

- PDF export of reports (CSV only).
- Notification preferences (follow-up reminders on/off, email notifications).
- Doctor profile photo cropper / Intervention Image compression pipeline (intervention/image is installed but the upload path doesn't currently re-encode).
- 5-min dashboard stats cache invalidation on new appointment/prescription.
- Pest tests for new endpoints.
- Concrete scheduled jobs (daily statement generation, follow-up reminder emails) — only the scheduler loop is configured.
- Audit log viewer UI for hospital admin.
- Rate-limit override (still default `throttle:60,1`).
