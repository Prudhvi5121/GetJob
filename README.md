# JobFlow (GetJob)

This repository contains a small job aggregation project (frontend + backend) used for verification of ingestion, API, and UI requirements.

WARNING: This README documents only what is implemented in this workspace at the time of writing. It does not describe planned or unimplemented features.

## Overview

- Backend: TypeScript + Express API that stores job records in SQLite and implements an ingestion pipeline and related operational endpoints.
- Frontend: Angular 16 single-page app (`jobflow-frontend`) that queries the backend and provides job browsing, search, filters, job details, and an admin ingestion dashboard.

## Acdyon Part 1 scope (implemented)

The following features are implemented and were verified end-to-end in this workspace:
- Backend API endpoints: `/api/jobs`, `/api/jobs/:id`, `/api/health`, `/api/sources`, `/api/sources/:source`, `/api/ingestion/runs`, and `POST /api/ingestion/run`.
- Ingestion pipeline runs and records per-run metrics (fetched_count, validated_count, normalized_count, inserted_count, updated_count, duplicate_count, invalid_count, error) and persists results in the DB.
- Frontend P2 features: Home, Jobs list with search, filters (location, remote, category, job_types), pagination, Job Details including 'View Original'.
- Frontend P3 features: Admin ingestion observability dashboard with overview cards, source health table, recent ingestion runs table, and manual `Run ingestion now` trigger.

## Architecture

High-level architecture (frontend talks to backend; backend talks to external job sources such as Arbeitnow):

```mermaid
graph LR
  A[Browser / Angular SPA] -->|HTTP| B[Static server (tools/static-server.js)]
  B -->|/api/* proxy| C[Backend (Express, TypeScript)]
  C -->|reads/writes| D[SQLite DB (backend/data/...)]
  C -->|fetches jobs| E[Arbeitnow API (external)]
```

## Tech stack

- Backend: Node.js (tested on Node v24.13.0), TypeScript, Express, better-sqlite3, Zod (used elsewhere in repo). Build via `tsc`.
- Frontend: Angular 16, TypeScript, Angular Router, Forms. Build via Angular CLI (`ng build`).
- E2E tests: Playwright (`@playwright/test`) with headless Chromium/Firefox/WebKit installed by `npx playwright install --with-deps`.

## Setup

Prerequisites:
- Node.js (workspace tested with Node v24.13.0 and npm v11.6.2)
- Git (optional)

Install dependencies (run in repository root and in `frontend` if needed):

```bash
cd frontend
npm install
npx playwright install --with-deps   # only needed for Playwright tests

cd ../backend
npm install
```

Note: the workspace previously encountered and recovered from transient `ENOSPC` and local `node_modules` metadata issues; if you see semver/dedupe errors, try removing `node_modules` and reinstalling.

## Environment variables and configuration

There are no secrets required to run the project in the workspace. The backend runs on `http://localhost:3000` by default (see backend start scripts). The frontend static server used for E2E tests serves on `http://127.0.0.1:4300` and proxies `/api` to `http://127.0.0.1:3000`.

If you change ports or addresses, update `frontend/tools/static-server.js` or the frontend `playwright.config.ts` baseURL accordingly.

## Database

- The backend uses SQLite (files under `backend/data/` in this workspace). The ingestion pipeline writes job and run records into the DB.

## How to run (development)

Start the backend (development):

```bash
cd backend
npm run start
# starts ts-node-dev server (API on http://localhost:3000)
```

Build and serve the frontend (for tests we use the provided static server to proxy API requests):

```bash
cd frontend
npx ng build        # build artifacts are placed in frontend/dist
node frontend/tools/static-server.js   # serves dist on http://127.0.0.1:4300 and proxies /api -> http://127.0.0.1:3000
```

Open `http://127.0.0.1:4300` in your browser to use the app against the real backend.

## How to run ingestion (manual)

- Trigger ingestion: `POST /api/ingestion/run` (JSON body optional). The admin UI also exposes a `Run ingestion now` button.
- View recent runs: `GET /api/ingestion/runs`.
- View source stats: `GET /api/sources` and `GET /api/sources/:source`.

Example (curl):

```bash
curl -X POST http://localhost:3000/api/ingestion/run -H 'Content-Type: application/json' -d '{}'
curl http://localhost:3000/api/ingestion/runs
```

Rate limiting: the backend enforces a short rate limit on `POST /api/ingestion/run` to avoid concurrent or too-frequent runs; automated tests exercise that behavior.

## API endpoints (implemented)

- `GET /api/jobs?page=&per_page=&q=&location=&remote=&category=&job_types=` — paginated job list (frontend wired to these params).
- `GET /api/jobs/:id` — job details.
- `GET /api/health` — health/status.
- `GET /api/sources` — list of sources and counts.
- `GET /api/sources/:source` — per-source info.
- `GET /api/ingestion/runs` — recent ingestion runs.
- `POST /api/ingestion/run` — trigger ingestion (rate-limited).

All endpoints return JSON and use safe error envelopes for client-friendly error messages.

## Tests and verification

Unit tests: there are no framework unit tests included in this workspace that execute via `npm test` by default (the `test` script was adjusted earlier). The primary verification is via two test types below.

Backend automated API tests (scripted):

- A script `backend/dist/scripts/test_api_automated.js` verifies many API behaviors including pagination, single-job fetch, sources, ingestion runs, trigger, and rate limit safe error envelopes. This script was executed during verification and passed.

Playwright E2E verification (P2 + P3):

- Playwright tests live in `frontend/tests/`:
  - `p2.spec.ts` — verifies Home, Jobs search, filters, pagination, Job Details, loading/error states, responsive checks.
  - `p3.spec.ts` — verifies the Admin ingestion dashboard (cards, sources table, runs table, manual trigger behavior).
- To run Playwright tests:

```bash
cd frontend
npx playwright test --config=playwright.config.ts
```

Playwright browsers must be installed once with:

```bash
npx playwright install --with-deps
```

## Deployment notes

- The frontend builds to static assets in `frontend/dist`. A static server that proxies `/api` requests to the backend is provided at `frontend/tools/static-server.js` for convenience in testing.
- The backend is a Node/TypeScript app; build with `npm run build` and run with `npm run start` (or use a process manager in production). Provide a writable path for the SQLite DB file.

## Responsible Arbeitnow API usage

- This workspace used the Arbeitnow public job feed during development and testing. Be considerate of external API usage limits: do not run ingestion in tight loops; use the backend rate limiting already implemented; cache responses where appropriate.

## Known limitations

- No automated unit tests are present in the frontend project; verification is performed via Playwright E2E tests and backend scripted tests.
- The admin dashboard run trigger is manual and lightly polled in the UI; it is functional but intentionally simple.
- No CI/CD or deployment pipeline included; CI configuration is out of scope for this workspace.

## P0–P3 verification results (actual)

- P0 — Backend core APIs & ingestion: PASS (automated API script passed)
- P1 — Backend serving real data & ingestion pipeline: PASS (ingestion run lifecycle observed; run metrics recorded)
- P2 — Frontend features (Home, Jobs, Filters, Pagination, Job Details, responsive): PASS (Playwright tests passed)
- P3 — Admin/ingestion observability dashboard: PASS (Playwright tests passed)

## Final build & verification commands (what I ran)

```bash
# Backend build
cd backend && npm run build

# Frontend optimized build
cd frontend && npx ng build

# Serve optimized build for E2E (proxies /api -> http://localhost:3000)
node frontend/tools/static-server.js

# Run Playwright E2E tests
cd frontend && npx playwright test --config=playwright.config.ts --reporter=list
```

---

If you want, I can now update `README` with a short troubleshooting section, add example curl responses, or prepare commit/PR metadata. I will not commit or create a PR until you ask.
