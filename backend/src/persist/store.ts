import db from '../db/sqlite';
import { CanonicalJob } from '../ingest/normalize';
import crypto from 'crypto';

export function fingerprintFor(job: CanonicalJob) {
  const h = crypto.createHash('sha256');
  h.update((job.title || '') + '|' + (job.company_name || '') + '|' + (job.location || ''));
  return h.digest('hex');
}

export function recordRunStart(source = 'arbeitnow') {
  const stmt = db.prepare(`INSERT INTO runs (source, started_at) VALUES (?, datetime('now'))`);
  const info = stmt.run(source);
  return info.lastInsertRowid as number;
}

export function recordRunFinish(runId: number, stats: Partial<Record<string, any>>) {
  const stmt = db.prepare(`UPDATE runs SET finished_at = datetime('now'), fetched_count = @fetched_count, validated_count = @validated_count, normalized_count = @normalized_count, inserted_count = @inserted_count, updated_count = @updated_count, duplicate_count = @duplicate_count, invalid_count = @invalid_count, error = @error WHERE id = @id`);
  stmt.run({ id: runId, fetched_count: stats.fetched_count || 0, validated_count: stats.validated_count || 0, normalized_count: stats.normalized_count || 0, inserted_count: stats.inserted_count || 0, updated_count: stats.updated_count || 0, duplicate_count: stats.duplicate_count || 0, invalid_count: stats.invalid_count || 0, error: stats.error || null });
}

export function recordSourceHealth(source: string, healthy: boolean, lastChecked?: string, lastError?: string) {
  // Upsert into source_health
  const existing = db.prepare('SELECT id, consecutive_failures FROM source_health WHERE source = ?').get(source);
  if (existing) {
    const newConsec = healthy ? 0 : (existing.consecutive_failures || 0) + 1;
    const stmt = db.prepare(`UPDATE source_health SET last_checked = datetime('now'), healthy = @healthy, last_error = @last_error, consecutive_failures = @consec, last_success_at = CASE WHEN @healthy=1 THEN datetime('now') ELSE last_success_at END WHERE id = @id`);
    stmt.run({ id: existing.id, healthy: healthy ? 1 : 0, last_error: lastError || null, consec: newConsec });
  } else {
    const stmt = db.prepare(`INSERT INTO source_health (source, last_checked, healthy, last_error, consecutive_failures, last_success_at) VALUES (?, datetime('now'), ?, ?, ?, ? )`);
    stmt.run(source, healthy ? 1 : 0, lastError || null, healthy ? 0 : 1, healthy ? new Date().toISOString() : null);
  }
}

export function upsertJob(job: CanonicalJob) {
  // Ensure fingerprint
  const fingerprint = job.source_job_id ? null : fingerprintFor(job);

  // Try primary dedupe key: source + source_job_id
  if (job.source_job_id) {
    const sel = db.prepare('SELECT id FROM jobs WHERE source = ? AND source_job_id = ?');
    const existing = sel.get(job.source, job.source_job_id);
    if (existing) {
      const upd = db.prepare(`UPDATE jobs SET title=@title, company_name=@company_name, location=@location, remote=@remote, description=@description, url=@url, created_at=@created_at, created_at_unix=@created_at_unix, tags=@tags, job_types=@job_types, fingerprint=@fingerprint, updated_at=datetime('now') WHERE id=@id`);
      upd.run({
        id: existing.id,
        title: job.title,
        company_name: job.company_name,
        location: job.location,
        remote: job.remote ? 1 : 0,
        description: job.description,
        url: job.url,
        created_at: job.created_at,
        created_at_unix: job.created_at_unix,
        tags: JSON.stringify(job.tags || []),
        job_types: JSON.stringify(job.job_types || []),
        fingerprint: fingerprint,
      });
      return { action: 'updated' as const, id: existing.id };
    }
  }

  // Secondary dedupe: fingerprint
  const fp = fingerprint; // only set when source_job_id was not provided
  if (fp) {
    const sel2 = db.prepare('SELECT id FROM jobs WHERE source = ? AND fingerprint = ?');
    const existing2 = sel2.get(job.source, fp);
    if (existing2) {
      return { action: 'duplicate' as const, id: existing2.id };
    }
  }

  // Insert new
  const ins = db.prepare(`INSERT INTO jobs (source, source_job_id, fingerprint, title, company_name, location, remote, description, url, created_at, created_at_unix, tags, job_types) VALUES (@source, @source_job_id, @fingerprint, @title, @company_name, @location, @remote, @description, @url, @created_at, @created_at_unix, @tags, @job_types)`);
  const info = ins.run({
    source: job.source,
    source_job_id: job.source_job_id || null,
    fingerprint: fingerprint || null,
    title: job.title,
    company_name: job.company_name,
    location: job.location,
    remote: job.remote ? 1 : 0,
    description: job.description,
    url: job.url,
    created_at: job.created_at,
    created_at_unix: job.created_at_unix,
    tags: JSON.stringify(job.tags || []),
    job_types: JSON.stringify(job.job_types || []),
  });
  return { action: 'inserted' as const, id: info.lastInsertRowid as number };
}

export default { fingerprintFor, recordRunStart, recordRunFinish, upsertJob };
