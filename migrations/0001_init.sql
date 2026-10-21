-- AapkiKitab database (Cloudflare D1)

-- Every piece of editable content: products, homepage, menus, tiles, reviews, chats, policies…
-- `type` matches shared/content-types.ts; `data` holds the fields as JSON.
CREATE TABLE entries (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  handle TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',          -- active | draft
  position INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (type, handle)
);
CREATE INDEX entries_type ON entries (type, status, updated_at);

-- Photos and videos (bytes live in KV under the same key)
CREATE TABLE media (
  key TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  duration INTEGER,                                -- seconds, videos only
  alt TEXT NOT NULL DEFAULT '',
  uploaded_by TEXT NOT NULL DEFAULT 'admin',      -- admin | customer:<id>
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  addresses TEXT NOT NULL DEFAULT '[]',            -- JSON list
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  last_login_at TEXT
);

-- One-time sign-in codes (only a hash is stored)
CREATE TABLE login_codes (
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'customer',        -- customer | admin
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX login_codes_email ON login_codes (email, purpose);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  kind TEXT NOT NULL,                              -- customer | admin
  subject TEXT NOT NULL,                           -- customer id or admin email
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  number INTEGER NOT NULL UNIQUE,                  -- shown as #1001
  customer_id TEXT,
  email TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,                           -- JSON {line, city, state, pincode}
  items TEXT NOT NULL,                             -- JSON [{id, handle, title, price, qty, image}]
  subtotal INTEGER NOT NULL,
  shipping INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',          -- pending | paid | packed | shipped | delivered | cancelled
  payment_status TEXT NOT NULL DEFAULT 'unpaid',   -- unpaid | paid | refunded | partially_refunded | failed
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT,
  refunded INTEGER NOT NULL DEFAULT 0,
  courier TEXT NOT NULL DEFAULT '',
  tracking_number TEXT NOT NULL DEFAULT '',
  tracking_url TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',                   -- private note for the team
  history TEXT NOT NULL DEFAULT '[]',              -- JSON [{at, text}]
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  paid_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX orders_email ON orders (email);
CREATE INDEX orders_status ON orders (status, created_at);

CREATE TABLE counters (name TEXT PRIMARY KEY, value INTEGER NOT NULL);
INSERT INTO counters (name, value) VALUES ('order_number', 1000);
