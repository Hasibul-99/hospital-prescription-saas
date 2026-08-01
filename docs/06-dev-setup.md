# 06 — Local dev setup

## Prerequisites

- **PHP** 8.2+ with extensions: `pdo_sqlite`, `pdo_mysql`, `mbstring`, `bcmath`, `gd` or `imagick` (for image uploads), `zip`, `fileinfo`, `openssl`, `intl`
- **Composer** 2.x
- **Node** 20+ and **npm** 10+
- **SQLite** (for local dev — shipped with PHP) OR **MySQL 8** (for a more production-like setup)
- (Optional) **Redis** — only needed if you want to test queue/cache behaviour locally

## Initial setup

From `Prescription-App/`:

```bash
composer install
npm install

# .env already exists; if not:
# cp .env.example .env
php artisan key:generate

# SQLite: the DB file already exists at database/database.sqlite
# MySQL: create DB, set DB_* vars in .env, then run:
php artisan migrate
php artisan db:seed       # once seeders exist (see below)
```

## Running the app

Use the `dev` Composer script — it runs server, queue, logs, and Vite concurrently:

```bash
composer run dev
```

Or run pieces individually:

```bash
php artisan serve        # http://127.0.0.1:8000
npm run dev              # Vite dev server at http://localhost:5173
php artisan queue:listen # queue worker (only needed when Redis queues are wired up)
php artisan pail         # live log tail
```

## Installing missing runtime dependencies

The spec requires these but they're not yet added. Install as needed:

### npm (frontend)

```bash
npm install antd recharts dayjs \
            @dnd-kit/core @dnd-kit/sortable \
            react-i18next i18next i18next-browser-languagedetector \
            html2canvas jspdf
```

### composer (backend)

```bash
composer require barryvdh/laravel-dompdf intervention/image
# Optional (for full-text medicine search once it matters):
composer require laravel/scout
```

After installing `intervention/image`, publish its config:

```bash
php artisan vendor:publish --provider="Intervention\Image\Laravel\ServiceProvider"
```

## Database notes

### SQLite (default)

- File at [database/database.sqlite](../database/database.sqlite).
- Fine for everything except FULLTEXT medicine search, which is MySQL-only. In SQLite, fall back to `LIKE '%q%'` — already acceptable for local dev.
- Reset dev DB: `php artisan migrate:fresh --seed`.

### MySQL

Use when you need FULLTEXT or when testing production behaviour. In `.env`:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=prescription_app
DB_USERNAME=root
DB_PASSWORD=
```

Then `php artisan migrate:fresh --seed`. Migrations use conditional syntax to skip FULLTEXT indexes on SQLite.

## Seeding

Seeders will live in [../database/seeders/](../database/seeders/). Planned seeders (not yet written):

- `SuperAdminSeeder` — creates one super admin (email: `admin@example.com`, password: `password`) with `hospital_id = NULL`.
- `HospitalSeeder` — creates 2–3 demo hospitals.
- `UserSeeder` — creates hospital admin + 2 doctors + 1 receptionist per hospital.
- `MedicineSeeder` — reads `database/data/medicines.json` (Bangladeshi medicine catalog).
- `ComplaintMasterSeeder` — reads `database/data/complaints.json`.
- `ComplaintDurationPresetSeeder`.

Run all: `php artisan db:seed`. Run one: `php artisan db:seed --class=MedicineSeeder`.

## Testing

PHPUnit is already configured (see [phpunit.xml](../phpunit.xml)). Run:

```bash
php artisan test             # runs tests in tests/
php artisan test --filter X  # run specific test
```

As features land, add:
- Feature tests for role-scoped routes (`tests/Feature/Admin/*`, `tests/Feature/Doctor/*`, etc.)
- Unit tests for `BelongsToHospital` scope behaviour.
- Feature tests asserting a doctor in Hospital A **cannot** fetch a patient from Hospital B.

## Useful artisan commands once we have them

```bash
php artisan medicines:import storage/imports/medicines.csv   # bulk import
php artisan statements:generate                              # daily rollup into daily_statements
php artisan followups:remind                                 # send follow-up reminders
```

## Editor tips

- VS Code: install the Laravel, PHP Intelephense, Tailwind CSS IntelliSense, and ESLint extensions.
- This repo is on **Windows** — paths use backslashes in some places, but Git and Laravel both accept forward slashes. Prefer forward slashes in code and docs.
