import fs from 'fs';
import path from 'path';
import { fetchFromArbeitnowWithRetries } from '../ingest/pipeline';

const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const CACHE_PATH = path.join(DATA_DIR, 'cache_arbeitnow.json');

async function main() {
  // Ensure no cache
  try { if (fs.existsSync(CACHE_PATH)) fs.unlinkSync(CACHE_PATH); } catch(e) {}

  // Mock fetch to return 404
  const realFetch = (globalThis as any).fetch;
  (globalThis as any).fetch = async () => ({ ok: false, status: 404, json: async () => ({}) });

  try {
    await fetchFromArbeitnowWithRetries({ maxAttempts: 3, backoffMs: 10 });
    console.error('Expected function to throw on 4xx with no cache');
    process.exitCode = 3;
  } catch (err:any) {
    // Expect error to be the original with status 404
    if (err && err.status === 404) {
      console.log('4xx no-cache test: thrown as expected with status 404');
    } else {
      console.error('Unexpected error shape', err);
      process.exitCode = 4;
    }
  } finally {
    (globalThis as any).fetch = realFetch;
  }
}

if (require.main === module) main();
