# Prompt 4 — Appointment & Serial Queue System — Gap Analysis Report

**Date:** 2026-04-20
**Prompt:** Appointment & Serial Queue System
**Status:** ~95% Complete (minor polish items remain)

---

## Summary

Full appointment + queue workflow is built across Doctor, Receptionist, and Hospital Admin roles. Serial numbers auto-increment per (doctor, chamber, date), holiday bookings are blocked, follow-up appointments auto-book from prescriptions, and queue screens poll every 10 s. Chambers and hospital holidays have full CRUD for the hospital admin.

Only minor gaps remain:

1. Broadcast events not implemented — polling only (functionally covers real-time refresh).
2. Holiday UI is a list table, not a full calendar view.
3. Chamber weekly-schedule display is captured in the form but has no dedicated viewer page.

---

## Files Added / Modified

### Controllers

| File | Role | Purpose |
|------|------|---------|
| `app/Http/Controllers/Doctor/SerialQueueController.php` | Doctor | Queue screen, next-patient advance, break toggle, status update |
| `app/Http/Controllers/Doctor/AppointmentController.php` | Doctor | Index (filterable list), store, update, destroy |
| `app/Http/Controllers/Doctor/FollowUpController.php` | Doctor | Follow-up list with overdue highlighting |
| `app/Http/Controllers/Doctor/StatementController.php` | Doctor | Daily statement summary + breakdown |
| `app/Http/Controllers/Receptionist/SerialQueueController.php` | Receptionist | Queue per selected doctor |
| `app/Http/Controllers/Receptionist/AppointmentController.php` | Receptionist | Index, store, update, destroy (all-doctor scope) |
| `app/Http/Controllers/Hospital/ChamberController.php` | Hospital Admin | Chamber resource CRUD |
| `app/Http/Controllers/Hospital/HolidayController.php` | Hospital Admin | Holiday resource CRUD (except show) |

### Services

| File | Purpose |
|------|---------|
| `app/Services/SerialQueueService.php` | Queue fetch, stats, `advance()`, break toggle (cache-backed), holiday check (SQLite-compatible `strftime` for recurring), consultation-fee lookup, chambers-for-doctor |

### Requests

| File | Purpose |
|------|---------|
| `app/Http/Requests/StoreAppointmentRequest.php` | Validates patient_id, doctor_id, chamber_id, appointment_date (future), type, fee, payment fields |
| `app/Http/Requests/UpdateAppointmentRequest.php` | Partial update ruleset |

### Policies

| File | Purpose |
|------|---------|
| `app/Policies/AppointmentPolicy.php` | Hospital-scoped. Receptionists create/update any; doctors update only their own appointments |
| `app/Policies/ChamberPolicy.php` | Hospital admin only for write, rest read |
| `app/Policies/HospitalHolidayPolicy.php` | Hospital admin only for write, rest read |

### Models

| File | Change |
|------|--------|
| `app/Models/Prescription.php` | Added `static::created()` hook — auto-creates `Appointment` of type `follow_up` when `follow_up_date` is set, skipping duplicates |

### Inertia Pages

| File | Purpose |
|------|---------|
| `resources/js/Pages/Doctor/Queue/Index.tsx` | Main queue dashboard — stats, table, action bar, polling |
| `resources/js/Pages/Doctor/Appointments/Index.tsx` | Filterable list + cancel action |
| `resources/js/Pages/Doctor/FollowUps/Index.tsx` | Date-range filter, overdue highlighting, book-appointment CTA |
| `resources/js/Pages/Doctor/Statements/Index.tsx` | Date-range picker, summary cards, breakdown table, print button |
| `resources/js/Pages/Receptionist/Queue/Index.tsx` | Doctor selector + queue (multi-doctor context) |
| `resources/js/Pages/Receptionist/Appointments/Index.tsx` | All-doctor appointment list with filters |
| `resources/js/Pages/Hospital/Chambers/{Index,Create,Edit}.tsx` | Chamber list, create, edit |
| `resources/js/Pages/Hospital/Holidays/{Index,Create,Edit}.tsx` | Holiday list (year filter), create, edit |

### Shared Components

| File | Purpose |
|------|---------|
| `resources/js/Components/AppointmentModal.tsx` | Patient search + fee + payment + notes. Doctor & receptionist contexts |
| `resources/js/Components/ChamberForm.tsx` | Doctor picker, room/floor/building, weekly 7-day schedule grid, active toggle |
| `resources/js/Components/HolidayForm.tsx` | Date, title, recurring-yearly toggle |

### Routes

| File | Change |
|------|--------|
| `routes/doctor.php` | Added `/queue`, `/queue/next`, `/queue/break`, `/queue/appointments/{id}/status`, `/appointments`, `/follow-ups`, `/statements` |
| `routes/receptionist.php` | Added `/queue`, `/queue/appointments/{id}/status`, `/appointments` |
| `routes/hospital.php` | Added `chambers` + `holidays` resources |

### Types

| File | Change |
|------|--------|
| `resources/js/types/index.d.ts` | Added `Appointment`, `Chamber`, `HospitalHoliday`, `QueueStats` |

---

## Section-by-Section Breakdown

### 1. Serial Queue Dashboard

| Task | Status | Notes |
|------|--------|-------|
| Date selector (defaults to today) | Done | `<input type="date">` — doctor + receptionist screens |
| Chamber selector (multi-chamber doctors) | Done | Dropdown hidden when doctor has no chambers |
| Queue table — columns: Serial #, Patient, Type, Status, Fee, Actions | Done | |
| Status flow Waiting → In Progress → Completed, Absent, Cancelled | Done | `updateStatus` endpoint + inline buttons |
| Row actions: Create Rx, Print last Rx, Complete, Absent, Start | Done | Print link renders only if `a.prescription` exists |
| Explicit ✏️ Edit button per row | Partial | Status-change buttons inline; full edit deferred to Appointments page |
| Color coding: Waiting grey, In Progress blue pulse, Completed green, Absent red strike | Done | Tailwind classes via `statusBadge()` helper |
| "+ New Appointment" button | Done | Opens `AppointmentModal` |
| Refresh button | Done | `router.reload({ only: ... })` |
| Break toggle (pauses queue, shows banner) | Done | Cache-backed per (doctor, date, chamber) |
| "→ Next" button (completes current, promotes next) | Done | `SerialQueueService::advance` |
| Auto serial numbering per (doctor, chamber, day), resets daily | Done | `Appointment::nextSerial()` in `creating` hook |
| Quick Stats cards — Total, Completed, Waiting, Follow-ups, Absent, Total Earned | Done | `statsFor()` returns all six + unpaid |

### 2. Appointment Booking

| Task | Status | Notes |
|------|--------|-------|
| Modal — patient search field | Done | Reuses `PatientSearch` component |
| "Register New Patient" link | Done | Link to `/patients/create` inside modal |
| Date select (today or future) | Done | `after_or_equal:today` validation |
| Chamber select | Done | Dropdown fed from doctor's chambers |
| Type: New / Follow-up / Emergency | Done | Segmented radio |
| Fee amount auto-filled from `doctor_profile.consultation_fee`, editable | Done | `SerialQueueService::consultationFee()` uses `follow_up_fee` when type is follow-up |
| Fee-paid checkbox + payment method dropdown | Done | `fee_paid` + `payment_method` persisted |
| Notes field | Done | |
| Save adds to queue with next serial | Done | Model `creating` hook fills `serial_number` |
| Follow-up auto-booking when Rx has `follow_up_date` | Done | `Prescription::booted()` `created` hook creates waiting-status appointment, dedupes by (patient, doctor, date, type) |

### 3. Follow-up Management

| Task | Status | Notes |
|------|--------|-------|
| `/doctor/follow-ups` page | Done | |
| Date-range filter | Done | Defaults: today → +1 month |
| Columns: Patient, Original Rx Date, Follow-up Due Date, Status, Actions | Done | |
| Status: Due / Overdue / Upcoming | Done | Derived in controller `map()` (Overdue, Due, Upcoming) |
| Overdue highlighted red | Done | Tailwind red row styling |
| "Book Appointment" action | Done | Links to Appointments modal prefilled |
| "View Prescription" action | Partial | Link placeholder — target builder page not yet built (Prompt 5 / 7) |

### 4. Daily Statement

| Task | Status | Notes |
|------|--------|-------|
| `/doctor/statements` page | Done | |
| Date range picker | Done | Defaults: start-of-month → today |
| Summary: Total, New, Follow-ups, Earned, Paid, Unpaid | Done | Emergency count added as bonus |
| Breakdown table by appointment | Done | Appointment-level rows |
| Print button | Done | `window.print()` with a `@media print` CSS hook |

### 5. Multi-Chamber Support

| Task | Status | Notes |
|------|--------|-------|
| Chamber switcher on queue screen | Done | Dropdown on queue page |
| Independent serial numbering per chamber | Done | `nextSerial` scopes by `chamber_id` |
| Weekly schedule stored per chamber | Done | `ChamberForm` 7-day grid persists `schedule` JSON |
| Schedule display page | Missing | No dedicated read-only viewer; schedule visible only in the edit form |
| Active-chamber dropdown in nav | Partial | Dropdown is on queue page, not in nav bar — acceptable since queue is doctor's main workspace |

### 6. Holiday Management

| Task | Status | Notes |
|------|--------|-------|
| Holiday list page | Done | `/hospital/holidays` with year filter |
| Add / edit / delete holiday | Done | Full resource routes except show |
| Recurring-yearly flag | Done | Checkbox + `is_recurring_yearly` column honoured by `isHoliday()` via `strftime('%m-%d', …)` |
| Block booking on holidays | Done | Both `Doctor` + `Receptionist` `AppointmentController@store` abort with flash error |
| Queue screen holiday banner | Done | Red banner: "Holiday: {title} — bookings blocked for this date." |
| Calendar-style UI | Missing | Spec mentioned calendar view; implementation is a table — equivalent functionality, simpler UX |

### 7. Real-time Updates

| Task | Status | Notes |
|------|--------|-------|
| Polling every 10 s refreshes queue status | Done | `setInterval` + `router.reload({ only: [...] })` on both doctor + receptionist queue pages |
| Receptionist adding patient shows on doctor screen | Done | Via polling |
| Doctor completing patient shows on receptionist screen | Done | Via polling |
| Laravel Events / broadcasting | Missing | No broadcast/Echo wired. Polling covers the refresh requirement but true event-driven push is deferred |

---

## Known Gaps (explicitly deferred)

1. **Broadcast events.** Spec asked for "Laravel Events + polling". Only polling is built. When broadcasting infra is added (Reverb / Pusher), emit `AppointmentUpdated` on status changes and the queue page can drop the 10 s timer.
2. **Holiday calendar UI.** A list table is shipped. A month-grid view with click-to-toggle would be nicer but is pure UX polish.
3. **Chamber schedule viewer page.** Data is captured, not yet rendered anywhere read-only. Will matter more once the receptionist needs to see which chamber a doctor is at on a given weekday.
4. **Queue row ✏️ Edit button.** Status transitions are inline; editing fee / notes has to happen via the Appointments page. Acceptable for the queue workflow.
5. **Laravel Policies registration.** Relies on Laravel 11 auto-discovery (`App\Policies\{Model}Policy`). No manual registration in `AuthServiceProvider`.

---

## Key Design Decisions

1. **Break state stored in cache, not DB.** `SerialQueueService::setBreak` writes to cache keyed by `(doctor, date, chamber)` with end-of-day TTL. Avoids a new migration for an ephemeral flag.
2. **Holiday recurring match uses SQLite `strftime`.** When moving to MySQL, swap for `DATE_FORMAT(date, '%m-%d')` — single line change in `SerialQueueService::isHoliday`.
3. **Follow-up auto-booking is idempotent.** Duplicate (patient, doctor, date, type=follow_up) rows are short-circuited, so re-saving a prescription never creates a second appointment.
4. **Fee auto-fill happens server-side.** Modal sends `fee_amount: null` when user doesn't override — controller fills from `DoctorProfile`. Keeps client-side free of business rules.
5. **Cancelled appointments are soft-deleted AND status-flipped.** `destroy()` sets `status = cancelled` then calls `delete()`. Restoring later keeps the audit trail.
6. **Receptionist queue requires doctor selection.** First active doctor is auto-selected if none chosen; queue renders empty otherwise.

---

## Validation Checklist

- [x] `php -l` clean on all new PHP files
- [x] `npx tsc --noEmit` clean (after fixing three `preserveScroll` warnings on `router.reload` calls and an `any` cast on the appointment payload)
- [x] Holiday blocks booking on both Doctor + Receptionist store actions
- [x] Serial numbers reset daily per (doctor, chamber) — verified via `nextSerial` max+1 query
- [x] Polling updates only required props via `router.reload({ only: [...] })`
- [x] Policies enforce hospital isolation on all three new policy classes
- [ ] Manual browser smoke test on every new page (blocked — no running dev server in this session)
- [ ] Broadcast events (deferred)

---

## Next

Prompt 5 — Prescription Builder (most critical feature). Depends on:

- Patient selection (done in Prompt 3)
- Appointment context (done here — `appointment_id` passed as query param from queue row)
- Complaint masters + medicines (tables exist, need seeders verified)
