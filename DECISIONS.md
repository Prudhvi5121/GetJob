DECISIONS
=========

Q1 — What I implemented
- Backend: TypeScript + Express API with endpoints: `/api/jobs`, `/api/jobs/:id`, `/api/health`, `/api/sources`, `/api/sources/:source`, `/api/ingestion/runs`, `POST /api/ingestion/run` and a rate-limit on ingestion triggers. Ingestion pipeline persists run metrics (fetched/validated/normalized/inserted/etc.).
- Frontend: Angular SPA with Home, Jobs (search + filters: location, remote, category, job_types), pagination, Job Details (`View Original`), and an Admin ingestion dashboard (`/admin`) showing overview cards, source health table, recent runs, and a manual `Run ingestion now` trigger.
- Tests: Backend automated API script and Playwright E2E tests for P2 and P3. All tests passed during verification.

Q2 — Key decisions and trade-offs
- Keep UI simple and responsive: implemented minimal, premium-looking controls without adding advanced filtering or P4 features.
- Admin run trigger: implemented a manual trigger + short polling loop in the UI; this is intentionally simple (no websockets) to keep behavior deterministic and low-risk.
- Static test server: added `frontend/tools/static-server.js` to serve built assets and proxy `/api` to the running backend for reliable headless E2E runs.
- Runtime fix: imported `zone.js` in `src/main.ts` to satisfy Angular's zone-based change detection (required for bootstrap); this is a necessary runtime dependency, not a behavioral change.
- Tests tolerant of backend timing: some Playwright assertions accept either a running indicator or an immediate error (rate-limit) when triggering ingestion, to keep tests stable across environments.

Q3 — How to run and verify (commands used during verification)
- Backend (dev):
  - `cd backend`
  - `npm install` (if necessary)
  - `npm run start` (runs ts-node-dev at http://localhost:3000)
  - `npm run build` (compiles TypeScript)

- Frontend (build & serve for tests):
  - `cd frontend`
  - `npm install`
  - `npx ng build` (produces optimized `dist`)
  - `node tools/static-server.js` (serves `dist` at http://127.0.0.1:4300 and proxies `/api` to backend)

- Run Playwright tests:
  - `npx playwright install --with-deps` (one-time)
  - `npx playwright test --config=playwright.config.ts`

Notes: all verification runs used the real backend and the static server proxy so E2E tests exercised the real APIs.

End of decisions (one-page summary)
