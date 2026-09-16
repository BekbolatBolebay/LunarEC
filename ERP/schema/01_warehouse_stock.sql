-- =========================================================
-- ERP SCHEMA: 01_warehouse_stock.sql
-- Қойма және материалдық құндылықтар есебі (Inventory & Stock)
-- =========================================================

-- 1. Қойма категориялары (ет, көкөніс, сусындар, қаптама)
CREATE TABLE IF NOT EXISTS stock_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id     UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  color       TEXT DEFAULT '#6366f1',
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cafe_id, name)
);

-- 2. Қойма тауарлары / шикізаттары (Шикізат, жартылай фабрикат)
CREATE TABLE IF NOT EXISTS stock_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id         UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  category_id     UUID REFERENCES stock_categories(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  unit            TEXT NOT NULL DEFAULT 'кг', -- кг, л, дана, гр, мл
  current_stock   NUMERIC(12, 3) NOT NULL DEFAULT 0,
  min_stock       NUMERIC(12, 3) NOT NULL DEFAULT 0, -- Критикалық қалдық шегі
  cost_per_unit   NUMERIC(12, 2) NOT NULL DEFAULT 0, -- Өзіндік құн (теңге/бірлік)
  barcode         TEXT,
  expiry_date     DATE,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_items_cafe ON stock_items(cafe_id);

-- 3. Қойма қозғалысының журналдары (Кіріс, Шығыс, Ревизия, Есептен шығару)
CREATE TABLE IF NOT EXISTS stock_movements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id        UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  item_id        UUID REFERENCES stock_items(id) ON DELETE CASCADE NOT NULL,
  movement_type  TEXT NOT NULL
                 CHECK (movement_type IN ('in', 'out', 'waste', 'correction', 'order_auto_deduct')),
  qty            NUMERIC(12, 3) NOT NULL,
  cost_per_unit  NUMERIC(12, 2),
  total_cost     NUMERIC(12, 2),
  order_id       UUID REFERENCES orders(id) ON DELETE SET NULL,
  note           TEXT,
  created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_mov_cafe_item ON stock_movements(cafe_id, item_id);

-- RLS
ALTER TABLE stock_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage stock categories"
  ON stock_categories FOR ALL
  USING (cafe_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
      OR cafe_id IN (SELECT cafe_id FROM staff_profiles WHERE id = auth.uid()));

CREATE POLICY "Staff can manage stock items"
  ON stock_items FOR ALL
  USING (cafe_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
      OR cafe_id IN (SELECT cafe_id FROM staff_profiles WHERE id = auth.uid()));

CREATE POLICY "Staff can manage stock movements"
  ON stock_movements FOR ALL
  USING (cafe_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
      OR cafe_id IN (SELECT cafe_id FROM staff_profiles WHERE id = auth.uid()));
