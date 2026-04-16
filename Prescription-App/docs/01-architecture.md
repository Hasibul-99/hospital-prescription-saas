# 01 — Architecture

## Multi-tenant model

**Single database, tenant-scoped by `hospital_id`.** Every tenant-owned row carries a `hospital_id` foreign key. Queries are scoped automatically via a Laravel **global scope** attached to each tenant model through the `App\Traits\BelongsToHospital` trait.

```
┌─────────────────────────────────────────────────────┐
│                Super Admin (no hospital)            │
│   Creates hospitals, manages plans, curates global  │
│   medicines + complaint masters + templates         │
└───────────┬─────────────────────────────────────────┘
            │ creates
            ▼
┌─────────────────────────────────────────────────────┐
│  Hospital (tenant) — has subscription, plan limits  │
├─────────────────────────────────────────────────────┤
│  Hospital Admin — manages doctors, receptionists,   │
│                   chambers, holidays                │
│  Doctor — writes prescriptions for patients in this │
│           hospital only                             │
│  Receptionist — manages queue and appointments      │
│  Patient — scoped to this hospital                  │
└─────────────────────────────────────────────────────┘
```

### Shared (global) tables

Not hospital-scoped — shared across every tenant:

- `medicines` — ~30,000 Bangladeshi medicine entries
- `complaint_masters` — common patient complaints (bilingual)
- `complaint_duration_presets` — duration tags per complaint
- `users` rows where `role = 'super_admin'` (they have `hospital_id = NULL`)

### Tenant tables

Everything else (`hospitals`, `doctor_profiles`, `chambers`, `hospital_holidays`, `patients`, `appointments`, `prescriptions`, `prescription_complaints`, `prescription_examinations`, `prescription_sections`, `prescription_medicines`, `doctor_templates`, `doctor_medicine_defaults`, `doctor_frequent_medicines`, `daily_statements`, and non-super-admin `users`).

## Request lifecycle

1. **Inertia request** arrives at a Laravel route.
2. `auth` middleware checks the user is logged in.
3. `role:<name>` middleware (e.g., `role:doctor`) checks the user's `role` column.
4. `hospital.active` middleware (alias for `EnsureHospitalActive`) blocks if the user's hospital's subscription is expired/suspended — except for `super_admin`.
5. Controller runs. Any query on a tenant model is **automatically scoped** by `hospital_id` via the global scope on `BelongsToHospital`.
6. Controller returns an `Inertia::render(...)` response, which the `HandleInertiaRequests` middleware augments with shared props (auth.user, flash, etc.) before the React page renders.

## Hospital scoping — how the trait works

`App\Traits\BelongsToHospital` does two things when booted on a model:

1. **Global scope** — adds `WHERE hospital_id = auth()->user()->hospital_id` to every query, unless the user is a super admin (in which case no scope is applied and super admins see across hospitals).
2. **Creating event** — sets `hospital_id` automatically when a model is being created, unless explicitly provided.

This means controllers write naturally:

```php
Patient::create(['name' => 'Rahim', 'phone' => '01700000000', ...]);
// hospital_id is filled in by the trait — don't pass it
```

And reads are safe by default:

```php
Patient::where('name', 'like', "%$q%")->get();
// Only returns patients in the current user's hospital
```

**Escape hatch:** `Model::withoutGlobalScope(BelongsToHospital::class)` — only use this from super-admin contexts. If you're reaching for it from a hospital-scoped controller, stop and reconsider.

## Subscription gate

Each hospital has a `subscription_status` ENUM: `active | trial | expired | suspended`. The `EnsureHospitalActive` middleware inspects the authenticated user's hospital and rejects with a 403 / redirect if the status is `expired` or `suspended`. Super admins bypass the check.

## Plan limits

Hospitals have `max_doctors` and `max_patients_per_month` quotas driven by subscription plan. Enforce on create:

- Hospital Admin creating a doctor → check current doctor count < `max_doctors`.
- Receptionist / admin registering a patient → check month-to-date patient count < `max_patients_per_month`.

(Quota enforcement is **NOT YET IMPLEMENTED** — add it when building Prompt 2.)

## Key conventions

- **Human-readable UIDs** — generated on create:
  - `patient_uid` — `P-{hospital_short_code}-{sequence}` e.g., `P-DMC-00142`
  - `prescription_uid` — `RX-{hospital_code}-{date}-{sequence}` e.g., `RX-H001-20251024-0001`
- **Auto-increment IDs** are still the primary key and the foreign key target. UIDs are for humans.
- **Soft deletes** on all business tables. Use `->restore()` rather than re-creating.
- **Full-text index** on `medicines (brand_name, generic_name)` for fast search (MySQL FULLTEXT; fall back to `LIKE` on SQLite in dev).
