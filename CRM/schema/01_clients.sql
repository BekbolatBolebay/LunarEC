-- =========================================================
-- CRM SCHEMA: 01_clients.sql
-- Клиенттер базасы, байланыс мәліметтері және статистикасы
-- =========================================================

CREATE TABLE IF NOT EXISTS clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id         UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name       TEXT NOT NULL,
  phone           TEXT NOT NULL,
  email           TEXT,
  avatar_url      TEXT,
  notes           TEXT,
  total_orders    INTEGER DEFAULT 0,
  total_spent     NUMERIC(12, 2) DEFAULT 0.00,
  last_order_at   TIMESTAMPTZ,
  tags            TEXT[] DEFAULT '{}',
  is_blocked      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cafe_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_clients_cafe_phone ON clients(cafe_id, phone);
CREATE INDEX IF NOT EXISTS idx_clients_cafe_spent ON clients(cafe_id, total_spent DESC);

-- Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff and Owner can manage restaurant clients"
  ON clients FOR ALL
  USING (
    cafe_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
    OR cafe_id IN (SELECT cafe_id FROM staff_profiles WHERE id = auth.uid())
  );
