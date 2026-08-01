# Prompt 2 — Gap Analysis Report

**Date:** 2026-04-19
**Prompt:** Role-Based Auth, Super Admin & Hospital Management
**Status:** Partially Complete (~35%)

---

## Summary

Prompt 2 covers four major areas: Authentication, Super Admin Panel, Hospital Admin Panel, and Authorization (Policies). Infrastructure (middleware, routes, layouts, login redirect) is solid. Controllers and Inertia pages are mostly missing.

---

## Section-by-Section Breakdown

### 1. Authentication (Laravel Breeze + Inertia.js React)

| Task | Status | Notes |
|------|--------|-------|
| Login page with email/password | Done | Breeze scaffolded |
| Role-based redirect after login | Done | `AuthenticatedSessionController` — redirects to `/admin/dashboard`, `/hospital/dashboard`, `/doctor/dashboard`, `/receptionist/dashboard` |
| Forgot password flow | Done | Breeze default |
| Email verification flow | Done | Breeze default |
| `role:<name>` middleware | Done | `RoleMiddleware` registered as `role` alias in `bootstrap/app.php` |
| `EnsureHospitalActive` middleware | Done | Registered as `hospital.active` alias |
| `HospitalScope` middleware | Done | Appended to web middleware group |
| `last_login_at` update on login | Done | Set in `AuthenticatedSessionController` |
| Shared Inertia props (auth, flash, locale) | Done | `HandleInertiaRequests` updated |

**Authentication: 100% complete**

---

### 2. Super Admin Panel (/admin/*)

#### 2.1 Dashboard

| Task | Status | Notes |
|------|--------|-------|
| Controller (`Admin\DashboardController`) | Done | Returns stats + recent hospitals |
| Page (`Admin/Dashboard.tsx`) | Done | Stats cards + recent hospitals table |
| Total hospitals stat | Done | |
| Total doctors stat | Done | |
| Total prescriptions stat | Done | |
| Active subscriptions stat | Done | |
| Revenue chart (monthly) | Missing | Not in controller or page |
| Recent hospital registrations table | Done | |

#### 2.2 Hospital Management (/admin/hospitals)

| Task | Status | Notes |
|------|--------|-------|
| Controller (`Admin\HospitalController`) | Done | Full CRUD + toggleStatus |
| Route definitions | Done | `Route::resource` + toggle-status |
| List hospitals page (`Index.tsx`) | Missing | Controller ready, no page |
| Create hospital form (`Create.tsx`) | Missing | Controller ready, no page |
| Edit hospital form (`Edit.tsx`) | Missing | Controller ready, no page |
| View hospital detail (`Show.tsx`) | Missing | Controller ready, no page |
| Logo upload on create/edit | Missing | Not in controller validation |
| Search/filter (name, plan, status) | Done | In controller `index()` |
| Doctors count, patients count on list | Done | `withCount` in controller |
| Suspend/Activate toggle | Done | `toggleStatus` method |

#### 2.3 User Management (/admin/users)

| Task | Status | Notes |
|------|--------|-------|
| Route definitions | Done | `Route::resource('users', UserController::class)` |
| Controller (`Admin\UserController`) | Missing | Referenced in routes, file does not exist |
| List users page | Missing | |
| Create user form | Missing | |
| Edit user form | Missing | |
| Filter by hospital and role | Missing | |
| Create doctor_profile for doctor users | Missing | |

#### 2.4 Medicine Database (/admin/medicines)

| Task | Status | Notes |
|------|--------|-------|
| Routes | Missing | Not defined in `admin.php` |
| Controller | Missing | |
| CRUD pages | Missing | |
| Bulk CSV import | Missing | |
| Complaint masters management | Missing | |
| Duration presets management | Missing | |

#### 2.5 Global Templates (/admin/templates)

| Task | Status | Notes |
|------|--------|-------|
| Routes | Missing | Not defined in `admin.php` |
| Controller | Missing | |
| CRUD pages for `is_global=true` templates | Missing | |

#### 2.6 Subscription & Billing

| Task | Status | Notes |
|------|--------|-------|
| Routes | Missing | Not defined in `admin.php` |
| Controller | Missing | |
| View subscription status page | Missing | |
| Extend/change subscription manually | Missing | |

**Super Admin Panel: ~25% complete** (Dashboard done, Hospital controller done, everything else missing)

---

### 3. Hospital Admin Panel (/hospital/*)

| Task | Status | Notes |
|------|--------|-------|
| Route definitions | Done | All resources defined in `hospital.php` |
| Layout (`HospitalLayout.tsx`) | Done | Sidebar with all nav items |
| Dashboard controller | Missing | Referenced in routes, no file |
| Dashboard page | Missing | |
| Doctor management controller | Missing | Referenced in routes, no file |
| Doctor management pages | Missing | |
| Receptionist management controller | Missing | Referenced in routes, no file |
| Receptionist management pages | Missing | |
| Chamber management controller | Missing | Referenced in routes, no file |
| Chamber management pages | Missing | |
| Holiday management controller | Missing | Referenced in routes, no file |
| Holiday management pages | Missing | |
| Settings controller | Missing | Referenced in routes, no file |
| Settings page | Missing | |
| Reports page | Missing | Not even in routes |

**Hospital Admin Panel: ~15% complete** (Routes + layout only)

---

### 4. Doctor & Receptionist Panels

| Task | Status | Notes |
|------|--------|-------|
| Doctor routes | Partial | Only dashboard route defined |
| Doctor layout (`DoctorLayout.tsx`) | Done | Full sidebar nav |
| Doctor dashboard controller | Missing | No file |
| Doctor dashboard page | Missing | |
| Receptionist routes | Partial | Only dashboard route defined |
| Receptionist layout (`ReceptionistLayout.tsx`) | Done | Full sidebar nav |
| Receptionist dashboard controller | Missing | No file |
| Receptionist dashboard page | Missing | |

**Doctor & Receptionist: ~15% complete** (Routes + layouts only)

---

### 5. Authorization (Policies)

| Task | Status | Notes |
|------|--------|-------|
| `app/Policies/` directory | Missing | Does not exist |
| HospitalPolicy | Missing | |
| UserPolicy | Missing | |
| PatientPolicy | Missing | |
| PrescriptionPolicy | Missing | |
| AppointmentPolicy | Missing | |
| Policy registration in `AuthServiceProvider` | Missing | |
| super_admin bypass (before method) | Missing | |
| hospital_admin scoped to own hospital | Missing | |
| doctor scoped to own records | Missing | |
| receptionist limited (no prescriptions) | Missing | |

**Authorization: 0% complete**

---

### 6. Error Pages

| Task | Status | Notes |
|------|--------|-------|
| Subscription expired page | Missing | `EnsureHospitalActive` middleware redirects to `subscription.expired` route but no page exists |

---

## File Inventory

### Files that EXIST (Prompt 2)

| File | Purpose |
|------|---------|
| `app/Http/Middleware/RoleMiddleware.php` | Role gate |
| `app/Http/Middleware/EnsureHospitalActive.php` | Subscription gate |
| `app/Http/Middleware/HospitalScope.php` | Auto-scope queries |
| `app/Http/Controllers/Admin/DashboardController.php` | Admin dashboard |
| `app/Http/Controllers/Admin/HospitalController.php` | Hospital CRUD |
| `app/Http/Controllers/Auth/AuthenticatedSessionController.php` | Login + role redirect |
| `app/Http/Middleware/HandleInertiaRequests.php` | Shared props |
| `resources/js/Layouts/AdminLayout.tsx` | Admin sidebar layout |
| `resources/js/Layouts/HospitalLayout.tsx` | Hospital admin sidebar |
| `resources/js/Layouts/DoctorLayout.tsx` | Doctor sidebar |
| `resources/js/Layouts/ReceptionistLayout.tsx` | Receptionist sidebar |
| `resources/js/Pages/Admin/Dashboard.tsx` | Admin dashboard page |
| `routes/admin.php` | Admin routes |
| `routes/hospital.php` | Hospital routes |
| `routes/doctor.php` | Doctor routes |
| `routes/receptionist.php` | Receptionist routes |
| `bootstrap/app.php` | Middleware aliases |

### Files that are MISSING (Prompt 2)

| File | Purpose |
|------|---------|
| `app/Http/Controllers/Admin/UserController.php` | User management |
| `app/Http/Controllers/Admin/MedicineController.php` | Medicine CRUD |
| `app/Http/Controllers/Admin/TemplateController.php` | Global templates |
| `app/Http/Controllers/Admin/SubscriptionController.php` | Subscription management |
| `app/Http/Controllers/Hospital/DashboardController.php` | Hospital dashboard |
| `app/Http/Controllers/Hospital/DoctorController.php` | Doctor management |
| `app/Http/Controllers/Hospital/ReceptionistController.php` | Receptionist management |
| `app/Http/Controllers/Hospital/ChamberController.php` | Chamber CRUD |
| `app/Http/Controllers/Hospital/HolidayController.php` | Holiday CRUD |
| `app/Http/Controllers/Hospital/SettingsController.php` | Hospital settings |
| `app/Http/Controllers/Doctor/DashboardController.php` | Doctor dashboard |
| `app/Http/Controllers/Receptionist/DashboardController.php` | Receptionist dashboard |
| `app/Policies/HospitalPolicy.php` | Hospital authorization |
| `app/Policies/UserPolicy.php` | User authorization |
| `resources/js/Pages/Admin/Hospitals/Index.tsx` | Hospital list |
| `resources/js/Pages/Admin/Hospitals/Create.tsx` | Hospital create form |
| `resources/js/Pages/Admin/Hospitals/Edit.tsx` | Hospital edit form |
| `resources/js/Pages/Admin/Hospitals/Show.tsx` | Hospital detail |
| `resources/js/Pages/Admin/Users/Index.tsx` | User list |
| `resources/js/Pages/Admin/Users/Create.tsx` | User create form |
| `resources/js/Pages/Admin/Users/Edit.tsx` | User edit form |
| `resources/js/Pages/Hospital/Dashboard.tsx` | Hospital dashboard |
| `resources/js/Pages/Hospital/Doctors/*` | Doctor management pages |
| `resources/js/Pages/Hospital/Receptionists/*` | Receptionist pages |
| `resources/js/Pages/Hospital/Chambers/*` | Chamber pages |
| `resources/js/Pages/Hospital/Holidays/*` | Holiday pages |
| `resources/js/Pages/Hospital/Settings.tsx` | Settings page |
| `resources/js/Pages/Doctor/Dashboard.tsx` | Doctor dashboard |
| `resources/js/Pages/Receptionist/Dashboard.tsx` | Receptionist dashboard |
| `resources/js/Pages/Errors/SubscriptionExpired.tsx` | Expired subscription |

---

## Priority Order for Remaining Work

1. **Admin Hospital pages** (Index, Create, Edit, Show) — controller already done
2. **Admin UserController + pages** — routes defined, needs controller + pages
3. **Hospital Admin controllers + pages** — all 6 controllers + dashboards
4. **Doctor + Receptionist dashboards** — simple controllers + pages
5. **Laravel Policies** — HospitalPolicy, UserPolicy at minimum
6. **Admin Medicine/Template/Subscription routes + controllers + pages**
7. **Revenue chart** on admin dashboard (Recharts)
8. **SubscriptionExpired error page**
