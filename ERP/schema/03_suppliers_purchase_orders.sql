-- =========================================================
-- ERP SCHEMA: 03_suppliers_purchase_orders.sql
-- Жеткізушілер және Сатып алуға тапсырыстар (Procurement)
-- =========================================================

-- 1. Жеткізушілер базасы (Suppliers)
CREATE TABLE IF NOT EXISTS suppliers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id         UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  name            TEXT NOT NULL,
  contact_person  TEXT,
  phone           TEXT,
  email           TEXT,
  address         TEXT,
  bin_iin         TEXT, -- БИН / ИИН
  bank_details    TEXT,
  notes           TEXT,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 2. Сатып алу тапсырыстары (Purchase Orders)
CREATE TABLE IF NOT EXISTS purchase_orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id       UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  supplier_id   UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  order_number  TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'sent', 'received', 'cancelled')),
  total_amount  NUMERIC(12, 2) DEFAULT 0,
  expected_at   DATE,
  received_at   TIMESTAMPTZ,
  notes         TEXT,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 3. Сатып алу құжат элементтері (Purchase Order Items)
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE NOT NULL,
  stock_item_id     UUID REFERENCES stock_items(id) ON DELETE RESTRICT NOT NULL,
  qty               NUMERIC(12, 3) NOT NULL,
  price_per_unit    NUMERIC(12, 2) NOT NULL,
  total_price       NUMERIC(12, 2) GENERATED ALWAYS AS (qty * price_per_unit) STORED,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage suppliers"
  ON suppliers FOR ALL
  USING (cafe_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
      OR cafe_id IN (SELECT cafe_id FROM staff_profiles WHERE id = auth.uid()));

CREATE POLICY "Staff manage purchase orders"
  ON purchase_orders FOR ALL
  USING (cafe_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
      OR cafe_id IN (SELECT cafe_id FROM staff_profiles WHERE id = auth.uid()));

CREATE POLICY "Staff manage purchase order items"
  ON purchase_order_items FOR ALL
  USING (purchase_order_id IN (
    SELECT id FROM purchase_orders po
    WHERE po.cafe_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
       OR po.cafe_id IN (SELECT cafe_id FROM staff_profiles WHERE id = auth.uid())
  ));
