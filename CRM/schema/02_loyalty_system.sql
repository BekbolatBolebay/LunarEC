-- =========================================================
-- CRM SCHEMA: 02_loyalty_system.sql
-- Адалдық бағдарламасы (Лояльность): Бонустық карталар және ұпайлар тарихы
-- =========================================================

-- 1. Жинақ / Бонус карталары
CREATE TABLE IF NOT EXISTS loyalty_cards (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id        UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  customer_id    UUID, -- profiles немесе auth.users
  customer_phone TEXT NOT NULL,
  points         INTEGER DEFAULT 0,
  total_spent    NUMERIC(12, 2) DEFAULT 0.00,
  tier           TEXT DEFAULT 'standard' CHECK (tier IN ('standard', 'silver', 'gold', 'platinum')),
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cafe_id, customer_phone)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_cafe_phone ON loyalty_cards(cafe_id, customer_phone);

-- 2. Бонус операцияларының тарихы (Транзакциялар)
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id      UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  card_id      UUID REFERENCES loyalty_cards(id) ON DELETE CASCADE NOT NULL,
  order_id     UUID REFERENCES orders(id) ON DELETE SET NULL,
  points_delta INTEGER NOT NULL, -- Оң (+) = есептелді, Теріс (-) = жұмсалды
  reason       TEXT DEFAULT 'order_earn'
               CHECK (reason IN ('order_earn', 'manual_adjust', 'order_redeem', 'birthday_bonus', 'welcome_bonus')),
  note         TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_tx_card ON loyalty_transactions(card_id);

-- 3. Мейрамхананың лояльность баптаулары (параметрлері)
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS loyalty_enabled          BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS loyalty_points_per_tenge NUMERIC(6,4) DEFAULT 0.01, -- Мысалы: әр 100 теңгеге 1 бонус (1%)
  ADD COLUMN IF NOT EXISTS loyalty_tenge_per_point  NUMERIC(6,4) DEFAULT 1.0;  -- 1 бонус = 1 теңге

-- RLS саясаттары
ALTER TABLE loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff and Owner manage loyalty cards"
  ON loyalty_cards FOR ALL
  USING (
    cafe_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
    OR cafe_id IN (SELECT cafe_id FROM staff_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Staff and Owner manage loyalty transactions"
  ON loyalty_transactions FOR ALL
  USING (
    cafe_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
    OR cafe_id IN (SELECT cafe_id FROM staff_profiles WHERE id = auth.uid())
  );
