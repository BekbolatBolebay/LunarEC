-- =========================================================
-- CRM SCHEMA: 06_reservations.sql
-- Брондау жүйесі: Үстел брондары және қонақтармен байланыс
-- =========================================================

CREATE TABLE IF NOT EXISTS reservations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id           UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  table_id          UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  customer_name     TEXT NOT NULL,
  customer_phone    TEXT NOT NULL,
  customer_email    TEXT,
  guests_count      INTEGER NOT NULL DEFAULT 1,
  reservation_date  DATE NOT NULL,
  reservation_time  TIME NOT NULL,
  duration_minutes  INTEGER DEFAULT 120,
  status            TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  notes             TEXT,
  deposit_amount    NUMERIC(10, 2) DEFAULT 0.00,
  is_deposit_paid   BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(cafe_id, reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(cafe_id, status);

-- Брондау кезіндегі алдын-ала тағамдар (Pre-ordered Items)
CREATE TABLE IF NOT EXISTS reservation_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id  UUID REFERENCES reservations(id) ON DELETE CASCADE NOT NULL,
  menu_item_id    UUID REFERENCES menu_items(id) ON DELETE RESTRICT NOT NULL,
  quantity        INTEGER NOT NULL DEFAULT 1,
  price_at_time   NUMERIC(10, 2) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manage reservations"
  ON reservations FOR ALL
  USING (
    cafe_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
    OR cafe_id IN (SELECT cafe_id FROM staff_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Manage reservation items"
  ON reservation_items FOR ALL
  USING (reservation_id IN (
    SELECT id FROM reservations r
    WHERE r.cafe_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
       OR r.cafe_id IN (SELECT cafe_id FROM staff_profiles WHERE id = auth.uid())
  ));
