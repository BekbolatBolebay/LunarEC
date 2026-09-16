-- =========================================================
-- CRM SCHEMA: 05_reviews.sql
-- Пікірлер мен бағалау: Клиент кері байланысы және модерация
-- =========================================================

CREATE TABLE IF NOT EXISTS reviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id        UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  order_id       UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_name  TEXT NOT NULL,
  customer_phone TEXT,
  rating         INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment        TEXT,
  photos         TEXT[] DEFAULT '{}',
  reply          TEXT,
  replied_at     TIMESTAMPTZ,
  is_published   BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_cafe ON reviews(cafe_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(cafe_id, rating);

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published reviews"
  ON reviews FOR SELECT
  USING (is_published = true);

CREATE POLICY "Staff can manage all reviews"
  ON reviews FOR ALL
  USING (
    cafe_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
    OR cafe_id IN (SELECT cafe_id FROM staff_profiles WHERE id = auth.uid())
  );
