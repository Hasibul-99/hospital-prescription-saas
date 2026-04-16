# 03 — Auth & roles

## Roles

| Role | `users.role` value | Has `hospital_id`? | Can |
|---|---|---|---|
| Super Admin | `super_admin` | No (NULL) | Everything; manage hospitals, global medicines, global templates, subscriptions |
| Hospital Admin | `hospital_admin` | Yes | Manage doctors, receptionists, chambers, holidays, hospital settings; view reports for their hospital |
| Doctor | `doctor` | Yes | See patients in their hospital, write/edit prescriptions, manage own templates + medicine defaults |
| Receptionist | `receptionist` | Yes | Register patients, manage appointment queue, collect fees. **Cannot view or create prescriptions.** |

## Login & redirect

Breeze's Inertia React stack is already scaffolded at [../routes/auth.php](../routes/auth.php). After login, redirect by role:

| Role | Redirect to |
|---|---|
| `super_admin` | `/admin/dashboard` |
| `hospital_admin` | `/hospital/dashboard` |
| `doctor` | `/doctor/dashboard` |
| `receptionist` | `/receptionist/dashboard` |

Override Breeze's `LoginRequest::authenticate()` (or the redirect step in `AuthenticatedSessionController::store`) to do this — **NOT YET IMPLEMENTED**.

## Middleware

Four pieces, all in [../app/Http/Middleware/](../app/Http/Middleware/):

### `RoleMiddleware` (alias `role`)
Already registered in [../bootstrap/app.php](../bootstrap/app.php):

```php
$middleware->alias([
    'role' => \App\Http\Middleware\RoleMiddleware::class,
    'hospital.active' => \App\Http\Middleware\EnsureHospitalActive::class,
]);
```

`HospitalScope` is appended to the `web` group, so it runs on every web request.

Usage:

```php
Route::middleware(['auth', 'role:super_admin'])->prefix('admin')->group(...);
Route::middleware(['auth', 'role:hospital_admin,doctor'])->prefix('hospital')->group(...);
```

### `EnsureHospitalActive` (alias `hospital.active`)
Rejects if `user->hospital->subscription_status` is `expired` or `suspended`. Super admins pass through.

### `HospitalScope`
Injects `hospital_id` into request context for controllers that need it outside of Eloquent (e.g., raw queries, cache keys). Mostly redundant with the `BelongsToHospital` trait — kept as a safety net.

### `HandleInertiaRequests`
Breeze default — shares `auth.user`, flash messages, and CSRF token with every Inertia page. Extend it to also share:

- `auth.user.hospital` (eager-loaded hospital record, minus secrets)
- `auth.user.permissions` (computed from role)
- `locale` (bn / en)

## Authorization — Policies

Every business model should have a Laravel Policy. Matrix:

| Model | super_admin | hospital_admin | doctor | receptionist |
|---|---|---|---|---|
| Hospital | CRUD | view own, update own | view own | view own |
| User (doctor) | CRUD | CRUD in own hospital | view own | view (own hospital) |
| User (receptionist) | CRUD | CRUD in own hospital | — | view own |
| Patient | CRUD | CRUD (own hospital) | CRUD (own hospital) | CRUD (own hospital) |
| Appointment | CRUD | CRUD (own hospital) | CRUD (own appts) | CRUD (own hospital) |
| Prescription | CRUD | view (own hospital) | CRUD (own Rx only) | **view only metadata**, not contents |
| Medicine (global) | CRUD | view | view | view |
| DoctorTemplate | CRUD | view (own hospital) | CRUD (own) + view global | — |
| DoctorMedicineDefault | CRUD | — | CRUD (own) | — |

Generate policies with `php artisan make:policy <Model>Policy --model=<Model>` and register them in `AuthServiceProvider`.

## Implementation status

| Piece | Status |
|---|---|
| Role column on users | Done (migration + model helpers `isSuperAdmin()` etc.) |
| `RoleMiddleware` | Done (verify alias is registered in `bootstrap/app.php`) |
| `EnsureHospitalActive` | Done (verify alias is registered) |
| `HospitalScope` middleware | Done |
| `BelongsToHospital` trait | Done |
| Role-based login redirect | **TODO** |
| Role-grouped route files | **TODO** |
| Policies | **TODO** |
| Inertia shared props (hospital, permissions, locale) | **TODO** |
