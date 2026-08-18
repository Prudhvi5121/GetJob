import fs from 'fs';
import path from 'path';
import { fetchFromArbeitnowWithRetries } from '../ingest/pipeline';

const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const CACHE_PATH = path.join(DATA_DIR, 'cache_arbeitnow.json');

async function main() {
  // Ensure cache exists
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify([{ slug: 'cached1', title: 'Cached', description: '', company_name: 'CacheCo', remote: false }], null, 2));

  // Mock fetch to always throw
  const realFetch = (globalThis as any).fetch;
  (globalThis as any).fetch = async () => { throw new Error('permanent network failure'); };

  try {
    const res = await fetchFromArbeitnowWithRetries({ maxAttempts: 3, backoffMs: 10 });
    console.log('Cache fallback result:', { attempts: res.attempts, usedCache: res.usedCache, itemsLen: res.items.length });
    if (!res.usedCache) {
      console.error('Expected usedCache=true but got false');
      process.exitCode = 3;
    }
  } catch (err) {
    console.error('Test failed unexpectedly:', err);
    process.exitCode = 2;
  } finally {
    (globalThis as any).fetch = realFetch;
  }
}

if (require.main === module) main();
