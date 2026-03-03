CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
VALUES (
  lower(hex(randomblob(16))),
  'admin@example.com',
  'admin123',
  'Admin',
  'admin',
  datetime('now'),
  datetime('now')
)
ON CONFLICT(email) DO UPDATE SET
  password_hash = excluded.password_hash,
  name = excluded.name,
  role = excluded.role,
  updated_at = datetime('now');

SELECT id, email, name, role, created_at, updated_at
FROM users
WHERE email = 'admin@example.com';
