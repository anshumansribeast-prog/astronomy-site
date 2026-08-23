-- users and sessions — same shape as cosmos-v2's, reused deliberately
-- rather than reinvented (see server/services/auth.js for why).

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- Beast's server-side brain: what he studies each day + visitor memories.
CREATE TABLE IF NOT EXISTS beast_brain_days (
  day          TEXT PRIMARY KEY,
  apod_title   TEXT,
  apod_summary TEXT,
  apod_url     TEXT,
  moon_phase   TEXT,
  daily_fact   TEXT,
  refreshed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS beast_memories (
  id         INTEGER PRIMARY KEY,
  learned_on TEXT NOT NULL,
  question   TEXT NOT NULL,
  answer     TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_beast_memories_day ON beast_memories(learned_on);

-- Lightweight analytics: page views per day, and errors visitors hit.
-- No cookies, no fingerprints — one row per (day, page), incremented.
CREATE TABLE IF NOT EXISTS visit_days (
  day   TEXT NOT NULL,
  page  TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, page)
);

CREATE TABLE IF NOT EXISTS client_errors (
  id         INTEGER PRIMARY KEY,
  day        TEXT NOT NULL,
  page       TEXT,
  message    TEXT NOT NULL,
  source     TEXT,
  line       INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_client_errors_day ON client_errors(day);
