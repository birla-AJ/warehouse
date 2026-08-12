# Full-project audit — Aug 2026

30-years-experience review, done as a real security/architecture audit,
not a cosmetic pass. Scope: backend (130 files), admin-dashboard (83
files), mobile (previously covered — see mobile/PRODUCTION_NOTES.md).

## Backend — tenant isolation (CRITICAL, fixed)

The core finding: most modules had **zero organization-level data
isolation**. Any authenticated user of any org could read, and in several
cases modify or delete, another organization's data by ID. This is the
single most serious class of bug in a multi-tenant system — worse than a
missing auth check, because the attacker doesn't need to bypass login at
all, just be a legitimate user of *any* org.

**Fixed, with schema migrations where the data model required it:**

| Module | What leaked | Fix |
|---|---|---|
| `bags` | Any bag by ID/QR code — farmer, crop, weight, position, movement history | Scoped via `farmer.organizationId` |
| `dispatch` | Any dispatch, OTP flow, gate pass PDFs | Scoped via `farmer.organizationId`; also verifies bags being dispatched actually belong to the named farmer |
| `inventory` | Movement history, stock summary | Same, via bags |
| `weighbridge` | Vehicle weigh slips | **Schema migration**: added `organizationId` (farmerId is optional here, so relation-scoping wasn't possible) |
| `documents` | Uploaded file records/URLs | **Schema migration**: added `organizationId` (same reason) |
| `audit-log` | Every org's full audit trail (every mutation, every user action) | **Schema migration**: added `organizationId`, stamped by the audit interceptor |
| `employees` | Attendance, leave requests, salary | Scoped via `user.organizationId` |
| `payments` | Payment/refund records | Verifies farmer + invoice ownership before creating |
| `cctv` | **RTSP URLs and camera passwords** — the most sensitive leak found | Scoped via `warehouse.organizationId`; webhook endpoints (health/motion, hit by the camera hardware itself) were already correctly behind `WebhookSignatureGuard`, left as-is |
| `quality` | Inspection reports | Scoped via `bag.farmer.organizationId` |
| `roles-permissions` | **Any org could enumerate, edit, or delete any other org's custom roles** | **Schema migration**: `Role.name` was globally unique with no org column at all; added nullable `organizationId` (null = shared system-role template, matching the existing `isSystem` flag design) |
| `users` | **Any org's admin could fetch, edit, or deactivate any other org's user accounts — including changing their password** | `getById`/`update`/`remove` had no org check whatsoever; fixed, plus role-assignment now verifies the role belongs to the caller's org |
| `warehouses` | Single-warehouse fetch by ID; `code` was globally unique (two unrelated orgs couldn't both use "WH1") | Fixed `getById`; **schema migration**: `code` is now unique per-organization |

**Deliberately left alone:** `crops` and `bagTypes` have globally-unique
names by design — they're shared reference data (generic agricultural
terms like "Wheat", "50 KG bag"), not per-tenant records. Adding
org-scoping there would have been a wrong fix, not a bug fix.

**A finding that turned out to be a false alarm, corrected:** early in
this pass, `JwtAuthGuard`/`RbacGuard` looked unregistered from
`app.module.ts` alone. They were actually already global — NestJS applies
`APP_GUARD` app-wide regardless of which module declares it, and they'd
been registered inside `AuthModule`. Functionally nothing was broken, but
burying app-wide auth enforcement in a feature module is a real
footgun for the next person auditing this file. Consolidated to
`app.module.ts` as the single, visible source of truth.

### Before running this

The Prisma schema changed (`Role`, `Warehouse`, `WeighbridgeEntry`,
`Document`, `AuditLog`). Run a fresh migration:

```bash
cd backend
npx prisma migrate dev --name org-scoping-and-tenant-isolation
npx prisma generate
```

If you already have production data seeded under the *old* schema,
review the migration SQL before applying — the new `organizationId`
columns on `WeighbridgeEntry`/`Document` are non-nullable, so existing
rows need a backfill strategy (which organization do pre-existing rows
belong to?) rather than a blind migrate.

## Backend — not yet audited

Given the size of this codebase, this pass covered every module that
handles bags, dispatch, inventory, users, roles, cameras, documents, and
audit data — the highest-risk surface area. Not yet individually
re-verified for the same tenant-isolation pattern: `notifications`,
`billing` (partially checked — already had `organizationId` usage),
`reports`, `dashboard` (both already correctly scoped, spot-checked).
Worth a follow-up pass with the same checklist (`grep -c organizationId`
per service, then verify every `findFirst`/`findMany`/`update`/`delete`
actually uses it).

## Web (admin-dashboard) — internationalization

Added `i18next` + `react-i18next` + `i18next-browser-languagedetector`.
Structure mirrors the mobile app: `src/i18n/index.js` (init, localStorage
persistence, browser-language detection), `src/i18n/locales/en.json` +
`hi.json` (106 keys, full parity — verified programmatically, no key
exists in one file without the other).

**Fully converted to i18n (zero hardcoded text):**
- All 4 auth pages (login, OTP login, forgot password, reset password),
  including form validation messages — Zod schemas now hold i18n *keys*
  instead of literal English (they run outside React's render tree, so
  they can't call `useTranslation()` directly; components translate the
  key at render time via `t(errors.field.message)`).
- `AppShell` (top bar, drawer nav, command palette, user menu) and
  `AuthLayout` (login screen chrome) — the two layout shells every page
  renders inside.
- A language switcher (`src/components/LanguageSwitcher.jsx`) is now in
  both layouts — visible even on the login screen, before the user
  authenticates.
- A shared `useApiErrorMessage()` hook standardizes how backend error
  responses are shown: our own fallback copy ("couldn't connect", "went
  wrong") is translated; an actual message from the backend passes
  through as-is, since the backend itself only returns English literal
  strings today (see below).

**Not yet converted** (~18 feature modules, roughly 70 files):
inventory/bags, warehouses, farmers, dispatch, billing, payments,
weighbridge, quality, cctv, employees, reports, documents, users,
roles-permissions, settings, notifications, audit-log, dashboard. The
infrastructure, patterns, and locale-file structure are all in place —
extending coverage to each module means the same three steps repeated:
add that module's strings to both locale JSON files, replace literal
JSX text with `t('module.key')`, and swap any Zod message strings for
keys. Mechanical, but there's a lot of it.

**Known limitation, not fixed here:** backend error messages (from
NestJS `BadRequestException`, `ValidationPipe`, etc.) are hardcoded
English strings baked into the backend code itself. A Hindi-speaking
user hitting a validation error will still see English backend text —
full coverage requires the *backend* to return i18n keys instead of
literal messages, which is a separate, cross-cutting backend change.

## Suggested order for continuing

1. Run the Prisma migration (above) and confirm the app boots.
2. Backend: audit the remaining modules listed above with the same
   `organizationId` checklist.
3. Web: convert the highest-traffic remaining modules first — dashboard,
   inventory/bags, warehouses, farmers (the ones an admin opens daily) —
   then work outward to settings/audit-log/rarely-touched screens.
4. If Hindi-speaking users are a real segment (not just an admin-facing
   nicety), consider the backend message i18n effort — otherwise error
   toasts stay English-only regardless of the UI language.
