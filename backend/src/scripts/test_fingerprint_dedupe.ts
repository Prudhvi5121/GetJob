import { fingerprintFor, upsertJob } from '../persist/store';
import db from '../db/sqlite';

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exitCode = 2;
    throw new Error(msg);
  }
  console.log('OK:', msg);
}

async function main() {
  // Deterministic fingerprint
  const a: any = { title: 'Title A', company_name: 'Company', location: 'Remote' };
  const b: any = { title: 'Title A', company_name: 'Company', location: 'Remote' };
  const c: any = { title: 'Title B', company_name: 'Company', location: 'Remote' };
  const f1 = fingerprintFor(a);
  const f2 = fingerprintFor(b);
  const f3 = fingerprintFor(c);
  assert(f1 === f2, 'identical jobs produce same fingerprint');
  assert(f1 !== f3, 'different jobs produce different fingerprints');

  // Test source+source_job_id uniqueness (insert then update)
  const src = 'test_source';
  const job1: any = { source: src, source_job_id: 's-1', title: 'T1', company_name: 'C1', location: 'L1', remote: false };
  const r1 = upsertJob(job1);
  assert(r1.action === 'inserted', 'upsert inserts when new (source+source_job_id)');
  const r2 = upsertJob({ ...job1, title: 'T1-mod' });
  assert(r2.action === 'updated', 'upsert updates when source+source_job_id exists');

  // Test fingerprint dedupe: no source_job_id, same fingerprint -> duplicate
  const src2 = 'test_source_fp';
  const jobA: any = { source: src2, title: 'X', company_name: 'Y', location: 'Z', remote: false };
  const jobB: any = { source: src2, title: 'X', company_name: 'Y', location: 'Z', remote: false };
  const jobC: any = { source: src2, title: 'X2', company_name: 'Y', location: 'Z', remote: false };
  const rA = upsertJob(jobA);
  assert(rA.action === 'inserted', 'fingerprint: first insert');
  const rB = upsertJob(jobB);
  assert(rB.action === 'duplicate', 'fingerprint: identical job deduped as duplicate');
  const rC = upsertJob(jobC);
  assert(rC.action === 'inserted', 'fingerprint: different job inserted');

  // Cleanup test rows
  try {
    db.prepare('DELETE FROM jobs WHERE source IN (?, ?)').run(src, src2);
    console.log('Cleaned up test rows');
  } catch (e) {
    console.warn('Cleanup failed:', e);
  }

  console.log('Fingerprint & dedupe tests passed');
}

if (require.main === module) main();
