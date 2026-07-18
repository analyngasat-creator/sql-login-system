CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price REAL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    used_count INTEGER DEFAULT 0,
    max_uses INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS wishlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    product_name TEXT
);

CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comment TEXT
);

-- Seed Initial Data
INSERT OR IGNORE INTO products (name, price, description) VALUES 
('Apple Juice', 4.99, 'Freshly squeezed red apples.'),
('Orange Juice', 5.49, 'Pure citrus goodness.'),
('Secret Golden Juice', 999.99, 'ADMINS ONLY: Premium restricted formula.');

INSERT OR IGNORE INTO coupons (code, used_count, max_uses) VALUES ('SINGLE_USE_50', 0, 1);
INSERT OR IGNORE INTO wishlists (user_id, product_name) VALUES (1, 'Apple Juice'), (2, 'Secret Golden Juice');