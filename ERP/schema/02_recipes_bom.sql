-- =========================================================
-- ERP SCHEMA: 02_recipes_bom.sql
-- Технологиялық карталар (Рецептура / Bill of Materials)
-- Мәзір тағамына кететін қойма шикізатының мөлшері
-- =========================================================

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id        UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  menu_item_id   UUID REFERENCES menu_items(id) ON DELETE CASCADE NOT NULL,
  stock_item_id  UUID REFERENCES stock_items(id) ON DELETE RESTRICT NOT NULL,
  qty_required   NUMERIC(12, 4) NOT NULL, -- Мысалы: Бургерге 0.150 кг ет
  waste_percent  NUMERIC(5, 2) DEFAULT 0, -- Қалдық / пісіру кезіндегі шығын пайызы
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(menu_item_id, stock_item_id)
);

CREATE INDEX IF NOT EXISTS idx_recipe_menu_item ON recipe_ingredients(menu_item_id);

-- RLS
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage recipe ingredients"
  ON recipe_ingredients FOR ALL
  USING (cafe_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
      OR cafe_id IN (SELECT cafe_id FROM staff_profiles WHERE id = auth.uid()));
