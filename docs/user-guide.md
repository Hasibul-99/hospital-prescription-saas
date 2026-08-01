# Pulse Rx — User Guide

**Version:** 1.0  
**Product:** Pulse Rx (Hospital Prescription SaaS)  
**Audience:** Super Admins, Hospital Admins, Doctors, Receptionists

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Super Admin](#super-admin)
3. [Hospital Admin](#hospital-admin)
4. [Doctor](#doctor)
5. [Receptionist](#receptionist)
6. [Common Features](#common-features)

---

## Getting Started

### Logging In

1. Navigate to the application URL in your browser.
2. Click **Sign in** on the landing page, or go directly to `/login`.
3. Enter your **email address** and **password**.
4. Click **Sign in**.

After login you are redirected to the dashboard for your role automatically.

### Forgot Password

1. On the login page click **Forgot password?**
2. Enter your registered email address and click **Send reset link**.
3. Open the reset email and click the link.
4. Enter a new password (minimum 8 characters) and confirm it.
5. Click **Reset password** — you are logged in immediately.

### Changing Your Password

Go to **Settings → Profile** from the sidebar. Enter your current password then your new password and save.

---

## Super Admin

The Super Admin has no `hospital_id` and manages the platform globally.

**Default credentials (development):**
- Email: `admin@example.com`
- Password: `password`

### Dashboard

Shows platform-wide statistics: total hospitals, doctors, prescriptions, and active subscriptions. Displays a table of recently registered hospitals.

### Managing Hospitals

**Path:** Sidebar → **Hospitals**

#### Add a Hospital

1. Click **Add Hospital** (top-right).
2. Fill in the required fields:
   - **Hospital Name** (required)
   - **Subscription Plan** — Free / Basic / Premium / Enterprise
   - **Max Doctors** — limit for this tenant
   - **Max Patients / Month** — usage cap
3. Optionally fill phone, email, website, address, slug.
4. Click **Create Hospital**.

The hospital is created with status **Trial** and a 30-day trial period.

#### Edit a Hospital

From the Hospitals table click **Edit** on any row. Update any field including subscription status (Active / Trial / Expired / Suspended) and click **Save Changes**.

#### Toggle Active/Inactive

Click the toggle switch in the **Active** column to enable or disable a hospital instantly. Inactive hospitals cannot be logged into by their staff.

#### Delete a Hospital

Click **Delete** on a row. Confirm in the dialog. This action soft-deletes the hospital and all associated records.

### Managing Users

**Path:** Sidebar → **Users**

Displays all users across all hospitals. Filter by name/email, role, or hospital.

#### Add a User

1. Click **Add User**.
2. Fill in name, email, password, role, and optionally assign a hospital.
3. Check **Account active** to allow login immediately.
4. Click **Create User**.

#### Roles

| Role | Description |
|------|-------------|
| `super_admin` | Platform-level admin. No hospital assigned. |
| `hospital_admin` | Manages one hospital's settings and staff. |
| `doctor` | Writes prescriptions, sees patients. |
| `receptionist` | Manages appointments and patient queue. |

#### Edit / Delete a User

Click **Edit** or **Delete** from the Actions column. When editing, leave the password fields blank to keep the existing password.

### Global Medicine Library

**Path:** Sidebar → **Medicines**

The global medicine database is shared across all hospitals. Doctors search this library when writing prescriptions.

- **Add medicine** — name, generic name, category, strength, form, manufacturer.
- **Edit medicine** — update any field.
- **Activate / Deactivate** — inactive medicines do not appear in doctor searches.
- **Bulk import** — upload a CSV file. See the CSV template linked on the page.

### Medicine Requests

Doctors can request new medicines to be added to the global library. Review requests at **Sidebar → Medicine Requests**. Click **Approve** to add to the library or **Reject** to dismiss.

### Complaint Masters

Pre-defined complaint categories used in the prescription builder.

**Path:** Sidebar → **Complaints**

- Add / edit / delete complaint categories.
- Each complaint can have **duration presets** (e.g. "3 days", "1 week") which doctors can choose when recording a complaint.

### Reports

**Path:** Sidebar → **Reports**

View platform-wide prescription and usage reports. Export to **CSV** or **PDF** using the buttons at the top.

### Audit Logs

**Path:** Sidebar → **Audit Logs**

All create/update/delete actions across the platform are logged with user, timestamp, and changed data. Filter by action type or hospital. Useful for compliance and debugging.

### Settings

**Path:** Sidebar → **Settings**

- **Platform name** — displayed in emails and the UI.
- **Maintenance mode** — when enabled, all non-super-admin users see a maintenance page.

---

## Hospital Admin

A Hospital Admin belongs to one hospital and manages that hospital's internal operations.

### Dashboard

Shows your hospital's stats: total doctors, patients, prescriptions this month, and revenue summary.

### Managing Doctors

**Path:** Sidebar → **Doctors**

Invite or create doctor accounts within your hospital. Set their specialty, BMDC registration number, and consultation fee.

### Managing Staff (Receptionists)

**Path:** Sidebar → **Staff**

Create receptionist accounts for your hospital.

### Chambers

**Path:** Sidebar → **Chambers**

Doctors see patients in named chambers (rooms/clinics). Configure chambers here:
- Chamber name
- Location / floor
- Weekly schedule (days + hours)

Chambers are assigned to doctors and control when patients can book appointments.

### Holidays

**Path:** Sidebar → **Holidays**

Mark hospital-wide closure dates. Appointments cannot be booked on holiday dates. Mark a holiday as **recurring yearly** (e.g. national holidays) to avoid re-entering annually.

### Templates

**Path:** Sidebar → **Templates**

Hospital-level prescription templates shared across all doctors in the hospital. Doctors can also create private templates.

### Settings & Reports

Configure hospital profile, branding, and notification preferences. View hospital-scoped usage reports.

---

## Doctor

The Doctor panel is the core of Pulse Rx. Everything centers on writing and managing prescriptions.

### Dashboard

**Path:** `/doctor/dashboard`

At a glance:
- **Active prescriptions** — non-draft prescriptions you've written.
- **Patients today** — appointment count for today.
- **Pending drafts** — prescriptions saved as draft.
- **Total patients** — all patients at your hospital.

The dashboard also shows:
- A 14-day prescribing volume chart.
- Today's appointment schedule.
- Your 8 most recent prescriptions.

### Writing a Prescription

**Path:** Sidebar → **Prescriptions** (or the **New Rx** button in the top bar)

1. **Select patient** — search by name or phone number. If the patient doesn't exist, click **New Patient** to create one inline.
2. **Chief complaint** — select from the complaint library or type a custom complaint.
3. **Diagnosis** — enter a free-text or ICD-10 diagnosis.
4. **Medicines** — search the global medicine library. For each medicine:
   - Select the medicine.
   - Set the dose schedule (morning / noon / evening / night).
   - Set duration and instructions.
   - Medicines you use frequently appear in **Quick Picks** at the top.
5. **Advice** — add lifestyle or dietary advice.
6. **Follow-up date** — optional. If set, a reminder is created automatically.
7. **Save options:**
   - **Save as Draft** — visible only to you, not printed.
   - **Sign & Save** — prescription is finalised. Status becomes `signed`.
   - **Print** — opens the print-ready A4 slip in a new tab.

### Patient Queue

**Path:** Sidebar → **Queue**

Shows today's serial queue. Patients appear here when a receptionist books an appointment for today. Click a patient to open their prescription form directly.

### Patients

**Path:** Sidebar → **Patients**

Browse all patients at your hospital. Click a patient to view their history:
- Previous prescriptions
- Allergies and chronic conditions
- Visit timeline

### Templates

**Path:** Sidebar → **Templates**

Create reusable prescription templates for common conditions (e.g. "Viral URTI", "Hypertension follow-up"). When writing a prescription, load a template to pre-fill medicines and advice with one click.

You can create up to **50 templates**. Templates are private to you (they do not move with you if you switch hospitals).

### Follow-ups

**Path:** Sidebar → **Follow-ups**

Lists all prescriptions with a follow-up date. Reminders are sent to patients automatically. You can mark a follow-up as completed or reschedule it.

### Statements

**Path:** Sidebar → **Statements**

Daily earnings based on consultation fees. Filter by date range and export to PDF.

### Reports

**Path:** Sidebar → **Reports**

Your personal prescription volume, top diagnoses, and medicine usage patterns. Export as CSV or PDF.

### Medicine Settings

**Path:** Sidebar → **Medicine Settings**

Set your **default doses** for frequently used medicines. When you add a medicine to a prescription, your saved default is pre-filled automatically, saving time for routine cases.

### Settings

**Path:** Sidebar → **Settings**

- **Profile** — update name, phone, specialty, BMDC number, signature image.
- **Preferences** — preferred language (Bangla / English), default print layout.
- **Password** — change your login password.

---

## Receptionist

The Receptionist manages the patient-facing flow: booking appointments and managing the serial queue.

### Dashboard

Today's appointment count, pending queue size, and recent patient registrations.

### Appointments

**Path:** Sidebar → **Appointments**

View all appointments. Filter by date range, doctor, status, or type.

#### Book an Appointment

1. Click **New Appointment**.
2. Search for an existing patient or create a new one.
3. Select the doctor and chamber.
4. Choose the date (holidays and unavailable days are blocked automatically).
5. The serial number is assigned automatically based on the queue.
6. Click **Book Appointment**.

#### Appointment Statuses

| Status | Meaning |
|--------|---------|
| `scheduled` | Booked, not yet seen |
| `in_progress` | Doctor is currently seeing the patient |
| `completed` | Visit finished |
| `cancelled` | Cancelled by patient or staff |
| `no_show` | Patient did not arrive |

#### Cancel / Reschedule

Click the appointment row, then use the **Cancel** or **Reschedule** action. Cancellations are logged.

### Patient Queue

**Path:** Sidebar → **Queue**

Displays today's queue in serial order. Use the queue to:
- **Call next** — advance the queue.
- **Mark no-show** — skip a patient who did not arrive.
- **Walk the patient in** — change status to `in_progress`.

### Patient Management

**Path:** Sidebar → **Patients**

Register new patients and update existing records. Fields include name, phone, date of birth, gender, blood group, address, allergies, and emergency contact.

**Note:** A patient's phone number must be unique within your hospital.

---

## Common Features

### Language Switching

Click the language toggle in the top bar to switch between **English** and **বাংলা**. The preference is saved to your account.

### Notifications

The bell icon in the top bar shows unread notifications:
- Follow-up reminders
- New appointment bookings
- System announcements from the Super Admin

### Printing Prescriptions

Click **Print** from the prescription view. A printer-friendly A4 layout opens in a new tab with:
- Hospital header and doctor info
- Patient details and visit date
- Complaint, diagnosis, medicines with dose schedules
- Advice and follow-up date
- Doctor's e-signature block

Use your browser's print dialog (`Ctrl+P` / `Cmd+P`). Set paper size to **A4** and margins to **None** or **Minimum** for best results.

### Exporting Reports

All report pages have **Export CSV** and **Export PDF** buttons. CSV exports open in Excel or Google Sheets. PDF exports are print-ready.

### Session Timeout

Sessions expire after **120 minutes** of inactivity. You will be redirected to the login page. Any unsaved prescription drafts are preserved on the server.

---

*For technical setup and developer documentation, see the `docs/` folder in the project repository.*
