# Layouts

Page chrome. A page picks its layout either by wrapping its JSX or with the
static-prop form Inertia supports:

```tsx
Index.layout = (page: ReactNode) => <HospitalLayout>{page}</HospitalLayout>;
```

## Which layout to use

| Layout | For | Chrome |
|---|---|---|
| `AdminLayout` | `/admin/*` — super admin | Shared `AppShell` |
| `HospitalLayout` | `/hospital/*` — hospital admin | Shared `AppShell` + patient search |
| `ReceptionistLayout` | `/receptionist/*` | Shared `AppShell` + patient search |
| `DoctorLayout` | `/doctor/*` | **Bespoke.** Denser sidebar rail, custom icon set, page-title bar. |
| `RoleLayout` | Pages any signed-in role can reach — currently only `/profile` | Delegates to the four above based on `auth.user.role` |
| `PrescriptionLayout` | The full-screen prescription builder | Distraction-free: no sidebar, no header |
| `GuestLayout` | Login, register, password reset | Centred card on a dark page |
| `PublicLayout` | Unauthenticated public pages — booking, Rx verification | Slim public header/footer |

The landing page (`Pages/Welcome.tsx`) uses no layout — it is a self-contained
marketing page.

## Partials

`Partials/` holds the pieces layouts are built from, never whole layouts:

- **`AppShell`** — the sticky header + collapsible sidebar used by the admin,
  hospital and receptionist areas. Those were three near-identical copies that
  had drifted apart; they are now configuration (`title`, `navItems`,
  `headerExtra`, `settingsHref`) over this one component. Sidebar highlighting
  is longest-prefix, so `/hospital/templates/analytics` lights only the
  analytics entry.
- **`UserMenu`** — the account dropdown: profile, optional role settings,
  log out. Rendered by `AppShell`, so every shell-based layout gets it for free.

`DoctorLayout` intentionally does not use `AppShell`. Its chrome is a different
design, not a variation on the shared one, so folding it in would be a redesign
rather than a refactor. It renders its own equivalent account dropdown.

## Conventions

- One layout per file, `PascalCase.tsx`, filename === default export.
- A layout owns navigation and chrome only. No data fetching, no business rules.
- Nav items are a `NavItem[]` constant at the top of the file, not inline JSX.
- Link to routes with the `route()` helper where a named route exists; the nav
  arrays use literal paths because they are also used for active-state matching.
