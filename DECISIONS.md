# GetJob: Acdyon Technologies Engineering Challenge, Part 1

## 1. Detection Surface

GetJob uses Arbeitnow's documented public job API as its primary source. It does not attempt to bypass CAPTCHA, authentication, bot protection, rate limits, or access controls, and it does not probe protected production job boards.

The responsible approach is to identify a supported API/feed, inspect its actual response contract, validate incoming data, normalize it into the application's canonical shape, handle failures, respect source limitations, and persist only data returned by the source. This avoids pretending that protected-platform scraping is part of the implementation.

## 2. Ingestion Strategy

The implemented pipeline is:

`fetch -> validate -> normalize -> deduplicate -> persist -> record run statistics`

- `JobSourceAdapter` defines the source boundary. `ArbeitnowJobSource` implements it and requests `https://arbeitnow.com/api/job-board-api`.
- The Arbeitnow response shape was inspected before defining the Zod schemas for the response and job fields.
- Zod validates both the response envelope in the adapter and individual items in `ingest/validate.ts`. Invalid items are counted and excluded from normalization.
- `ingest/normalize.ts` maps valid records to canonical fields, converts the Unix timestamp to ISO time, and preserves tags and job types.
- `persist/store.ts` deduplicates primarily on `(source, source_job_id)`. If no source job ID exists, it uses a SHA-256 fingerprint of title, company, and location as the fallback.
- SQLite stores jobs, ingestion runs, and source health. The actual run table is `runs`; it records source, timestamps, fetched, validated, normalized, inserted, updated, duplicate, invalid, and error values. There is no separate `source_runs` table.
- The ingestion code writes the latest successful raw response to `backend/data/cache_arbeitnow.json` and records cache use in run statistics.
- The API ingestion trigger is rate-limited per client IP. Immediate repeated calls return HTTP 429.
- Errors are recorded in the run row; API failures use safe error responses rather than exposing stack traces to clients.

## 3. Resilience

`fetchFromArbeitnowWithRetries` allows up to three attempts. Network errors and 5xx responses are treated as transient and retried with exponential backoff of 500ms, then 1s. 4xx responses are treated as non-transient and stop retrying early.

- If the API succeeds, the response is cached, source health is marked healthy, and valid normalized jobs are upserted.
- If some records fail validation, valid records continue through the pipeline and the invalid count is recorded.
- If a transient fetch failure continues, or a non-transient fetch fails, the pipeline uses the last-known-good cache when available and records the fetch error and cache use.
- If fetching fails and no cache is available, the run is finished with an error and the ingestion operation fails.
- `source_health` stores healthy state, last check, last error, consecutive failures, and last success time. Cache fallback is available; it is not presented as fresh source data.

## 4. Where I Would Stop

If a platform requires bypassing CAPTCHA, authentication, bot protection, rate limits, or other access controls, I would stop rather than attempt to defeat those controls.

The alternatives are an official API, a documented RSS/feed, a licensed data source, or a sandbox/source that I control. GetJob intentionally uses a supported public API instead of scraping protected production job boards.

## 5. What Was Cut / Not Implemented

This repository intentionally does not implement:

- Protected-site scraping or access-control bypasses.
- LinkedIn, Indeed, Naukri, or other protected-platform integrations.
- A second job-source adapter.
- User authentication or authorization.
- PostgreSQL migration.
- CI/CD or deployment automation.
- P4 features.

These omissions are deliberate scope and responsible-data boundaries, not hidden implementation claims.

## 6. AI Usage

AI tools were used during development for code suggestions, debugging, UI iteration, test assistance, and documentation assistance. The implementation was reviewed, tested, modified, and verified by the developer. The project does not claim that every line was authored from scratch without AI assistance.

## 7. Verification

The following verification was performed against the repository:

- Backend TypeScript build: `cd backend && npm run build` passed.
- Frontend production build: `cd frontend && npm run build` passed.
- Backend automated API script: `npx ts-node --transpile-only src/scripts/test_api_automated.ts` passed, including API, ingestion trigger, and 429 rate-limit checks.
- Playwright E2E suite: `cd frontend && npm run e2e` passed with 8 tests.
- P0-P3 behavior was covered through ingestion/API checks, discovery, details, filters, pagination, loading/error states, responsive checks, and the admin dashboard.
- Responsive overflow checks passed at 390px, 768px, and 1440px.

## 8. Interview Defensibility

Each decision follows the same boundary: use a supported source, validate what it actually returns, make failures observable, retain last-known-good data only when explicitly marked as cached, and stop where access controls would need to be defeated. The implementation is intentionally small enough to trace from source fetch through persistence and API exposure.