# CLAUDE.md — Prescription-App

Project-level guidance for Claude Code when working in this repository. Read this before editing anything.

## What this project is

**MedixPro / Prescription-App** — a multi-tenant SaaS prescription management system for hospitals and clinics, with a focus on the Bangladeshi market (bilingual Bangla/English output, BMDC fields, local medicine catalogue).

A **Super Admin** onboards **hospitals** (tenants). Each hospital contains its own **doctors**, **receptionists**, **patients**, **appointments**, and **prescriptions** — strictly isolated by `hospital_id`. Doctors write prescriptions using a rich form with templates, frequently-used medicine shortcuts, and per-doctor default doses, then print/export to A4.

## Tech stack

| Layer | Choice |
|---|---|
| Backend | Laravel 11, PHP 8.2+ |
| Frontend | React 18 + TypeScript via **Inertia.js v2** (no separate SPA, no REST for views) |
| Styling | Tailwind CSS 3 + **Ant Design** (per spec — not yet installed, add when first used) |
| DB | MySQL 8 in production; **SQLite in local dev** (already configured at `database/database.sqlite`) |
| Cache / Queue | Redis 7 in production; `sync` / file driver in local dev |
| Auth | Laravel Breeze (Inertia React stack — already scaffolded) |
| Build | Vite 6 + `laravel-vite-plugin` |
| PDF | Laravel DomPDF (server) + `html2canvas` + `jsPDF` (client fallback) |
| Charts | Recharts |
| DnD | `@dnd-kit/sortable` |
| i18n | `react-i18next` + Laravel Localization (`lang/en`, `lang/bn`) |

## Architecture rules (non-negotiable)

1. **Tenant isolation by `hospital_id`** — every tenant-owned model MUST use the `App\Traits\BelongsToHospital` global scope. Never query tenant tables without it scoped (the trait does this automatically based on the authenticated user's `hospital_id`).
2. **Global (shared) tables** — `medicines`, `complaint_masters`, `complaint_duration_presets`, and `super_admin` users — are NOT hospital-scoped.
3. **Roles** — `super_admin`, `hospital_admin`, `doctor`, `receptionist`. Use `role:<name>` middleware on routes and **Laravel Policies** per model.
4. **Subscription gate** — `EnsureHospitalActive` middleware blocks everyone except `super_admin` when the hospital's subscription is expired/suspended.
5. **Soft deletes on every business model** — already wired. Don't remove.
6. **Human-readable UIDs** — `patient_uid` (e.g., `P-DMC-00142`) and `prescription_uid` (e.g., `RX-H001-20251024-0001`) are generated server-side on create; internal relations still use auto-increment IDs.
7. **Indexes** — keep composite indexes on `(hospital_id, doctor_id)`, `(hospital_id, patient_id)`, `(hospital_id, appointment_date)`, and `(hospital_id, phone)` on patients.

## Directory layout

```
Prescription-App/
├── app/
│   ├── Http/
│   │   ├── Controllers/       # role-grouped controllers go here
│   │   ├── Middleware/        # RoleMiddleware, EnsureHospitalActive, HospitalScope
│   │   └── Requests/          # FormRequest validation classes
│   ├── Models/                # 19 Eloquent models — one per table
│   └── Traits/
│       └── BelongsToHospital.php   # global scope + auto-fill hospital_id on create
├── database/
│   ├── migrations/            # 10 business migrations already written (Prompt 1)
│   ├── seeders/
│   ├── factories/
│   └── database.sqlite        # local dev DB
├── resources/
│   ├── js/
│   │   ├── Pages/             # Inertia pages — organise as Admin/*, Hospital/*, Doctor/*, Receptionist/*
│   │   ├── Layouts/           # AuthenticatedLayout (still Breeze default — replace with role-aware layout)
│   │   ├── Components/        # shared UI (currently Breeze defaults)
│   │   └── types/             # TypeScript types shared with Inertia props
│   └── views/app.blade.php    # root Inertia shell
├── routes/
│   ├── web.php                # role-grouped route files should be required from here
│   └── auth.php               # Breeze
├── docs/                      # documentation — read these for deep dive
│   ├── README.md              # index
│   ├── 01-architecture.md
│   ├── 02-database-schema.md
│   ├── 03-auth-and-roles.md
│   ├── 04-modules.md
│   ├── 05-frontend.md
│   ├── 06-dev-setup.md
│   └── 07-build-roadmap.md
└── ../Prescription-Software/
    ├── project-doc.md         # the 10-prompt source spec — treat as authoritative
    └── medixpro/              # static HTML design reference — use it when building each page
```

## Build roadmap (what's done / what's next)

The build is broken into 10 prompts in [../Prescription-Software/project-doc.md](../Prescription-Software/project-doc.md). Status:

| # | Prompt | Status |
|---|---|---|
| 1 | DB schema, migrations, models, `BelongsToHospital`, `HospitalScope` | **Done** (migrations + models + trait in place; verify & seed before moving on) |
| 2 | Role-based auth, Super Admin panel, Hospital Admin panel | **In progress** — middleware exists, role routes & controllers & Inertia pages not built |
| 3 | Patient management | Not started |
| 4 | Appointments & serial queue | Not started |
| 5 | Prescription builder (core form) | Not started — **most critical feature** |
| 6 | Medicine entry + dose config | Not started |
| 7 | Print / PDF / PNG export | Not started |
| 8 | Disease templates | Not started |
| 9 | Global medicine DB + doctor personalization | Not started |
| 10 | Reports, settings, i18n, Docker deploy | Not started |

Full detail in [docs/07-build-roadmap.md](docs/07-build-roadmap.md).

## How to work on this project

- **Follow the spec.** [../Prescription-Software/project-doc.md](../Prescription-Software/project-doc.md) is the source of truth for features. Don't improvise table columns, route names, or workflow steps — they're specified.
- **Follow the design.** [../Prescription-Software/medixpro/](../Prescription-Software/medixpro/) has a full HTML mockup of every page. Open the relevant `.html` file before building the corresponding Inertia page; match the layout.
- **One prompt at a time.** Don't jump ahead. Finish Prompt 2 end-to-end (routes + controllers + policies + Inertia pages) before starting Prompt 3.
- **Never bypass tenant scope.** If you find yourself writing `->withoutGlobalScope(...)`, stop — you almost certainly shouldn't.
- **Bangla + English.** Any user-facing string must go through `__()` / `react-i18next`. Medicine instructions, complaint names, and print output all require both languages.
- **Prescription output is A4.** Print layout must be pixel-correct; use dedicated `<PrescriptionPrintLayout />` with `@media print` CSS.
- **Don't touch `vendor/` or `node_modules/`**.

## Local dev

```bash
# from Prescription-App/
composer install
npm install
php artisan key:generate        # if .env is fresh
php artisan migrate              # creates schema in database.sqlite
php artisan db:seed              # once seeders exist
composer run dev                 # concurrently runs: php serve, queue, pail, vite
```

See [docs/06-dev-setup.md](docs/06-dev-setup.md) for the full setup including the missing packages that need to be added (Ant Design, Recharts, dnd-kit, react-i18next, dompdf, intervention/image).

## Conventions

- **File paths in commit messages and docs** use forward slashes (e.g., `app/Models/Patient.php`), even though the dev environment is Windows. Tooling handles both.
- **Migrations** are already dated `2024_01_02_*` to enforce ordering. Keep new migrations in sequence.
- **Controllers** organised by role: `App\Http\Controllers\Admin\*`, `Hospital\*`, `Doctor\*`, `Receptionist\*`, plus shared `Api\*` for XHR endpoints.
- **Inertia pages** mirror the controller namespace: `resources/js/Pages/Admin/Hospitals/Index.tsx` etc.
- **TypeScript strict**. Types for Inertia props live in `resources/js/types/`.
- **No backward-compatibility shims.** The project has no users yet — if a migration is wrong, fix the migration, don't layer a new one on top.

## Things that are easy to get wrong

- `users.hospital_id` is **nullable** — super admins have no hospital. Don't add a `NOT NULL` constraint.
- `patients` has a **unique constraint on `(hospital_id, phone)`**, not on `phone` alone. The same phone can exist in two hospitals.
- `prescription_medicines.dose_display` is a denormalized string (`"1+0+1+0+1"`) built from the five nullable decimal dose columns. Build it on save, don't read the columns on display.
- Templates are scoped by `(doctor_id, hospital_id)` — a doctor moving between hospitals does NOT carry templates across.
- Frequently-used-medicines list has a **50-per-doctor** hard cap.
- `doctor_medicine_defaults` is per doctor, NOT per hospital-doctor — a doctor keeps their defaults when switching hospitals (unlike templates).

## When in doubt

1. Read the matching prompt in [../Prescription-Software/project-doc.md](../Prescription-Software/project-doc.md).
2. Open the matching page in [../Prescription-Software/medixpro/](../Prescription-Software/medixpro/).
3. Check existing code in [app/Models/](app/Models/) and [database/migrations/](database/migrations/) — don't re-invent a model or column that already exists.
4. Ask the user before making a destructive change (dropping a migration, deleting a model, altering an existing column's type).
