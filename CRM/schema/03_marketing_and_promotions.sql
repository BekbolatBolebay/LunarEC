-- =========================================================
-- CRM SCHEMA: 03_marketing_and_promotions.sql
-- Маркетинг: Промокодтар, жеңілдіктер және жарнама банерлері
-- =========================================================

-- 1. Промокодтар мен Акциялар
CREATE TABLE IF NOT EXISTS promotions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id           UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  code              TEXT NOT NULL,
  title             TEXT,
  description       TEXT,
  discount_type     TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value    NUMERIC(10, 2) NOT NULL,
  min_order_amount  NUMERIC(10, 2) DEFAULT 0.00,
  max_discount      NUMERIC(10, 2), -- Пайыздық жеңілдік кезіндегі максимум сома
  start_date        TIMESTAMPTZ DEFAULT now(),
  end_date          TIMESTAMPTZ,
  usage_limit       INTEGER, -- Жалпы қолдану шегі (NULL = шексіз)
  times_used        INTEGER DEFAULT 0,
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cafe_id, code)
);

CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(cafe_id, code);

-- 2. Қосымшадағы жарнама банерлері
CREATE TABLE IF NOT EXISTS banners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id     UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL,
  subtitle    TEXT,
  image_url   TEXT NOT NULL,
  link_url    TEXT,
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manage promotions"
  ON promotions FOR ALL
  USING (
    cafe_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
    OR cafe_id IN (SELECT cafe_id FROM staff_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Manage banners"
  ON banners FOR ALL
  USING (
    cafe_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
    OR cafe_id IN (SELECT cafe_id FROM staff_profiles WHERE id = auth.uid())
  );
