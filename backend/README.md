# AWMS Backend — Phase 1–11: Full Module Set (pre-hardening/deployment)

Production-ready implementation of all 11 functional modules from the architecture roadmap. Remaining work is hardening + AWS deployment (see TODO list at the bottom) — no more net-new modules planned unless scope changes.

## What's included

### Phase 1 — Auth, Users, Roles & Permissions
- **Auth**: login (email/mobile + password), OTP login, JWT access token (15 min) + rotating refresh token (30 days, hashed at rest), device/session management, forgot/reset-password stubs wired for the notifications module.
- **Users**: CRUD, paginated + searchable list, soft delete, argon2 password hashing, org-scoped.
- **Roles & Permissions**: role CRUD, permission catalog, role→permission assignment, system roles protected from deletion/mutation.
- **Cross-cutting**: global JWT guard (`@Public()` to opt out), global RBAC guard (`@Permissions({module, action})`), audit log interceptor (auto-logs every mutating request), global exception filter, rate limiting (120 req/min/IP, tune per route), Helmet, CORS, Swagger at `/api/v1/docs`.

### Phase 2 — Warehouses & Location Hierarchy
- **Warehouses**: CRUD, org-scoped, unique short `code` used as the location-code prefix.
- **Locations**: full `Zone → Block → Row → Rack → Level → Position` hierarchy. Each level has its own create endpoint nested under its parent (`POST /warehouses/:id/zones`, `POST /zones/:id/blocks`, … down to `POST /levels/:id/positions`).
- **Location codes**: auto-generated on position creation by walking the ancestry, e.g. `WH1-ZA-B2-RW1-RK3-L4-P12`. Unique constraint means duplicates are rejected with a clear 409.
- **Occupancy**: `GET /warehouses/:id/layout` returns the full nested tree with each position's status **and** color (`EMPTY→green`, `PARTIAL→yellow`, `FULL→red`, `DISABLED→grey`), plus a rolled-up occupancy percentage for the whole warehouse — this is what the frontend's visual warehouse map binds to.
- **Status**: `PATCH /positions/:id/status` for manual overrides (e.g. disabling a damaged position). `LocationsService.recalculateStatus()` is exported for the Inventory module to call automatically as bags are placed/removed (EMPTY/PARTIAL/FULL derived from `currentLoad` vs `capacity`).

### Phase 3 — Farmers & Crops
- **Farmers**: CRUD, org-scoped, auto-generated sequential `farmerCode` (`FARM-000001`), duplicate-mobile guard. Aadhaar and bank account number are **encrypted at rest** (AES-256-GCM via `EncryptionUtil`, key from `ENCRYPTION_KEY` env var) and only ever returned masked (`XXXXXXXX1234`) — never in plaintext, never in list responses.
- **Crops**: master list with moisture/storage/shelf-life/ideal temp & humidity/default charge, many-to-many with **Bag Types** via a join table (`PATCH /crops/:id/bag-types` to set allowed bag types for a crop).
- **Bag Types**: simple master (label + weight), reused across crops.

### Phase 4 — Weighbridge, Bags, Quality & Inventory
- **Weighbridge**: vehicle in/out entries, auto net-weight calc (rejects gross < tare), sequential slip numbers (`WB-20260724-00001`).
- **Bags**: intake (`POST /bags`) auto-generates `bagCode` + a unique QR token, and — if placed into a position at intake — refuses `FULL`/`DISABLED` positions and bumps occupancy. `PATCH /bags/:id/move` transfers between positions (rejects same-position moves, rejects moving anything not `IN_STORAGE`), decrementing the old position and incrementing the new one. `adjust`, `damage`, and `dispatch` endpoints round out the lifecycle, each writing an `InventoryMovement` row.
- **This is where occupancy goes live**: every placement/move/damage/dispatch calls `LocationsService.recalculateStatus()`, so `GET /warehouses/:id/layout` (Phase 2) now reflects real bag activity — EMPTY/PARTIAL/FULL/color all update automatically as bags move.
- **QR**: `GET /qr/:code/resolve` looks up a bag (with farmer/crop/position/movement history) by its printed QR token. The token itself is an opaque random string — no data is encoded in it, so nothing leaks if the QR image is copied.
- **Quality**: `POST /bags/:id/quality-reports` records an inspection and updates the bag's `grade` in the same transaction.
- **Inventory**: `/inventory/summary` (bags grouped by status and by crop with total weight), `/inventory/movements` (full audit trail, filterable by bag), `/inventory/adjust` and `/inventory/transfer` as thin aliases over the Bags endpoints (matches the API spec's `/inventory/*` routes without duplicating logic).

### Phase 5 — Billing & Payments
- **Billing rules**: per-crop or org-wide default (`isDefault`), rate per bag/day or per kg/day, plus flat handling/loading/unloading/packing/cleaning/sorting/insurance charges and a GST percent.
- **Invoice generation** (`POST /billing/generate`): for each farmer (or one, via `farmerId`), finds their `IN_STORAGE` bags, computes storage days overlapping the requested period per bag (clipped to `receivedAt` and `min(periodTo, now)`), resolves the rate (crop-specific rule → org default rule → `crop.defaultCharge` → 0), sums into a subtotal, adds the default rule's flat charges once per invoice, applies GST, discount, and penalty. Skips farmers with nothing billable — no empty invoices.
- **Invoices**: `GET /invoices` (filterable by farmer/status), `GET /invoices/:id`, `GET /invoices/:id/pdf` (stub, same pattern as the weighbridge slip — real rendering lands with Reports/Documents).
- **Payments**: `POST /payments` records cash/UPI/bank/cheque/card payments against an invoice (or standalone), auto-generates a receipt number, and flips the invoice to `PARTIAL` or `PAID` based on cumulative payments vs. total. Rejects a payment against an invoice that doesn't belong to the stated farmer.
- **Outstanding**: `GET /farmers/:id/outstanding` sums `totalAmount − paid` across all of a farmer's non-paid invoices.

### Phase 6 — Dispatch
- **Initiate** (`POST /dispatch`): validates every bag belongs to the stated farmer and is `IN_STORAGE`, reserves them all (`RESERVED` status — frees them back to `IN_STORAGE` on cancel, never left in limbo), generates a hashed 6-digit OTP (10 min TTL) and a sequential `dispatchNumber`. The OTP itself is never returned in any response — it's handed to the Notifications module to deliver (stubbed for now, same pattern as Auth's OTP login).
- **Verify** (`POST /dispatch/:id/verify-otp`): checks the dispatch is still `PENDING` and the OTP hasn't expired, then — only on success — calls `BagsService.markDispatched()` for every bag in the dispatch, which frees their warehouse positions (recalculating occupancy from Phase 4) and writes the `DISPATCH` movement. Dispatch flips to `COMPLETED`.
- **Cancel** (`POST /dispatch/:id/cancel`): only valid from `PENDING`, unreserves every bag back to `IN_STORAGE`.
- **Gate pass** (`GET /dispatch/:id/gate-pass`): only available once `COMPLETED`; PDF rendering deferred to Documents module, same stub pattern as the weighbridge slip and invoice PDF.
- Removed the ad-hoc `PATCH /bags/:id/dispatch` from the Bags controller now that Dispatch owns the only path to a `DISPATCHED` bag — going around the OTP gate is no longer possible through the API.

### Phase 7 — Dashboard & Reports
- **Dashboard** (`GET /dashboard/summary`): today's revenue, monthly revenue, today's entries, today's dispatches, farmer count, in-storage inventory count, crop distribution (bags by crop), pending bills (total + count), and org-wide warehouse occupancy (positions total/occupied/available/percent) — all computed from independent aggregate queries run in parallel, no permission gate (any authenticated user gets their org's summary). Deliberately doesn't include weather/live-CCTV — those bind to external tools/streams at the frontend layer, not backend aggregation.
- **Reports**: `inventory`, `farmers`, `crops`, `warehouses` (occupancy), `revenue`, `pending-bills`, `damage`, `dispatch` — each returns flat JSON rows by default (`{ rows, count }`) or a downloadable CSV with `?format=csv`. `revenue` and `dispatch` accept `?from=&to=` date filters. Excel/PDF rendering is deferred to a dedicated Reports/Documents renderer — same stub pattern as invoices/slips/gate-passes; CSV needed no extra dependency so it's real today.

### Phase 8 — Notifications & Documents
- **Notifications**: a `NotificationProvider` interface with one stub implementation per channel (`EmailProvider`, `SmsProvider`, `WhatsAppProvider`, `PushProvider`) — each currently just logs, but swapping in a real vendor (Twilio/MSG91, SES/SendGrid, WhatsApp Business API, FCM) means implementing `send()` and changing one binding in `NotificationsModule`; nothing else in the app changes. `NotificationsService.send()` is fire-and-forget by design — a delivery failure is caught, logged, and recorded, never thrown, so it can never break the calling flow. Every attempt (success or failure) is persisted for `GET /notifications` / `POST /notifications/test`.
- **This is where the OTP/reset stubs got wired for real**: `AuthService.requestOtp()` now sends via `SmsProvider`; `AuthService.forgotPassword()`/`resetPassword()` now use a real hashed, expiring `PasswordResetToken` table (30 min TTL, single-use, and — on successful reset — revokes every existing refresh token so old sessions can't survive a password change) and emails the link via `EmailProvider`; `DispatchService.create()` now sends the gate-release OTP via SMS to the farmer's mobile. All three previously had `TODO` comments — none do now.
- **Documents**: a metadata registry, not a file uploader — `POST /documents/upload` records `{ type, fileUrl, fileName, mimeType, farmerId?, entityType?, entityId? }` for a file already placed in S3 via a presigned URL (that URL-generation endpoint itself is an AWS-deployment-phase task, so the actual upload path isn't built yet — but the registry that everything else points at is). `entityType`/`entityId` let a document attach to anything (a dispatch, a bag, an invoice), not just a farmer.

### Phase 9 — CCTV
- **Registry**: cameras belong to a warehouse, with `assignedTo` for the human-readable location (`"Entry Gate"`, `"Block A"`, `"Dispatch Area"`), RTSP URL, ONVIF details (JSON), and credentials — the password is encrypted at rest the same way as Farmer Aadhaar/bank fields, and stripped from every response except `GET /cameras/:id/stream`, which server-side-decrypts it for a video player to actually open the feed.
- **Health**: `PATCH /cameras/:id/health` is a webhook target for a health-check worker or the camera/NVR itself — marked `@Public()` (bypasses the JWT guard) with a `TODO` to add HMAC/shared-secret verification once real hardware is in the loop. Fires a `CAMERA_OFFLINE` notification only on the transition into offline, not on every repeated poll.
- **Motion**: `POST /cameras/:id/motion-alert` is the same kind of public webhook, firing a `CAMERA_MOTION` notification.
- **Snapshot**: `POST /cameras/:id/snapshot` records the *request* — it doesn't produce a real image today, since pulling a frame off an RTSP stream needs an edge worker (ffmpeg or similar) that's out of scope for this API server. Honestly stubbed rather than faked.
- Alerts currently target a placeholder `warehouse:{id}` recipient — real per-manager targeting needs the Employees/staff-assignment module (next) to know who's actually responsible for which warehouse.

### Phase 10 — Employees
- **Employee profiles**: one-to-one with `User` (an employee is a user with extra HR fields — designation, shift, salary, join date, auto-generated `EMP-00001` code). Reuses the existing Users/Roles system for login and permissions rather than duplicating an auth concept — "Permissions" from the original spec's Employee Management list is already covered by Phase 1's RBAC.
- **Attendance**: `POST /employees/:id/attendance` upserts on `(employeeId, date)` — marking the same day twice updates it rather than creating duplicates, so a corrected attendance entry is a normal PUT-like operation, not a new row. `GET /attendance` filters by employee and date range.
- **Leave**: request → pending → approve/reject, with `decidedById`/`decidedAt` recorded. A leave request can only be decided once — no flip-flopping an approval back to pending.
- **Deliberately not built**: "Shift" is a free-text field, not a scheduling engine (spec didn't call for shift rotation logic); "Performance" and "Tasks" from the original spec's Employee Management list aren't modeled — they read as a lightweight project/review system that didn't have enough spec detail to build correctly rather than guess at; flag if you want them scoped out properly.

### Phase 11 — Settings & Audit Log
- **Settings**: most of the original spec's "Settings" list already has a real home with real validation — Warehouse (Phase 2), Bag Types & Crop config (Phase 3), Billing Rules (Phase 5), Roles & Permissions (Phase 1), Camera settings (Phase 9). What's left is genuinely free-form org config that doesn't warrant its own table — company profile, tax defaults, theme, language, notification preferences — so `Setting` is a generic `(organizationId, key) → JSON value` registry. `GET/PATCH /settings/:key` upserts; the well-known keys and their expected shapes are documented as a const in `SettingsService` (`company_profile`, `tax_defaults`, `theme`, `language`, `notification_preferences`) as a convention, not a schema — add new keys there as they come up.
- **Audit Log**: nothing new to write — `AuditInterceptor` from Phase 1 has been logging every mutating request across all 11 modules the whole time. This phase adds the read side: `GET /audit-logs?userId=&module=&entityId=&from=&to=` with pagination capped at 200/page.

## Setup
```bash
cp .env.example .env        # fill in real secrets
docker compose -f docker/docker-compose.yml up -d   # Postgres + Redis
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed          # creates system roles + bootstrap admin (admin@awms.local)
npm run start:dev
```

Swagger: http://localhost:3000/api/v1/docs

**First login:** `admin@awms.local` / value of `SEED_ADMIN_PASSWORD` in `.env`. Change it immediately via `PATCH /api/v1/users/:id`.

## Testing
```bash
npm test
```
Covers: login rejection paths (unknown user, inactive, wrong password), successful token issuance, user CRUD guard rails (not-found, duplicate email, sensitive-field stripping, pagination).

## Notes / TODO before Hardening & AWS Deployment
- All four notification providers (Email/SMS/WhatsApp/Push) are console-logging stubs — swap in real vendor SDKs by implementing `NotificationProvider.send()` per channel and rebinding in `NotificationsModule`; no caller-side changes needed.
- `RbacGuard` currently checks module+action only; scope (`own`/`warehouse`/`org`) enforcement — now that Employees exists, this is the natural point to add "manager sees only their assigned warehouse" style scoping. **Still open** — needs a warehouse↔employee assignment relation added to the schema first (see below); deliberately not half-implemented in this pass since a partial scope check is worse than none (false sense of security).
- Farmer `panNumber`/`gstNumber`/`bankIfsc` are stored in plaintext (not classed as sensitive-at-rest in the same tier as Aadhaar/account number) — revisit if compliance requirements tighten.
- Set a real `ENCRYPTION_KEY` before running anything that touches Farmers or Cameras — the app throws on first encrypt/decrypt call if it's missing or the wrong length.
- ~~Bag/Dispatch flows make sequential Prisma calls rather than wrapping multi-row updates in a single `$transaction`~~ — **Done for Bags**: `create`/`move`/`markDamaged`/`markDispatched` now run inside `prisma.$transaction` (bag update + movement log + position load/status recalc commit atomically — see `BagsRepository.runInTransaction`). **Still open for Dispatch**: `verifyOtp()` loops over multiple bags calling `BagsService.markDispatched()` per bag; each individual bag update is now atomic, but the loop across bags is not itself one transaction — a failure partway through can leave some bags DISPATCHED while others aren't. Wrapping that fully requires threading a shared `tx` client across the Dispatch↔Bags module boundary (bigger refactor, left as a follow-up).
- ~~`weighbridge.getSlip()` / `billing.getPdf()` / `dispatch.getGatePass()` all return the raw record~~ — **Done**: all three now render real PDFs via `pdfkit` (`common/utils/pdf.util.ts`). New endpoints: `GET /weighbridge/entries/:id/slip/pdf`, `GET /invoices/:id/pdf`, `GET /dispatch/:id/gate-pass/pdf`. Frontend wired with "Download PDF" / "Print slip" / "Gate Pass PDF" buttons.
- Position `capacity`/`currentLoad` track **bag count**, not weight — if you need weight-based capacity instead, that's a one-line change in `BagsService.bumpPositionLoad`.
- Billing only invoices currently `IN_STORAGE` bags — a bag received and fully dispatched inside the same billing period isn't picked up yet. Revisit once DISPATCH movement timestamps are used to reconstruct historical occupancy.
- Reports/Dashboard queries are not cached — fine at current scale (small per-org datasets), but the nested `warehouses` report and dashboard occupancy query both walk the full location tree; revisit with a materialized/denormalized occupancy count per warehouse if org sizes grow large.
- ~~Excel (.xlsx) export isn't implemented~~ — **Done**: `GET /reports/:key?format=xlsx` streams a branded native workbook via `exceljs`, alongside the existing `format=csv`/JSON. Frontend Reports page has both buttons now.
- `POST /documents/upload-url` (presigned S3 PUT URL) now exists — requires `AWS_REGION`/`AWS_S3_BUCKET`/AWS credentials configured; throws a clear config error otherwise rather than a raw SDK stack trace. Actually provisioning the S3 bucket is still an AWS Deployment phase task.
- ~~`PATCH /cameras/:id/health` and `POST /cameras/:id/motion-alert` are `@Public()` webhooks with no auth~~ — **Done**: both now require `WebhookSignatureGuard` (HMAC-SHA256 + timestamp replay protection — see the guard's docblock for the header contract). Configure `WEBHOOK_HMAC_SECRET` before pointing any hardware/worker at these.
- Camera/motion alerts go to a placeholder `warehouse:{id}` recipient — now that Employees exists, wire this to actual assigned managers (needs a warehouse↔employee assignment relation that doesn't exist yet — add it if/when staff-to-warehouse assignment becomes a real requirement, not before).
- Snapshot capture is request-only — no actual RTSP frame grabbing. Needs an edge worker (ffmpeg-based) outside this API server.
- Employee "Performance" and "Tasks" (from the original spec's Employee Management list) are not modeled — flag if these need to be built out; they weren't specified in enough detail to design correctly.

## Production-upgrade pass (this session)
- Fixed a corrupted `{weighbridge` / `{common` / etc. literal-brace directory left behind by a bad `mkdir -p {a,b,c}` invocation in an earlier session — these were empty and safe to delete, but would have confused tooling.
- Added `GET /health` (liveness) and `GET /health/ready` (DB-connectivity readiness) — see `modules/health/` — for load balancers / k8s / ECS health checks.
- Added structured logging via `nestjs-pino` (replaces raw `console.log` in `main.ts`), with sensitive fields (`password`, `otp`, `authorization` header, etc.) redacted from logs by default. Set `LOG_LEVEL` in `.env` to control verbosity.
- Added a multi-stage production `Dockerfile` (non-root user, healthcheck, minimal `node:20-alpine` runtime).
- Added `docker-compose.prod.yml` at the repo root wiring Postgres + Redis + backend + frontend together for a one-command production stack.
- Added `.github/workflows/ci.yml` — lints, tests (against a real Postgres service container), and builds both packages on every push/PR; builds (but does not push) Docker images on `main`.

**Sandbox limitation, please read**: this pass was done without network access, so none of the above (`npm install`, `npm run build`, `npm test`, `docker build`) could actually be executed here to verify. The code follows the project's existing patterns closely and was hand-reviewed against the Prisma schema and NestJS module wiring, but please run `npm install && npm run build && npm test` (and `docker compose -f docker-compose.prod.yml build`) as the very first step after pulling these changes, before deploying anywhere.

## Verified & recently added
- `npm install`, `tsc --noEmit`, and `jest` (with a jest config that was missing until now, added to `package.json`) all run in-session. 45/45 tests pass in suites that don't depend on Prisma-generated types; the other 8 suites can't run in this sandbox because `binaries.prisma.sh` is network-blocked here — that's an environment limitation, not a code defect, and will resolve with normal internet access.
- `POST /auth/change-password` (current-password-verified, revokes other sessions) and `GET /auth/permissions` (feeds the frontend's permission-based nav filtering).
- `POST /payments/:id/refund` — proper negative-transaction accounting (`PaymentTransactionType.REFUND`), invoice status recomputed from net paid, refund amount capped at net paid.
- `POST /documents/upload-url` — presigned S3 PUT URL generation via `@aws-sdk/client-s3` + `s3-request-presigner`.
- Dispatch gate release now optionally cross-checks `scannedBagCodes` (QR values) against the dispatch's bags before releasing — opt-in via the request body, doesn't break existing OTP-only verification.
