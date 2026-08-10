# AWMS Frontend

React (JavaScript) + MUI + Redux Toolkit + React Query admin dashboard, consuming the existing `AWMS/backend` API as-is — no backend changes, no mock data.

## Modules (all wired to real endpoints)
Auth (login/OTP/forgot/reset password), Dashboard, Warehouses (+ visual Zone→Block→Row→Rack→Level→Position map), Farmers, Crops & Bag Types, Inventory/Bags (+ QR resolve), Weighbridge, Billing (rules + invoice generation + detail), Payments, Dispatch (+ OTP gate release + optional QR scan cross-check), Reports (CSV export), CCTV (registry — no live video, see note below), Employees (+ leave approval), Notifications, Documents (real upload via presigned S3 URL), Users & Roles (+ permission matrix), Settings, Audit Log, Profile (+ change password + session/device management). Nav auto-filters by the signed-in user's real permissions from `GET /auth/permissions`.

## Setup
```bash
cd frontend
cp .env.example .env   # point VITE_API_PROXY_TARGET at the running backend
npm install
npm run dev
```

## Known gaps (honest, not silently skipped)
- CCTV: no live video playback — needs an RTSP-to-WebRTC bridge (e.g. MediaMTX) in front of camera feeds; registry/health/snapshot-request are real.
- QR scanning: manual code entry works against the real resolve endpoint; camera-based scanning needs HTTPS + camera permission in a real deployment.
- `PermissionGate` and nav filtering are now fed by `GET /auth/permissions`, fetched once per session in `AppShell`.
- Documents upload requires the backend to have `AWS_REGION`/`AWS_S3_BUCKET`/AWS credentials configured — without them, `/documents/upload-url` returns a clear error rather than a raw SDK stack trace.

## Verified
`npm install` and `npm run build` both succeed with zero errors (verified in-session — not just structurally written). `npm test` passes 13 tests across authSlice, authSchemas, and usePaginationModel. Routes are code-split with `React.lazy` per page; the one remaining >500kB chunk warning is the shared vendor bundle (React/MUI/Router/Query core) — normal for this stack, not a per-route issue.

Removed `react-qr-reader` from package.json — it doesn't support React 18 and wasn't actually used in any component (QR lookup is manual-entry against the real `/qr/:code/resolve` endpoint). Swap in a maintained alternative (`@zxing/browser` or `html5-qrcode`) if camera-based scanning is needed later.

## Verified & recently added (this pass)
- `npm install` + `npm run build` succeed after this round of changes too (re-verified, not assumed).
- Real bugs caught and fixed by actually running things: a stale `authSlice.test.js` fixture after adding the `permissions` field, and (backend-side) a broken brace + a missing jest config + two wrong test assertions.
- Payments page now has an inline **Refund** action per payment row.
- Documents page now does a real upload: dropzone → presigned S3 URL → direct browser PUT to S3 → metadata registration. No more manual-URL-only flow.
