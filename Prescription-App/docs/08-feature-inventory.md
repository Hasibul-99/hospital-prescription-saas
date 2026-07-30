# 08 — Feature Inventory (Prescriply 45)

Mapping of the 45 marketed Prescriply features against the current codebase — what's already shipped, what's easy to add without any external service, what needs a paid/third-party integration, and what's a big build regardless.

Snapshot date: 2026-07-29. Re-verify by scanning `app/Models`, `app/Http/Controllers`, `app/Services`, `resources/js/Pages` if this file feels stale.

## Legend
- ✅ **Built** — working code exists
- 🟨 **Partial** — foundation in place, needs polish/extension
- 🟢 **Easy add** — 1–3 days, no external service
- 🟠 **Needs service** — external API/vendor required (SMS, payments, AI, video, etc.)
- 🔴 **Big build** — significant scope even without external deps

---

## ✅ Already Built (working now)

| # | Feature | Where it lives |
|---|---|---|
| 1 | Structured Rx builder (complaints, exam, sections, medicines, advice — reorderable) | `MedicineSection`, `ComplaintsSection`, `ExaminationSection`, `TextListSection`, `@dnd-kit/sortable` |
| 2 | DGDA drug catalog bulk-import pipeline | `MedicineBulkImportService` (chunked, streaming), `medicines:import` CLI, `database/data/dgda-sample.csv`. Load real DGDA CSV to populate. |
| 3 | Bilingual dosing engine — `1+0+1, after meal, N days` | `PrescriptionMedicine.dose_display`, `PrescriptionPrintLayout`, `timingLabel` util |
| 5 | Rx Protocols (disease templates) + refills | `DoctorTemplate`, `GlobalTemplateSeeder`, template apply UI |
| 14 | BMDC A4 print/PDF | `PrescriptionPdfService`, DomPDF, print layout |
| 15 | WYSIWYG parity | `PrescriptionPrintLayout` shared between preview + PDF |
| 19 | Patient registry + full history | `Patient` model, `patient_uid`, search |
| 20 | Demographics + allergies | `Patient`, `PatientAllergy`, `PatientAllergyController` |
| 4 | ICD-10 typeahead | `icd10_codes` table + `Icd10SeederStarter` (42 common codes) + `GET /doctor/icd10/search` + `Icd10Picker` combobox slotted under the Diagnosis section |
| 6 | Specialty quick-fills (paediatric dose + LMP→EDD) | `SpecialtyTools.tsx` two collapsible calculators; tooth chart still open |
| 7 | Extra clinical sections | `prescription_sections.section_type` enum extended with `negative_history`, `gynae_history`, `obstetric_history`, `breast_local`, `previous_reports`, `referred_by`, `notes`; wired into `Doctor/Prescriptions/Create.tsx` via `TextListSection` and into both print layouts |
| 10 | Drug-safety alerts (duplicate-therapy) | `MedicineList` computes duplicate-generic map; `MedicineRow` shows amber advisory when same `generic_name` appears twice. Real interactions still pending an external dataset. |
| 16 | QR authenticity + Rx/Patient IDs | `prescriptions.share_token` + `simplesoftwareio/simple-qrcode` SVG rendered into print (Blade + React) footer, plus a `/rx/verify/{token}` public page |
| 17 | Share (PDF, image, WhatsApp deep-link, web link) | Preview toolbar: WhatsApp `wa.me/?text=…`, Copy-link, existing PNG + PDF exporters |
| 18 | Allergy line + follow-up on print | `patient.allergies` eager-loaded; red allergy line above Rx block; follow-up already rendered |
| 22 | Recall & follow-up (manual workflow) | `prescriptions.recall_status` + `FollowUpController::bulkMark` + bulk-select UI. SMS reminder button disabled pending gateway. |
| 25 | Multi-chamber sync | `Chamber` model per doctor |
| 26 | Smart fee rules (visit types) | `Appointment` visit types, fee logic in `SerialQueueService` |
| 27 | Statements & outstanding | `DailyStatement`, `Statements/Index`, `Reports/*` |
| 28 | Assistant seats (role=receptionist) | `RoleMiddleware`, receptionist routes/pages |
| 29 | Serial & queue | `SerialQueueService`, `Queue/Index` pages |
| 30 | Appointments calendar | `Appointment`, `Appointments/Index` (doctor + receptionist) |
| 32 | Online booking (public link) | `App\Http\Controllers\Public\BookingController`, `/book` routes, `PublicLayout`, four Inertia pages under `resources/js/Pages/Public/Booking/`. Email OTP confirmation; SMS deferred. |
| 34 | Referrals (basic) — SMS **not** wired | Referral fields present |
| 36 | Lab referrals note on Rx | `lab_referral` section type; text entered in Rx builder; printed as its own block on the right column |
| 37 | BMDC verification badge | `doctor_profiles.bmdc_verified` + `bmdc_verified_at` + `bmdc_verified_by`; admin toggle in `/admin/users`; ✓ Verified pill on print header, print footer, and public verify page |
| 38 | 2FA (email OTP half) | OTP for signup + password reset — see [03-auth-and-roles.md](03-auth-and-roles.md) |
| 39 | Roles & least privilege server-side | `RoleMiddleware`, policies |
| 40 | Per-doctor / per-tenant data isolation | `BelongsToHospital` global scope |
| 42 | Installable PWA | `vite-plugin-pwa` in `vite.config.js`; manifest + service worker in `public/`; app.blade.php head links |
| 41 | Privacy-minimised public view | `Public\PrescriptionVerifyController` renders only medicines + allergies + follow-up; complaints/exams/diagnosis withheld; patient name masked to first + last-initial |
| 43 | Cloud always in sync | Inertia + server-side rendering |
| 44 | English-only clarity / 0–9 numerals on print | `resources/js/utils/numerals.ts` + `_rxToEn()` Blade helper wired through print path |
| 45 | 30-free-Rx enforcement | `Hospital::FREE_TIER_RX_LIMIT`, `hospitals.prescription_quota_used`, `EnsurePrescriptionQuota` middleware, `PrescriptionService::save()` increments |

**Score: 38/45 built.** (was 34/45; features 4, 6 partial, 10 partial shipped on 2026-07-30 as Clinical-intelligence batch. #6 tooth chart still open; #10 real interactions need external dataset.)

Just-shipped detail (2026-07-29):

| # | Feature | What landed |
|---|---|---|
| 2 | DGDA bulk import | `MedicineBulkImportService` now streams CSV via generator + processes in `CHUNK_SIZE=500` batched transactions. `php artisan medicines:import <path>` handles the ~25k-row DGDA feed. Data file itself is a data-ops task. |
| 22 | Recall & follow-up bulk-action | `prescriptions.contact_attempts` / `last_contact_at` / `recall_status` columns + `POST /doctor/follow-ups/bulk-mark`. UI has row checkboxes + bulk-mark bar. SMS button present but disabled until SMS gateway lands. |
| 32 | Public online booking | `/book`, `/book/{doctor}`, `/book/{doctor}/slots`, `POST /book`, `/book/verify`, `/book/confirmed`. Uses `SerialQueueService` for slots + fee, `OtpService` (`PURPOSE_BOOKING`) for email OTP. Guest patients dedup on `(hospital_id, phone)`. |
| 42 | Installable PWA | `vite-plugin-pwa` in `vite.config.js`; manifest + service worker emitted to `public/`; `app.blade.php` head links updated; placeholder icons in `public/icons/`. |
| 44 | English-only numerals | `resources/js/utils/numerals.ts` + `_rxToEn()` Blade helper; every dose / duration / date / age / custom-instruction rendered on the print path passes through the converter. Print-side "এবং," replaced with "and,". |
| 45 | 30-free-Rx enforcement | `hospitals.prescription_quota_used` counter + `Hospital::FREE_TIER_RX_LIMIT = 30` + `EnsurePrescriptionQuota` middleware on `POST /doctor/prescriptions`. Counter increments in `PrescriptionService::save()` on new Rx only. |

## 🟨 Partial (none)

All previous partials shipped. Next set to tackle: things now split cleanly between "Easy add" (no service) and "Needs service" below.

---

## 🟢 Easy add — no external service (1–3 days each)

| # | Feature | Approach |
|---|---|---|
| 6 | Tooth chart (dental) | Interactive FDI-notation SVG (32 teeth) with per-tooth findings — deferred; scope isn't small |
| 11 | SOAP notes + patient handout | New Blade templates + DomPDF export routes |
| 13 | Letterhead Studio (basic per-chamber header/footer) | Extend `DoctorProfile` fields; simple form editor. Full WYSIWYG = 🔴 |
| 21 | Vitals & trends | New `patient_vitals` table + Recharts trend view |
| 24 | FULL/SPLIT/RENT settlement | Extend `Chamber` (add `share_model`, `share_percent`, `rent_amount`); extend `DailyStatement` calc |
| 31 | Public profile & directory | Public routes + `/doctors/{slug}` page; admin approval flag |
| 35 | Medical documents (fitness/sick-leave/referral certs) | Blade templates + PDF export, letterhead-aware |

---

## 🟠 Needs external service

| # | Feature | Service required | Est. work |
|---|---|---|---|
| 8 | Ask AI (reference box) | **Anthropic / OpenAI API** (`claude-haiku-4-5` for cost, `claude-sonnet-4-6` for quality) | 2–3 days |
| 9 | AI scribe (dictate/paste → structured Rx) | **Anthropic** (structured output) + browser `SpeechRecognition` OR **Whisper API** for audio | 4–6 days |
| 10 | Real drug interactions (beyond dup-generic) | **RxNorm / DrugBank API** or licensed dataset | depends on dataset |
| 12 | Prepaid credits (top-up, per-request cost, ledger) | **SSLCommerz / bKash / Nagad / Stripe** payment gateway | 4–6 days + KYC time |
| 22 / 34 | Bulk SMS recall / reminders | **SMS gateway** (SSL Wireless, Bulk SMS BD, Twilio for intl) | 2 days once account exists |
| 23 | Patient portal via OTP | Reuses `OtpService`. Free if email; +2 days if SMS OTP for phone-first users | 1–3 days |
| 33 | Telemedicine (ad-hoc video room) | **Jitsi self-host (free)** OR **Daily.co / Twilio Video / Zoom SDK** | 2 days Jitsi, 3–5 paid |
| 38 | 2FA (TOTP authenticator app) | **`pragmarx/google2fa`** package (free, no external service). Mobile-SMS OTP needs SMS gateway | 2 days TOTP, +2 SMS |
| 42 | Installable "app on phone" — genuine push notifications | **Firebase Cloud Messaging** OR **OneSignal** | 2 days |

---

## 🔴 Big builds (no external dep, but real scope)

| # | Feature | Scope |
|---|---|---|
| 5 (advanced) | Selective template apply (tick items) | Modal + partial merge into current Rx — new UX |
| 12 | Full billing/credit ledger (before you hook payments) | Ledger schema, invoices, refunds, admin console |
| 13 | WYSIWYG Letterhead Studio (real editor) | TipTap/Slate integration, image uploads, per-chamber save |
| 22 | Recall system with rules engine | Overdue detection + scheduled job + audit trail |
| 24 | Settlement engine covering edge cases | Refunds, mid-month rate changes, hospital-side reports |
| 32 | Booking + no-show tracking + analytics | Public flow + admin analytics + policies |

---

## Recommended external service shopping list (Bangladesh context)

| Service | Why | Suggested vendor |
|---|---|---|
| **SMS gateway** | Recall, reminders, SMS OTP, 2FA-SMS | SSL Wireless, Bulk SMS BD, MetroTel |
| **Payment gateway** | Prepaid credits, subscription upgrades | SSLCommerz (covers bKash + Nagad + card + Rocket) |
| **AI provider** | Ask AI, AI scribe | Anthropic (`claude-haiku-4-5`, `claude-sonnet-4-6`) |
| **Video** | Telemedicine | Jitsi self-host to keep costs at zero; Daily.co for turnkey |
| **Push notifications** | Recall pings on phone | Firebase FCM |
| **Object storage** | Letterhead images, patient uploads, scanned reports | S3 / DigitalOcean Spaces |
| **Email** *(currently Gmail SMTP)* | Transactional volume >500/day | Resend / Postmark / SES |
| **DGDA drug list** | 25,900+ medicine feed | Public CSV / manual scrape (one-time import) |

---

## Priority suggestion

1. **Now** — finish 🟨 partials (real DGDA import, PWA manifest, 30-Rx gate, public booking). Zero external cost, big user value.
2. **Wire SMS + payment gateway once** — unlocks features 12, 22, 23, 34 in one push.
3. **AI features (8, 9)** — highest wow-factor; start with Haiku for cost, upgrade to Sonnet where quality matters.
4. **Telemedicine (33)** — Jitsi first, evaluate paid later.

---

## How to keep this doc honest

When a feature ships, move the row up into ✅ **Built** and remove from its old bucket. When a partial's gap is filled, promote to Built. If a new external dep gets added, update the shopping list. This doc is worth ~15 min of grooming per sprint.
