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

## Email OTP verification (signup) and password reset

The default Breeze email-link verification and password-reset-token flows are **replaced** by a 4-digit OTP flow.

### Flows

**Signup**
1. `POST /register` — creates user with `email_verified_at = null`, queues `OtpMail` (`registration`), redirects to `/verify-otp?email=…`.
2. `POST /verify-otp` — validates code, sets `email_verified_at`, logs user in, redirects to role-based dashboard.
3. `POST /resend-otp` — issues a new code subject to 60 s cooldown + 5/hour cap.

If a registration comes in for an existing **unverified** email, the user record is overwritten with the new name + password and a fresh OTP is issued (still cooldown-bound). If the email is already **verified**, registration is rejected with a generic "already registered" error.

**Password reset**
1. `POST /forgot-password` — if user exists, queues `OtpMail` (`password_reset`). Always returns generic success; **does not leak whether the email is registered**.
2. `POST /reset-password` — validates code, updates password, redirects to login.

### Security controls (all enforced server-side)
- Codes hashed with `Hash::make` / verified with `Hash::check`.
- 10-minute expiry.
- 5-attempt cap per code — invalidated on the 6th attempt.
- 60-second resend cooldown + 5/hour hard cap per (email, purpose).
- One active code per (email, purpose) — new issuance deletes prior rows.
- Route-level throttle: `register` and `forgot-password` 5/min, `verify-otp` and `reset-password` 10/min.

All knobs live in `App\Services\OtpService` constants (`OTP_LENGTH`, `EXPIRY_MINUTES`, `MAX_ATTEMPTS`, `RESEND_COOLDOWN_S`, `HOURLY_SEND_CAP`).

### .env requirements

```env
# Mail (Gmail SMTP example — fine for launch, ~500/day cap)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-account@gmail.com
MAIL_PASSWORD=your-app-password    # Gmail app password, not the account password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="no-reply@your-domain.com"
MAIL_FROM_NAME="${APP_NAME}"

# Queue (must NOT be sync in prod — OtpMail implements ShouldQueue)
QUEUE_CONNECTION=database
```

### Required background processes
- **Queue worker** — `OtpMail` is queued, so a worker must run. In dev: `php artisan queue:work`. In prod: Supervisor or systemd unit.
- **Cleanup schedule** — `auth:purge-unverified` runs hourly via `routes/console.php`, deleting unverified users older than 24 h and expired OTP rows. Requires the Laravel scheduler entry in cron (`* * * * * cd /path && php artisan schedule:run`).

### Manual run
- `php artisan auth:purge-unverified` — manual sweep.
- `php artisan auth:purge-unverified --hours=48` — customize cutoff.

### Future hardening
`// TODO: transactional provider at scale` — move from Gmail SMTP to Resend/Postmark/SES when sending volume nears Gmail's 500/day. OTP length is a one-line change in `OtpService::OTP_LENGTH` (currently 4 to match the existing UI; consider 6 in production).

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
| Email OTP verification (signup) | Done |
| Password reset via OTP | Done |
| Cleanup of stale unverified users | Done (scheduled hourly) |
