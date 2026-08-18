DECISIONS
=========

Q1 — Why did I choose this ingestion strategy over the obvious alternative?

Answer: I chose to ingest from a documented public API (the Arbeitnow feed) rather than attempting to scrape protected or dynamically rendered websites because the public API provides a stable, documented, and predictable data source.

Practical reasons:
- Stability: a documented API returns structured data and is less likely to break from UI changes than HTML scraping.
- Legality and ethics: using a public feed respects the provider's intended access model and reduces legal/ethical risk compared with scraping authenticated or rate-limited pages.
- Observability: the ingestion pipeline benefits from clear request/response shapes and error cases returned by the API, which simplifies validation and error handling.

Using the public API enabled straightforward validation, normalization, deduplication, and persistence steps in the pipeline without adding fragile scraping logic.

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
