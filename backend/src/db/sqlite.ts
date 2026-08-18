const Database = require('better-sqlite3');
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'jobs.db');
const db = new Database(DB_PATH);

// Initialize schema
db.exec(`
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY,
  source TEXT NOT NULL,
  source_job_id TEXT,
  fingerprint TEXT,
  title TEXT,
  company_name TEXT,
  location TEXT,
  remote INTEGER,
  description TEXT,
  url TEXT,
  created_at TEXT,
  created_at_unix INTEGER,
  tags TEXT,
  job_types TEXT,
  inserted_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_source_sourcejobid ON jobs(source, source_job_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_source_fingerprint ON jobs(source, fingerprint);

CREATE TABLE IF NOT EXISTS runs (
  id INTEGER PRIMARY KEY,
  source TEXT,
  started_at TEXT,
  finished_at TEXT,
  fetched_count INTEGER,
  validated_count INTEGER,
  normalized_count INTEGER,
  inserted_count INTEGER,
  updated_count INTEGER,
  duplicate_count INTEGER,
  invalid_count INTEGER,
  error TEXT
);

CREATE TABLE IF NOT EXISTS source_health (
  id INTEGER PRIMARY KEY,
  source TEXT UNIQUE,
  last_checked TEXT,
  healthy INTEGER,
  last_error TEXT,
  consecutive_failures INTEGER DEFAULT 0,
  last_success_at TEXT
);
`);

export default db;
