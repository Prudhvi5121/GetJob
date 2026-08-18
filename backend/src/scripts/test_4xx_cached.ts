import fs from 'fs';
import path from 'path';
import { fetchFromArbeitnowWithRetries } from '../ingest/pipeline';

const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const CACHE_PATH = path.join(DATA_DIR, 'cache_arbeitnow.json');

async function main() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify([{ slug: 'cached1', title: 'Cached', description: '', company_name: 'CacheCo', remote: false }], null, 2));

  // Mock fetch to return 404
  const realFetch = (globalThis as any).fetch;
  (globalThis as any).fetch = async () => ({ ok: false, status: 404, json: async () => ({}) });

  try {
    const res = await fetchFromArbeitnowWithRetries({ maxAttempts: 3, backoffMs: 10 });
    console.log('4xx cached test:', { attempts: res.attempts, usedCache: res.usedCache, itemsLen: res.items.length });
    if (res.attempts !== 1) {
      console.error('Expected attempts=1 for 4xx non-retry behavior');
      process.exitCode = 3;
    }
    if (!res.usedCache) {
      console.error('Expected usedCache=true when cache exists');
      process.exitCode = 4;
    }
  } catch (err) {
    console.error('Test failed unexpectedly:', err);
    process.exitCode = 2;
  } finally {
    (globalThis as any).fetch = realFetch;
  }
}

if (require.main === module) main();
