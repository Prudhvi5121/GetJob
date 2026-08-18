import { fetchFromArbeitnow } from '../ingest/pipeline';

async function main() {
  try {
    console.log('Running fetch stage: Arbeitnow');
    const items = await fetchFromArbeitnow();
    console.log(`Fetched ${items.length} items`);
    console.log('Sample item keys:', Object.keys(items[0] || {}).join(', '));
    // Print first 2 items (trim long description)
    const sample = items.slice(0, 2).map((it) => ({
      slug: it.slug,
      company_name: it.company_name,
      title: it.title,
      location: it.location,
      remote: it.remote,
      url: it.url,
      created_at: it.created_at,
      description_preview: (it.description || '').slice(0, 200),
    }));
    console.log(JSON.stringify(sample, null, 2));
  } catch (err) {
    console.error('Fetch stage failed:', err);
    process.exitCode = 1;
  }
}

if (require.main === module) main();
