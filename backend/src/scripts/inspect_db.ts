import db from '../db/sqlite';

function getLatestRun() {
  return db.prepare('SELECT * FROM runs ORDER BY id DESC LIMIT 1').get();
}

function getJobCounts() {
  const total = db.prepare('SELECT COUNT(*) as cnt FROM jobs').get().cnt as number;
  const bySource = db.prepare('SELECT source, COUNT(*) as cnt FROM jobs GROUP BY source').all();
  const withSourceJobId = db.prepare('SELECT COUNT(*) as cnt FROM jobs WHERE source_job_id IS NOT NULL').get().cnt as number;
  const withFingerprint = db.prepare('SELECT COUNT(*) as cnt FROM jobs WHERE source_job_id IS NULL AND fingerprint IS NOT NULL').get().cnt as number;
  return { total, bySource, withSourceJobId, withFingerprint };
}

function getSampleJobs(limit = 5) {
  return db.prepare('SELECT id, source, source_job_id, fingerprint, title, company_name, location, remote, created_at, created_at_unix, tags, job_types FROM jobs ORDER BY id DESC LIMIT ?').all(limit);
}

function assertEqual(a: any, b: any, label: string) {
  if (a !== b) {
    console.warn(`MISMATCH: ${label}: expected=${b} actual=${a}`);
    return false;
  }
  console.log(`OK: ${label} = ${a}`);
  return true;
}

function main() {
  const run = getLatestRun();
  if (!run) {
    console.error('No runs found in DB');
    process.exit(2);
  }

  console.log('Latest run:', run);

  const counts = getJobCounts();
  console.log('Job counts summary:', counts);

  // Consistency checks (allowing for prior runs):
  // 1) validated_count == normalized_count + invalid_count
  // 2) normalized_count == inserted_count + updated_count + duplicate_count
  let allOk = true;
  allOk = assertEqual(run.validated_count, run.normalized_count + run.invalid_count, 'validated_count == normalized + invalid') && allOk;
  allOk = assertEqual(run.normalized_count, (run.inserted_count || 0) + (run.updated_count || 0) + (run.duplicate_count || 0), 'normalized_count == inserted + updated + duplicate') && allOk;
  // Basic bounds
  if (run.fetched_count < run.validated_count) {
    console.warn(`MISMATCH: fetched_count (${run.fetched_count}) < validated_count (${run.validated_count})`);
    allOk = false;
  } else {
    console.log(`OK: fetched_count >= validated_count (${run.fetched_count} >= ${run.validated_count})`);
  }

  // Basic consistency checks
  if (counts.total < run.inserted_count) {
    console.warn(`Total jobs (${counts.total}) is less than inserted_count (${run.inserted_count})`);
    allOk = false;
  } else {
    console.log(`Total jobs (${counts.total}) >= inserted_count (${run.inserted_count})`);
  }

  // Check source-specific count for 'arbeitnow' if present
  const arbeitnowRow = counts.bySource.find((r: any) => r.source === run.source);
  if (arbeitnowRow) {
    console.log(`Jobs for source '${run.source}': ${arbeitnowRow.cnt}`);
  }

  // Show samples
  const samples = getSampleJobs(5);
  console.log('Sample jobs (latest 5):');
  for (const s of samples) {
    console.log({
      id: s.id,
      source: s.source,
      source_job_id: s.source_job_id,
      fingerprint: s.fingerprint,
      title: s.title,
      company_name: s.company_name,
      location: s.location,
      remote: s.remote,
      created_at: s.created_at,
      created_at_unix: s.created_at_unix,
      tags: s.tags,
      job_types: s.job_types,
    });
  }

  if (!allOk) {
    console.error('Verification checks failed. See mismatches above.');
    process.exitCode = 3;
  } else {
    console.log('All verification checks passed.');
  }
}

if (require.main === module) main();
