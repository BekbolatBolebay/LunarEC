-- =========================================================
-- ERP SCHEMA: 06_odoo_integration.sql
-- Odoo ERP интеграциясы үшін байланыстыру өрістері
-- =========================================================

-- Мейрамхана кестесіне Odoo қосылу параметрлерін қосу
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS odoo_url      TEXT,
  ADD COLUMN IF NOT EXISTS odoo_db       TEXT,
  ADD COLUMN IF NOT EXISTS odoo_username TEXT,
  ADD COLUMN IF NOT EXISTS odoo_password TEXT,
  ADD COLUMN IF NOT EXISTS odoo_company_id INTEGER DEFAULT 1;

-- Мәзір тауарларына Odoo өнім ID-ін бекіту
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS odoo_id INTEGER;

-- Қойма тауарларына Odoo product_product ID бекіту
ALTER TABLE stock_items
  ADD COLUMN IF NOT EXISTS odoo_product_id INTEGER;

-- Тапсырыстарға Odoo Sale Order ID бекіту
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS odoo_order_id INTEGER;
