import { fetchFromArbeitnowWithRetries } from '../ingest/pipeline';

async function main() {
  // Mock global fetch to fail twice then succeed
  let calls = 0;
  const realFetch = (globalThis as any).fetch;
  (globalThis as any).fetch = async (...args: any[]) => {
    calls++;
    if (calls <= 2) throw new Error('simulated transient network error');
    return { ok: true, json: async () => [{ slug: 's1', title: 'T', description: '', company_name: 'C', remote: false }] } as any;
  };

  try {
    const res = await fetchFromArbeitnowWithRetries({ maxAttempts: 3, backoffMs: 10 });
    console.log('Test success fetch result:', { attempts: res.attempts, usedCache: res.usedCache, itemsLen: res.items.length });
  } catch (err) {
    console.error('Test failed unexpectedly:', err);
    process.exitCode = 2;
  } finally {
    (globalThis as any).fetch = realFetch;
  }
}

if (require.main === module) main();
