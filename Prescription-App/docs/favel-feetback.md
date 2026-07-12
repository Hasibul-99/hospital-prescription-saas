priority order:

[CRITICAL] Public registration = cross-tenant data access — new user gets role='doctor', hospital_id=null; BelongsToHospital skips scope when null → queries every hospital's patients/prescriptions. Fix: remove public register routes + fail-closed scope + reject null-hospital non-super-admin. RegisteredUserController.php:66, BelongsToHospital.php:14
[CRITICAL] Hourly OTP send cap is dead — issue() counts recent rows then delete()s them before insert; count never exceeds 1. Move to un-deleted counter. OtpService.php:53-69
[HIGH] UID / serial race conditions — Patient UID, Prescription UID, Appointment serial all read-max-then-+1, no lock → duplicates under concurrency. Add transaction + lockForUpdate. Patient.php:48, Appointment.php:50
[HIGH] No tenant-isolation test — prompt 2 exit criteria never met; would catch #1.
[MED] 4-digit OTP weak for password reset — 10000 space, IP-only throttle on verify. Go 6-digit, throttle per email. auth.php:43
[MED] Docs stale — roadmap + CLAUDE.md say prompts 3,6–10 "not started"; all done.
[MED] Maintenance bypass secret hardcoded — medixpro-bypass → env.
[MED] Platform name/logo in cache — vanish on cache:clear with redis; move to platform_settings table.
[MED] Audit log too narrow — only prescription create/update; no login, patient edits, deletes.
[MED] Rate limiting thin — default throttle:60,1 on api only; medicine/patient search hammer-able.
[MED] Uploads not re-encoded — intervention/image installed but unused; stores raw file.
[LOW] Repo hygiene — bash.exe.stackdump untracked (delete + gitignore), composer.lock diff.
[LOW] LanguageSwitcher only in DoctorLayout — add to Admin/Hospital/Receptionist.
Features to build:

SMS integration — BD = phone not email; OTP + reminders currently email-only. SSL Wireless / BulkSMSBD / Twilio.
Self-serve subscription payments — bKash / Nagad / SSLCommerz renewal. Revenue feature.
Online patient booking portal — public per-hospital: pick doctor + slot → serial.
Drug interaction + allergy warnings — warn doctor at prescribe time vs recorded allergy/active meds.
Lab / investigation results — record results back against patient timeline.
Prescription share to patient — WhatsApp/SMS signed expiring PDF link.
Notification preferences — reminder on/off toggles (deferred prompt 10).
Hospital-level medicine restrictions — deferred prompt 9.
Pharmacy / inventory module — dispensing + stock per hospital.