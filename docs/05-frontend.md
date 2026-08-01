# 05 — Frontend (Inertia + React + TypeScript)

## Entry points

| File | Role |
|---|---|
| [resources/views/app.blade.php](../resources/views/app.blade.php) | Blade shell; loads Vite assets and mounts the Inertia root |
| [resources/js/app.tsx](../resources/js/app.tsx) | Inertia client bootstrapper — `createInertiaApp({...})`, dynamic page import |
| [resources/js/bootstrap.ts](../resources/js/bootstrap.ts) | Axios defaults (CSRF, base URL) |
| [vite.config.js](../vite.config.js) | Vite + Laravel plugin + React plugin |
| [tsconfig.json](../tsconfig.json) | TypeScript strict config |

## Folder layout

```
resources/js/
├── app.tsx
├── bootstrap.ts
├── Pages/                # Inertia pages — one file per route
│   ├── Admin/            # super admin
│   │   ├── Dashboard.tsx
│   │   ├── Hospitals/
│   │   │   ├── Index.tsx
│   │   │   ├── Create.tsx
│   │   │   └── Show.tsx
│   │   └── ...
│   ├── Hospital/         # hospital admin
│   ├── Doctor/
│   │   ├── Dashboard.tsx
│   │   ├── Queue.tsx
│   │   ├── Prescriptions/
│   │   │   ├── Create.tsx   # prescription builder
│   │   │   ├── Preview.tsx
│   │   │   └── Index.tsx
│   │   └── ...
│   ├── Receptionist/
│   ├── Auth/             # Breeze pages
│   ├── Profile/          # Breeze pages
│   ├── Dashboard.tsx     # (Breeze default — will be replaced by role routing)
│   └── Welcome.tsx       # (Breeze default — can stay or be replaced)
├── Layouts/
│   ├── AdminLayout.tsx       # TODO
│   ├── HospitalLayout.tsx    # TODO
│   ├── DoctorLayout.tsx      # TODO
│   ├── ReceptionistLayout.tsx# TODO
│   ├── AuthenticatedLayout.tsx  # Breeze default — keep for Breeze pages
│   └── GuestLayout.tsx          # Breeze default — keep for auth pages
├── Components/
│   ├── forms/            # InputLabel, TextInput, etc. (Breeze + Ant Design wrappers)
│   ├── prescription/     # PrescriptionBuilder, ComplaintPicker, DurationPicker, MedicineSearch, DoseConfigModal, MedicineList, FollowUpPicker, TemplateSelector, PrescriptionPrintLayout
│   ├── patient/          # PatientForm, PatientSearch, PatientProfile, PatientList
│   ├── queue/            # QueueTable, QueueStats, AddAppointmentModal
│   └── shared/           # PageHeader, DataTable, ConfirmDialog, Webcam, LanguageSwitcher
├── hooks/
│   ├── usePrescriptionForm.ts   # the reducer
│   ├── useAutoSave.ts
│   ├── useDebounced.ts
│   └── useMedicineSearch.ts
├── lib/
│   ├── api.ts            # XHR client
│   ├── format.ts         # date/age/currency formatting
│   └── bn.ts             # Bangla digit conversion utilities
├── locales/
│   ├── en/common.json
│   └── bn/common.json
└── types/
    ├── index.d.ts        # shared types from Inertia shared props
    ├── models.ts         # TS mirror of Eloquent models
    └── forms.ts
```

## Conventions

- **One Inertia page per route.** Don't nest Inertia pages. Use React components for sub-views.
- **Strict TypeScript.** Props must be typed.
- **Layouts via persistent layout pattern**:
  ```tsx
  export default function Index({ patients }: Props) { ... }
  Index.layout = (page: ReactNode) => <DoctorLayout>{page}</DoctorLayout>;
  ```
- **Tailwind for layout**, **Ant Design for complex components** (tables, date pickers, drawers, modals, forms). Don't mix the two for the same primitive — if you use Ant's `Table`, use Ant's `Modal` alongside it.
- **Bangla digits** — use `bn.ts` helpers to convert `1+0+1+0+1` ↔ `১+০+১+০+১` based on locale.
- **Print layouts** — `PrescriptionPrintLayout.tsx` renders pure content with `@media print` CSS hiding everything else. No buttons, no nav.

## Shared Inertia props

Registered in [app/Http/Middleware/HandleInertiaRequests.php](../app/Http/Middleware/HandleInertiaRequests.php). Extend to include:

```php
return array_merge(parent::share($request), [
    'auth' => [
        'user' => fn () => $request->user()?->loadMissing('hospital'),
        'permissions' => fn () => $this->permissionsFor($request->user()),
    ],
    'locale' => fn () => app()->getLocale(),
    'flash' => [
        'success' => fn () => $request->session()->get('success'),
        'error' => fn () => $request->session()->get('error'),
    ],
]);
```

TypeScript side mirrors them in `resources/js/types/index.d.ts`:

```ts
export interface PageProps {
  auth: { user: User & { hospital: Hospital | null }; permissions: string[] };
  locale: 'en' | 'bn';
  flash: { success?: string; error?: string };
}
```

## Missing packages to add

The spec requires these but they're not in `package.json` yet. Add when first used:

| Package | For |
|---|---|
| `antd` | Ant Design components |
| `recharts` | Charts |
| `@dnd-kit/core` + `@dnd-kit/sortable` | Drag-reorder medicines |
| `react-i18next` + `i18next` | Translations |
| `html2canvas` + `jspdf` | Client-side PNG/PDF export |
| `dayjs` | Date math (lighter than moment) |

Composer side:

| Package | For |
|---|---|
| `barryvdh/laravel-dompdf` | Server-side PDF generation |
| `intervention/image` | Image resize/compress on upload |
| `laravel/scout` (optional) | Full-text medicine search |

## Styling notes

- Font stack: system sans for UI; for print and Bangla text, load **Noto Sans Bengali** (or SolaimanLipi) via Google Fonts and apply `font-family: 'Noto Sans Bengali', system-ui` on `.bn-text` and on `.prescription-body` globally.
- Colors: use the Tailwind defaults for now. Define semantic tokens later (`primary`, `success`, `warning`, `danger`) in `tailwind.config.js` once the palette is locked.
