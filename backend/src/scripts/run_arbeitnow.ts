import ArbeitnowJobSource from '../adapters/arbeitnow';

async function run() {
  const src = new ArbeitnowJobSource();
  try {
    const status = await src.getSourceStatus();
    // eslint-disable-next-line no-console
    console.log('Source status:', status);
    const jobs = await src.fetchJobs();
    // eslint-disable-next-line no-console
    console.log(`Fetched ${jobs.length} jobs. Example:`, jobs[0] ?? null);
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('Error fetching Arbeitnow:', err?.message ?? err);
    process.exitCode = 2;
  }
}

run();
