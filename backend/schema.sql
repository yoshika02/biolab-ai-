-- ============================================
-- BioLab AI — Phase 1: Auth & Dashboard Tables
-- ============================================

-- 1. users
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'researcher', 'lab_assistant', 'professor')),
  department    TEXT,
  institution   TEXT,
  avatar_url    TEXT,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_login    TEXT,
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. sessions
CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  token       TEXT NOT NULL UNIQUE,
  expires_at  TEXT NOT NULL,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. activity_log
CREATE TABLE IF NOT EXISTS activity_log (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  action      TEXT NOT NULL,
  module      TEXT,
  metadata    TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. notifications
CREATE TABLE IF NOT EXISTS notifications (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('alert', 'info', 'warning')),
  title       TEXT NOT NULL,
  message     TEXT,
  link        TEXT,
  is_read     INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_sessions_user_id     ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token       ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires     ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_activity_user_id     ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created     ON activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user   ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
