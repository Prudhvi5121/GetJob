import ArbeitnowJobSource, { ArbeitnowRaw } from '../adapters/arbeitnow';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const CACHE_PATH = path.join(DATA_DIR, 'cache_arbeitnow.json');

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function fetchFromArbeitnow(): Promise<ArbeitnowRaw[]> {
  const src = new ArbeitnowJobSource();
  return src.fetchJobs();
}

export async function fetchFromArbeitnowWithRetries(opts?: { maxAttempts?: number; backoffMs?: number }): Promise<{ items: ArbeitnowRaw[]; attempts: number; usedCache: boolean; lastError?: string }> {
  const maxAttempts = opts?.maxAttempts || 3;
  const baseBackoff = opts?.backoffMs || 500;
  const src = new ArbeitnowJobSource();
  let lastErr: any = null;
  let nonTransient = false;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const items = await src.fetchJobs();
      // write cache
      try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(CACHE_PATH, JSON.stringify(items, null, 2), 'utf8');
      } catch (e) {
        // ignore cache write errors
      }
      return { items, attempts: attempt, usedCache: false };
    } catch (err:any) {
      lastErr = err;
      // If we have a FetchError and it's non-transient, stop retrying early
      if (err && typeof err.isTransient === 'boolean' && err.isTransient === false) {
        nonTransient = true;
        break;
      }
      // If we have an attached status in a plain error (backcompat), treat 4xx as non-transient
      if (err && typeof err.status === 'number' && err.status >= 400 && err.status < 500) {
        nonTransient = true;
        break;
      }
      // transient — wait and retry
      if (attempt < maxAttempts) {
        const wait = baseBackoff * Math.pow(2, attempt - 1);
        await sleep(wait);
        continue;
      }
    }
  }

  // All attempts failed — try cached data
  try {
    if (fs.existsSync(CACHE_PATH)) {
      const raw = fs.readFileSync(CACHE_PATH, 'utf8');
      const items = JSON.parse(raw) as ArbeitnowRaw[];
      // If we had a non-transient error (4xx), attempts may have been less than maxAttempts
      const attemptsUsed = nonTransient ? 1 : maxAttempts;
      return { items, attempts: attemptsUsed, usedCache: true, lastError: String(lastErr?.stack || lastErr) };
    }
  } catch (e) {
    // fall through
  }

  throw lastErr;
}

export default { fetchFromArbeitnow, fetchFromArbeitnowWithRetries };
