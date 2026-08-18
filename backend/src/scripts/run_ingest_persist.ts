import { fetchFromArbeitnowWithRetries } from '../ingest/pipeline';
import { validateArbeitnowItems } from '../ingest/validate';
import { normalizeArbeitnowItems } from '../ingest/normalize';
import { recordRunStart, recordRunFinish, upsertJob } from '../persist/store';
import { recordSourceHealth } from '../persist/store';

export async function runIngest() {
  const source = 'arbeitnow';
  const runId = recordRunStart(source);
  const stats: any = { fetched_count: 0, validated_count: 0, normalized_count: 0, inserted_count: 0, updated_count: 0, duplicate_count: 0, invalid_count: 0 };

  try {
    const fetchRes = await fetchFromArbeitnowWithRetries({ maxAttempts: 3 });
    const items = fetchRes.items;
    stats.fetched_count = items.length;
    stats.attempts = fetchRes.attempts;
    stats.used_cache = !!fetchRes.usedCache;
    if (fetchRes.usedCache) stats.error = fetchRes.lastError;

    // record source health based on whether cache was used or fetch succeeded
    recordSourceHealth(source, !fetchRes.usedCache, new Date().toISOString(), fetchRes.usedCache ? fetchRes.lastError : undefined);
    const { valid, invalid } = validateArbeitnowItems(items as unknown[]);
    stats.validated_count = valid.length + invalid.length;
    stats.invalid_count = invalid.length;
    const normalized = normalizeArbeitnowItems(valid as any);
    stats.normalized_count = normalized.length;

    for (const job of normalized) {
      const res = upsertJob(job as any);
      if (res.action === 'inserted') stats.inserted_count++;
      else if (res.action === 'updated') stats.updated_count++;
      else if (res.action === 'duplicate') stats.duplicate_count++;
    }

    recordRunFinish(runId, stats);
    console.log('Persist stage complete', stats);
  } catch (err:any) {
    stats.error = String(err?.stack || err);
    recordRunFinish(runId, stats);
    console.error('Persist stage failed:', err);
    process.exitCode = 1;
  }
  return stats;
}

async function main() {
  await runIngest();
}

if (require.main === module) main();
