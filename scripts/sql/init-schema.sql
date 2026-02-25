BEGIN;

CREATE TABLE IF NOT EXISTS roles (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  login TEXT NOT NULL UNIQUE,
  password_plain TEXT NOT NULL,
  role_id BIGINT NOT NULL REFERENCES roles (id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS suppliers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS manufacturers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS product_categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS products (
  article TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  supplier_id BIGINT NOT NULL REFERENCES suppliers (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  manufacturer_id BIGINT NOT NULL REFERENCES manufacturers (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  category_id BIGINT NOT NULL REFERENCES product_categories (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  discount_percent INTEGER NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  stock_qty INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  description TEXT,
  photo TEXT
);

CREATE TABLE IF NOT EXISTS pickup_points (
  id INTEGER PRIMARY KEY,
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  street TEXT NOT NULL,
  house TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY,
  order_date DATE NOT NULL,
  delivery_date DATE NOT NULL,
  pickup_point_id INTEGER NOT NULL REFERENCES pickup_points (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  user_id BIGINT NOT NULL REFERENCES users (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  pickup_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  CHECK (delivery_date >= order_date)
);

CREATE TABLE IF NOT EXISTS order_items (
  order_id INTEGER NOT NULL REFERENCES orders (id) ON UPDATE CASCADE ON DELETE CASCADE,
  product_article TEXT NOT NULL REFERENCES products (article) ON UPDATE CASCADE ON DELETE RESTRICT,
  qty INTEGER NOT NULL CHECK (qty > 0),
  PRIMARY KEY (order_id, product_article)
);

CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products (supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_manufacturer_id ON products (manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_point_id ON orders (pickup_point_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_article ON order_items (product_article);

COMMIT;
