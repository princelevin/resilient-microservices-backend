CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price INTEGER NOT NULL,
  stock INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO products (name, price, stock)
VALUES
  ('Wireless Keyboard', 1299, 25),
  ('Gaming Mouse', 899, 40),
  ('USB-C Hub', 1999, 15)
ON CONFLICT DO NOTHING;