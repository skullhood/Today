import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('today.db');

export function initDb() {
  db.execSync(`PRAGMA journal_mode = WAL`);
  db.execSync(`PRAGMA foreign_keys = ON`);
  db.execSync(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT NOT NULL,
      description TEXT,
      schedule TEXT NOT NULL,
      required_count INTEGER NOT NULL DEFAULT 1,
      reset_hour INTEGER NOT NULL DEFAULT 0,
      type TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
  try { db.execSync(`ALTER TABLE tasks ADD COLUMN description TEXT`); } catch { /* already exists */ }
  try { db.execSync(`ALTER TABLE tasks ADD COLUMN retired_at TEXT`); } catch { /* already exists */ }
  try { db.execSync(`ALTER TABLE tasks ADD COLUMN reset_minute INTEGER NOT NULL DEFAULT 0`); } catch { /* already exists */ }
  try { db.execSync(`ALTER TABLE tasks ADD COLUMN alarm_settings TEXT`); } catch { /* already exists */ }
  db.execSync(`
    CREATE TABLE IF NOT EXISTS completions (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      completed_at TEXT NOT NULL,
      data TEXT
    )
  `);
}
