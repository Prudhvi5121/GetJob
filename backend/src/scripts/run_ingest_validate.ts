import { fetchFromArbeitnow } from '../ingest/pipeline';
import { validateArbeitnowItems } from '../ingest/validate';

async function main() {
  try {
    console.log('Running validate stage: fetch → validate (Arbeitnow)');
    const items = await fetchFromArbeitnow();
    console.log(`Fetched ${items.length} items`);
    const { valid, invalid } = validateArbeitnowItems(items as unknown[]);
    console.log(`Valid items: ${valid.length}`);
    console.log(`Invalid items: ${invalid.length}`);
    if (invalid.length > 0) {
      console.log('Sample invalid error formats:');
      console.log(JSON.stringify(invalid.slice(0, 3).map((i) => i.error), null, 2));
    }
    console.log('Sample valid item keys:', Object.keys(valid[0] || {}).join(', '));
  } catch (err) {
    console.error('Validate stage failed:', err);
    process.exitCode = 1;
  }
}

if (require.main === module) main();
