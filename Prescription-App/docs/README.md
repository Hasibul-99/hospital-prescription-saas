# Prescription-App Documentation

Welcome. This folder is the working knowledge base for the Prescription-App project. Start with [CLAUDE.md](../CLAUDE.md) in the project root for a quick orientation, then dive into the topic-specific guides below.

## Table of contents

| Doc | What it covers |
|---|---|
| [01-architecture.md](01-architecture.md) | Multi-tenant model, request lifecycle, hospital scoping |
| [02-database-schema.md](02-database-schema.md) | All 19 tables, columns, relationships, indexes |
| [03-auth-and-roles.md](03-auth-and-roles.md) | Roles, middleware, policies, redirects after login |
| [04-modules.md](04-modules.md) | Feature-by-feature walkthrough (patients, appointments, prescriptions, templates, medicines, reports) |
| [05-frontend.md](05-frontend.md) | Inertia + React structure, page organisation, component library |
| [06-dev-setup.md](06-dev-setup.md) | Getting the project running locally, missing packages to install |
| [07-build-roadmap.md](07-build-roadmap.md) | Status of each of the 10 prompts, what's done, what's next |

## External references

- **Build spec** — [../../Prescription-Software/project-doc.md](../../Prescription-Software/project-doc.md). Ten numbered prompts. Treat as authoritative for scope.
- **UI design** — [../../Prescription-Software/medixpro/](../../Prescription-Software/medixpro/). Static HTML mockup of every page.

## Keeping docs honest

Each doc should describe **the way things are**, not the way we hope they'll be. When a feature is spec'd but not yet implemented, mark it `TODO` or `NOT IMPLEMENTED` so readers aren't misled. Update [07-build-roadmap.md](07-build-roadmap.md) as prompts complete.
