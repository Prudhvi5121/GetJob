import db from '../db/sqlite';

function getHealthRows() {
  return db.prepare('SELECT * FROM source_health').all();
}

function getLatestRun() {
  return db.prepare('SELECT * FROM runs ORDER BY id DESC LIMIT 1').get();
}

function main() {
  console.log('Latest run:', getLatestRun());
  console.log('Source health rows:');
  const rows = getHealthRows();
  for (const r of rows) console.log(r);
}

if (require.main === module) main();
