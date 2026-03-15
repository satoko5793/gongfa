CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  role VARCHAR(16) NOT NULL DEFAULT 'user',
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  auth_provider VARCHAR(16) NOT NULL DEFAULT 'bind',
  game_role_id VARCHAR(64) NOT NULL,
  game_server VARCHAR(64) NOT NULL,
  game_role_name VARCHAR(128) NOT NULL,
  bind_token_id VARCHAR(128),
  nickname VARCHAR(128),
  password_hash TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT users_role_check CHECK (role IN ('user', 'admin')),
  CONSTRAINT users_status_check CHECK (status IN ('active', 'disabled')),
  CONSTRAINT users_auth_provider_check CHECK (auth_provider IN ('bind', 'password'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_role_server_unique
  ON users(game_role_id, game_server);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_password_game_role_id_unique
  ON users(game_role_id)
  WHERE auth_provider='password';
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE TABLE IF NOT EXISTS product_imports (
  id SERIAL PRIMARY KEY,
  source_type VARCHAR(32) NOT NULL DEFAULT 'upload',
  source_file_name VARCHAR(255),
  raw_json JSONB NOT NULL,
  imported_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT product_imports_source_type_check
    CHECK (source_type IN ('upload', 'helper_bridge'))
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  import_id INTEGER REFERENCES product_imports(id),
  legacy_id INTEGER NOT NULL,
  uid VARCHAR(128) NOT NULL,
  name VARCHAR(128) NOT NULL,
  image_url TEXT,
  attack_value INTEGER NOT NULL DEFAULT 0,
  hp_value INTEGER NOT NULL DEFAULT 0,
  main_attrs TEXT NOT NULL DEFAULT '',
  ext_attrs TEXT NOT NULL DEFAULT '',
  price_quota INTEGER NOT NULL DEFAULT 0,
  manual_price_quota INTEGER,
  pricing_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  stock INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT products_status_check
    CHECK (status IN ('draft', 'on_sale', 'off_sale', 'sold')),
  CONSTRAINT products_price_quota_check CHECK (price_quota >= 0),
  CONSTRAINT products_manual_price_quota_check
    CHECK (manual_price_quota IS NULL OR manual_price_quota >= 0),
  CONSTRAINT products_stock_check CHECK (stock >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_uid_unique ON products(uid);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_legacy_id ON products(legacy_id);

CREATE TABLE IF NOT EXISTS bundle_skus (
  id SERIAL PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  image_url TEXT,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  price_quota INTEGER NOT NULL DEFAULT 0,
  stock INTEGER,
  status VARCHAR(16) NOT NULL DEFAULT 'on_sale',
  display_rank INTEGER NOT NULL DEFAULT 999,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT bundle_skus_status_check CHECK (status IN ('on_sale', 'off_sale', 'sold')),
  CONSTRAINT bundle_skus_price_quota_check CHECK (price_quota >= 0),
  CONSTRAINT bundle_skus_stock_check CHECK (stock IS NULL OR stock >= 0)
);

CREATE INDEX IF NOT EXISTS idx_bundle_skus_status ON bundle_skus(status);
CREATE INDEX IF NOT EXISTS idx_bundle_skus_display_rank ON bundle_skus(display_rank, updated_at DESC);

CREATE TABLE IF NOT EXISTS user_quota_accounts (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  total_quota INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  remark TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT orders_status_check
    CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  CONSTRAINT orders_total_quota_check CHECK (total_quota >= 0)
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_kind VARCHAR(16) NOT NULL DEFAULT 'card',
  product_id INTEGER REFERENCES products(id),
  bundle_sku_id INTEGER REFERENCES bundle_skus(id),
  product_name VARCHAR(128) NOT NULL,
  product_snapshot JSONB NOT NULL,
  price_quota INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT order_items_item_kind_check CHECK (item_kind IN ('card', 'bundle')),
  CONSTRAINT order_items_item_ref_check CHECK (
    (item_kind = 'card' AND product_id IS NOT NULL AND bundle_sku_id IS NULL)
    OR
    (item_kind = 'bundle' AND product_id IS NULL AND bundle_sku_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

INSERT INTO bundle_skus
  (code, name, description, tags, price_quota, stock, status, display_rank, created_at, updated_at)
VALUES
  ('atlas_orange_and_below', '橙卡及以下图鉴', '用于补齐橙卡及以下图鉴，词条不计入套餐价值。', ARRAY['图鉴', '橙卡及以下', '固定价'], 1000, NULL, 'on_sale', 10, NOW(), NOW()),
  ('atlas_red_and_below', '红及以下图鉴', '用于补齐红卡及以下图鉴，优先满足图鉴需求。', ARRAY['图鉴', '红及以下', '固定价'], 3000, NULL, 'on_sale', 20, NOW(), NOW()),
  ('atlas_full_attack_set', '满攻击全套图鉴', '按满攻击标准提供整套图鉴，不强调词条。', ARRAY['图鉴', '满攻击', '全套'], 15000, NULL, 'on_sale', 30, NOW(), NOW()),
  ('atlas_high_attack_full_dex', '高攻全图鉴', '按高攻击目标提供整套图鉴，优先图鉴价值。', ARRAY['图鉴', '高攻', '全图鉴'], 8000, NULL, 'on_sale', 40, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

DELETE FROM bundle_skus
WHERE code IN ('double_term_bundle', 'rare_supreme_single')
  AND NOT EXISTS (
    SELECT 1
    FROM order_items oi
    WHERE oi.bundle_sku_id = bundle_skus.id
  );

UPDATE bundle_skus
SET status='off_sale', updated_at=NOW()
WHERE code IN ('double_term_bundle', 'rare_supreme_single')
  AND EXISTS (
    SELECT 1
    FROM order_items oi
    WHERE oi.bundle_sku_id = bundle_skus.id
  );

CREATE TABLE IF NOT EXISTS quota_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  change_amount INTEGER NOT NULL,
  type VARCHAR(32) NOT NULL,
  order_id INTEGER REFERENCES orders(id),
  remark TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT quota_logs_type_check
    CHECK (type IN ('admin_add', 'admin_subtract', 'order_deduct', 'order_refund'))
);

CREATE INDEX IF NOT EXISTS idx_quota_logs_user_id ON quota_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_quota_logs_order_id ON quota_logs(order_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  actor_user_id INTEGER REFERENCES users(id),
  target_type VARCHAR(32) NOT NULL,
  target_id INTEGER NOT NULL,
  action VARCHAR(64) NOT NULL,
  detail JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT audit_logs_target_type_check
    CHECK (target_type IN ('product', 'user', 'order', 'import'))
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
