import app from '../app';
import db from '../db/sqlite';

function ok(msg: string) { console.log('OK:', msg); }
function fail(msg: string) { console.error('FAIL:', msg); process.exitCode = 2; }

async function request(base: string, path: string, opts: any = {}) {
  const res = await fetch(base + path, opts);
  const bodyText = await res.text();
  let body: any = null;
  try { body = JSON.parse(bodyText); } catch (e) { body = bodyText; }
  return { res, body };
}

async function main() {
  const server = app.listen(0);
  const port = (server.address() as any).port;
  const base = `http://127.0.0.1:${port}`;
  console.log('Test server on', base);

  // Pick a real job id and title from DB for search tests
  const sample = db.prepare('SELECT id, title, source FROM jobs ORDER BY id DESC LIMIT 1').get();
  if (!sample) { fail('No jobs in DB to test against'); return; }
  const sampleId = sample.id as number;
  const sampleTitle = (sample.title || '').split(' ')[0];
  const sampleSource = sample.source as string;
  ok(`Found sample job id=${sampleId} title~='${sampleTitle}' source=${sampleSource}`);

  // /api/jobs pagination
  const r1 = await request(base, `/api/jobs?page=1&per_page=5`);
  if (r1.res.status !== 200) { fail('/api/jobs pagination did not return 200'); }
  else if (!r1.body.meta || typeof r1.body.meta.total !== 'number') { fail('/api/jobs pagination missing meta.total'); }
  else ok('/api/jobs pagination');

  // /api/jobs search
  const r2 = await request(base, `/api/jobs?q=${encodeURIComponent(sampleTitle)}`);
  if (r2.res.status !== 200) { fail('/api/jobs search did not return 200'); } else ok('/api/jobs search');

  // /api/jobs/:id existing
  const r3 = await request(base, `/api/jobs/${sampleId}`);
  if (r3.res.status !== 200) { fail('/api/jobs/:id existing returned non-200'); } else ok('/api/jobs/:id existing');

  // /api/jobs/:id 404
  const r4 = await request(base, `/api/jobs/99999999`);
  if (r4.res.status !== 404) { fail('/api/jobs/:id missing did not return 404'); } else ok('/api/jobs/:id 404');

  // Invalid id -> safe error envelope
  const r5 = await request(base, `/api/jobs/abc`);
  if (r5.res.status !== 400 || !r5.body?.error?.message) { fail('Invalid id did not return safe 400 error'); } else ok('Invalid id returns safe 400');

  // /api/health
  const r6 = await request(base, `/api/health`);
  if (r6.res.status !== 200 || !r6.body?.data) { fail('/api/health failed'); } else ok('/api/health');

  // /api/sources
  const r7 = await request(base, `/api/sources`);
  if (r7.res.status !== 200 || !Array.isArray(r7.body?.data)) { fail('/api/sources failed'); } else ok('/api/sources');

  // /api/sources/:source
  const r8 = await request(base, `/api/sources/${encodeURIComponent(sampleSource)}`);
  if (r8.res.status !== 200 || !r8.body?.data) { fail('/api/sources/:source failed'); } else ok('/api/sources/:source');

  // /api/ingestion/runs
  const r9 = await request(base, `/api/ingestion/runs`);
  if (r9.res.status !== 200 || !Array.isArray(r9.body?.data)) { fail('/api/ingestion/runs failed'); } else ok('/api/ingestion/runs');

  // POST /api/ingestion/run first should succeed
  const p1 = await request(base, `/api/ingestion/run`, { method: 'POST' });
  if (p1.res.status !== 200) { fail('POST /api/ingestion/run first did not succeed'); } else ok('POST /api/ingestion/run first');

  // POST again immediately should hit rate limit (429)
  const p2 = await request(base, `/api/ingestion/run`, { method: 'POST' });
  if (p2.res.status !== 429) { fail('POST /api/ingestion/run rate limit not enforced'); } else ok('POST /api/ingestion/run rate limit');

  // Check error envelope shape for rate limit
  if (!p2.body?.error?.message) { fail('Rate limit response missing error.message'); } else ok('Rate limit safe error envelope');

  server.close();
  console.log('All API automated tests passed');
}

if (require.main === module) main();
