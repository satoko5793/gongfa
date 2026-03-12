CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  nickname VARCHAR(64),
  role VARCHAR(16) NOT NULL DEFAULT 'user',
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS participants (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  game_name VARCHAR(128) NOT NULL,
  need_help_this_week BOOLEAN NOT NULL,
  coupons_received INTEGER NOT NULL DEFAULT 0,
  game_id VARCHAR(64) NOT NULL,
  lian_gong_mode INTEGER NOT NULL,
  contact_wechat VARCHAR(64),
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_user ON participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);

CREATE TABLE IF NOT EXISTS admin_fields (
  id SERIAL PRIMARY KEY,
  participant_id INTEGER NOT NULL UNIQUE REFERENCES participants(id),
  coupons_given INTEGER NOT NULL DEFAULT 0,
  card_green INTEGER NOT NULL DEFAULT 0,
  card_blue INTEGER NOT NULL DEFAULT 0,
  card_purple INTEGER NOT NULL DEFAULT 0,
  card_orange INTEGER NOT NULL DEFAULT 0,
  card_red INTEGER NOT NULL DEFAULT 0,
  card_gold INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id SERIAL PRIMARY KEY,
  participant_id INTEGER NOT NULL REFERENCES participants(id),
  type VARCHAR(24) NOT NULL,
  amount INTEGER,
  card_type VARCHAR(16),
  card_count INTEGER,
  note TEXT,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_participant ON ledger_entries(participant_id);
CREATE INDEX IF NOT EXISTS idx_ledger_status ON ledger_entries(status);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  participant_id INTEGER REFERENCES participants(id),
  admin_id INTEGER REFERENCES users(id),
  action VARCHAR(32) NOT NULL,
  remark TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sms_codes (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_phone ON sms_codes(phone);
