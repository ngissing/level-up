import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { ROOT_DIR } from './html.js';

const file = process.env.DB_FILE || path.join(ROOT_DIR, 'data', 'levelup.db');
mkdirSync(path.dirname(file), { recursive: true });

export const db = new DatabaseSync(file);
db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student','teacher','admin')),
  password_hash TEXT NOT NULL,
  class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
  must_change_pw INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  last_login TEXT
);

-- Teachers can look after several classes.
CREATE TABLE IF NOT EXISTS class_teachers (
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (class_id, user_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

-- status: started -> submitted -> complete (or back to started if sent back)
CREATE TABLE IF NOT EXISTS progress (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'started',
  steps TEXT NOT NULL DEFAULT '[]',
  quiz_best INTEGER,
  quiz_total INTEGER,
  reflection TEXT,
  level_up INTEGER DEFAULT 0,
  teacher_comment TEXT,
  signed_off_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  started_at TEXT DEFAULT (datetime('now')),
  submitted_at TEXT,
  completed_at TEXT,
  PRIMARY KEY (user_id, skill_id)
);

CREATE TABLE IF NOT EXISTS badges (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  awarded_at TEXT DEFAULT (datetime('now')),
  seen INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
INSERT OR IGNORE INTO settings (key, value) VALUES ('require_signoff', '1');
INSERT OR IGNORE INTO settings (key, value) VALUES ('quiz_pass_percent', '60');
INSERT OR IGNORE INTO settings (key, value) VALUES ('skip_unwritten', '0');
`);

// Migrations for databases created by earlier versions.
const cols = (t) => db.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name);
if (!cols('users').includes('reading_level')) db.exec("ALTER TABLE users ADD COLUMN reading_level TEXT NOT NULL DEFAULT 'core'");

export const getSetting = (k) => db.prepare('SELECT value FROM settings WHERE key = ?').get(k)?.value;
export const setSetting = (k, v) =>
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(k, String(v));
