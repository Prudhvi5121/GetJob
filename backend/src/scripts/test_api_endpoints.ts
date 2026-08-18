import app from '../app';

async function main() {
  const server = app.listen(0);
  const port = (server.address() as any).port;
  const base = `http://127.0.0.1:${port}`;
  console.log('Started test server on', base);

  const resJobs = await fetch(`${base}/api/jobs`);
  console.log('/api/jobs', resJobs.status);
  const jobsJson = await resJobs.json();
  console.log('jobs count sample:', jobsJson.meta?.total ?? jobsJson.data?.length);

  const resSources = await fetch(`${base}/api/sources`);
  console.log('/api/sources', resSources.status);

  const resHealth = await fetch(`${base}/api/health`);
  console.log('/api/health', resHealth.status);

  const resRuns = await fetch(`${base}/api/ingestion/runs`);
  console.log('/api/ingestion/runs', resRuns.status);

  // Trigger ingestion run (rate-limited) — first should pass
  const resTrigger = await fetch(`${base}/api/ingestion/run`, { method: 'POST' });
  console.log('POST /api/ingestion/run', resTrigger.status);

  server.close();
}

if (require.main === module) main();
