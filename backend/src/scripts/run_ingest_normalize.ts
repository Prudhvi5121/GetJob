import { fetchFromArbeitnow } from '../ingest/pipeline';
import { validateArbeitnowItems } from '../ingest/validate';
import { normalizeArbeitnowItems } from '../ingest/normalize';

async function main() {
  try {
    console.log('Running normalize stage: fetch → validate → normalize');
    const items = await fetchFromArbeitnow();
    console.log(`Fetched ${items.length} items`);
    const { valid, invalid } = validateArbeitnowItems(items as unknown[]);
    console.log(`Valid: ${valid.length}, Invalid: ${invalid.length}`);
    const normalized = normalizeArbeitnowItems(valid as any);
    console.log(`Normalized ${normalized.length} items`);
    console.log('Sample normalized item keys:', Object.keys(normalized[0] || {}).join(', '));
    console.log('Sample normalized items:', JSON.stringify(normalized.slice(0, 2), null, 2));
  } catch (err) {
    console.error('Normalize stage failed:', err);
    process.exitCode = 1;
  }
}

if (require.main === module) main();
