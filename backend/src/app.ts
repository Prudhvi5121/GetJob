import express from 'express';
import db from './db/sqlite';
import { z } from 'zod';
import { runIngest } from './scripts/run_ingest_persist';
import { recordRunStart } from './persist/store';

const app = express();
app.use(express.json());

// Simple error envelope
function errorEnvelope(res: any, status: number, message: string) {
  return res.status(status).json({ error: { message } });
}

// Rate limiter for ingestion trigger: max 1 per minute per IP
const rateMap = new Map<string, { lastTs: number }>();
function checkRate(ip: string) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.lastTs > 60_000) {
    rateMap.set(ip, { lastTs: now });
    return true;
  }
  return false;
}

// Zod schemas
const JobsQuery = z.object({
  q: z.string().optional(),
  source: z.string().optional(),
  tags: z.string().optional(),
  job_types: z.string().optional(),
  location: z.string().optional(),
  remote: z.union([z.literal('0'), z.literal('1'), z.boolean()]).optional(),
  page: z.preprocess((v) => Number(v), z.number().int().min(1).default(1)),
  per_page: z.preprocess((v) => Number(v), z.number().int().min(1).max(100).default(20)),
});

app.get('/api/jobs', (req, res) => {
  let q: any, source: any, tags: any, job_types: any, location: any, remote: any, page: number, per_page: number;
  try {
    const parsed = JobsQuery.parse(req.query);
    q = parsed.q; source = parsed.source; tags = parsed.tags; job_types = parsed.job_types; location = parsed.location; remote = parsed.remote; page = parsed.page; per_page = parsed.per_page;
  } catch (_e) {
    // Fallback defaults
    q = (req.query.q as any) || undefined;
    source = (req.query.source as any) || undefined;
    tags = (req.query.tags as any) || undefined;
    job_types = (req.query.job_types as any) || undefined;
    location = (req.query.location as any) || undefined;
    remote = req.query.remote as any;
    page = req.query.page ? Number(req.query.page) || 1 : 1;
    per_page = req.query.per_page ? Number(req.query.per_page) || 20 : 20;
  }

  // Build SQL dynamically but safely
  const where: string[] = [];
  const params: any[] = [];
  if (q) {
    where.push('(title LIKE ? OR company_name LIKE ? OR description LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  if (source) { where.push('source = ?'); params.push(source); }
  if (location) { where.push('location LIKE ?'); params.push(`%${location}%`); }
  if (remote !== undefined) { const rv = remote === '1' || remote === true ? 1 : 0; where.push('remote = ?'); params.push(rv); }
  if (tags) { where.push('tags LIKE ?'); params.push(`%"${tags}"%`); }
  if (job_types) { where.push('job_types LIKE ?'); params.push(`%"${job_types}"%`); }

  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const totalRow = db.prepare(`SELECT COUNT(*) as cnt FROM jobs ${whereSql}`).get(...params) as any;
  const total = totalRow.cnt as number;
  const offset = (page - 1) * per_page;
  const rows = db.prepare(`SELECT * FROM jobs ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, per_page, offset);
  return res.json({ data: rows, meta: { total, page, per_page } });
});

app.get('/api/jobs/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!id) return errorEnvelope(res, 400, 'Invalid id');
  const row = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
  if (!row) return errorEnvelope(res, 404, 'Not found');
  return res.json({ data: row });
});

app.get('/api/health', (req, res) => {
  // Return app health and source_health
  const sources = db.prepare('SELECT * FROM source_health').all();
  const lastRun = db.prepare('SELECT * FROM runs ORDER BY id DESC LIMIT 1').get();
  return res.json({ data: { ok: true, sources, lastRun } });
});

app.get('/api/sources', (req, res) => {
  const rows = db.prepare('SELECT source, COUNT(*) as cnt FROM jobs GROUP BY source').all();
  return res.json({ data: rows });
});

app.get('/api/sources/:source', (req, res) => {
  const source = req.params.source;
  const health = db.prepare('SELECT * FROM source_health WHERE source = ?').get(source);
  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM jobs WHERE source = ?').get(source) as any;
  return res.json({ data: { health, count: countRow.cnt } });
});

const RunsQuery = z.object({ page: z.preprocess((v) => Number(v), z.number().int().min(1).default(1)), per_page: z.preprocess((v) => Number(v), z.number().int().min(1).max(100).default(20)) });
app.get('/api/ingestion/runs', (req, res) => {
  let page = 1; let per_page = 20;
  try {
    const parsed = RunsQuery.parse(req.query);
    page = parsed.page; per_page = parsed.per_page;
  } catch (_e) {
    page = req.query.page ? Number(req.query.page) || 1 : 1;
    per_page = req.query.per_page ? Number(req.query.per_page) || 20 : 20;
  }
  const total = db.prepare('SELECT COUNT(*) as cnt FROM runs').get().cnt as number;
  const rows = db.prepare('SELECT * FROM runs ORDER BY id DESC LIMIT ? OFFSET ?').all(per_page, (page - 1) * per_page);
  return res.json({ data: rows, meta: { total, page, per_page } });
});

app.post('/api/ingestion/run', async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRate(ip)) return errorEnvelope(res, 429, 'Rate limit exceeded');
  try {
    const stats = await runIngest();
    return res.json({ data: { stats } });
  } catch (err:any) {
    return errorEnvelope(res, 500, 'Ingestion failed');
  }
});

// Basic error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error', err);
  return errorEnvelope(res, 500, 'Internal Server Error');
});

export default app;
