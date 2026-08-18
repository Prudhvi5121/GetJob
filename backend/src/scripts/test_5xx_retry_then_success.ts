import { fetchFromArbeitnowWithRetries } from '../ingest/pipeline';

async function main() {
  // Mock fetch to return 500 twice then 200
  let calls = 0;
  const realFetch = (globalThis as any).fetch;
  (globalThis as any).fetch = async () => {
    calls++;
    if (calls <= 2) return { ok: false, status: 500, json: async () => ({}) } as any;
    return { ok: true, json: async () => [{ slug: 's1', title: 'T', description: '', company_name: 'C', remote: false }] } as any;
  };

  try {
    const res = await fetchFromArbeitnowWithRetries({ maxAttempts: 3, backoffMs: 10 });
    console.log('5xx retry-success test:', { attempts: res.attempts, usedCache: res.usedCache, itemsLen: res.items.length });
    if (res.usedCache) {
      console.error('Expected usedCache=false for successful fetch');
      process.exitCode = 4;
    }
    if (res.attempts !== 3) {
      console.error('Expected attempts=3');
      process.exitCode = 5;
    }
  } catch (err) {
    console.error('Test failed unexpectedly:', err);
    process.exitCode = 2;
  } finally {
    (globalThis as any).fetch = realFetch;
  }
}

if (require.main === module) main();
