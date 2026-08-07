# Components

Shared React components. Anything used by more than one page lives here; a
component used by exactly one page belongs next to that page instead.

## Folders

Grouped by **what the component knows about**, not by which role uses it — a
component used only by hospital admins today may be reused by the super admin
tomorrow, so role is a poor filing key.

| Folder | Holds | Rule of thumb |
|---|---|---|
| `UI/` | Design-system primitives — buttons, inputs, modal shell, pagination. | Zero domain knowledge. Must not import from `@/types` or mention patients, doctors, prescriptions. |
| `Common/` | App-shell widgets used across every role — flash messages, language switcher, notification bell. | Domain-aware but feature-agnostic. |
| `Patient/` | Patient forms, search, vitals. | |
| `Scheduling/` | When and where a doctor sees patients — appointments, chambers, holidays. | |
| `Staff/` | Doctor and user account management — profile fields, quota bar, password reset. | |
| `Prescription/` | The prescription builder and its print layout. The largest feature area. | |
| `AuditLog/` | Audit-log table cells and helpers, shared by the admin and hospital log pages. | |

Add a new folder when a third component would otherwise sit loose at the root.
Do not put loose `.tsx` files directly in `Components/`.

## Naming

- **One component per file, `PascalCase.tsx`, filename === default export.**
  `DoctorQuota.tsx` exports `DoctorQuota`.
- Files that export a *set* of small related pieces rather than one component
  are named for the set (`AuditLogUi.tsx`) and use named exports only.
- Do not repeat the folder in the filename — `Patient/PatientForm.tsx` is
  acceptable because the component is genuinely called `PatientForm`, but
  `Patient/PatientPatientCard.tsx` is not.
- Types a component owns are exported from its own file
  (`export type DoctorQuotaData`), not from `@/types`. `@/types` is for shapes
  that come from the server.

## Imports

Always use the `@/Components/<Folder>/<Name>` alias — never a relative path
that climbs out of a folder (`../../Components/...`). Relative imports are fine
*within* a folder, which is how the `Prescription/` components reference each
other.

## Known dead code

`UI/ApplicationLogo.tsx`, `UI/Checkbox.tsx`, `UI/NavLink.tsx` and
`UI/ResponsiveNavLink.tsx` are Laravel Breeze scaffolding with no remaining
importers — the app uses Ant Design equivalents. They are kept only because
deleting them is a separate decision; if nothing starts using them, remove them.
